import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fixture, browser, browserErrors, args } from './nova_skin_appearance.browser.mjs';

const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const results = [];
const modes = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
const screens = [[360,800],[390,844],[768,1024],[844,390],[1024,600],[1280,720],[1366,768],[1920,1080],[2560,1080],[3840,2160]];
async function scenario(name, run) {
  if (args['--filter'] && !name.includes(args['--filter'])) return;
  let page;
  try {
    page = await run(value => { page = value; });
    if (page) assert.deepEqual(browserErrors.get(page), [], 'no uncaught script errors');
    results.push({ name, status: 'passed' });
  } catch (error) {
    const record = { name, status: 'failed', message: error.message };
    if (page && !page.isClosed()) {
      record.state = await page.evaluate(() => window.novaFixture?.state()).catch(() => null);
      record.geometry = await page.evaluate(() => ['.scroll','.scroll__content','.scroll__body','.nova-skin-root','[data-nova-focus="item:19"]'].map(selector=>{const node=document.querySelector(selector);if(!node)return {selector};const r=node.getBoundingClientRect();return {selector,top:r.top,bottom:r.bottom,height:r.height,width:r.width,left:r.left,right:r.right,scrollHeight:node.scrollHeight,scrollTop:node.scrollTop,transform:getComputedStyle(node).transform};})).catch(()=>null);
      await page.screenshot({ path: join(output, name + '-failed.png') }).catch(() => {});
    }
    results.push(record);
    console.log('FAIL', name, error.message);
  } finally { if (page && !page.isClosed()) await page.close(); }
}
async function visible(page, selector) {
  return page.locator(selector).first().evaluate(node => {
    const rect = node.getBoundingClientRect();
    const content = node.querySelector('.nova-card__thumb');
    const horizontal = content ? content.getBoundingClientRect() : rect;
    const decoration = rect.width * .01;
    return rect.width > 0 && rect.height > 0 && horizontal.left >= -decoration && horizontal.right <= innerWidth + decoration && rect.top >= 78 && rect.bottom <= innerHeight + 3;
  });
}
const real = { nativeController: true, nativeScroll: true, nativeKeypad: true };
async function swipe(page, x, y, dx, dy) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type:'touchStart',touchPoints:[{x,y}] });
  for (let step=1;step<=10;step++) {
    await session.send('Input.dispatchTouchEvent', { type:'touchMove',touchPoints:[{x:x+dx*step/10,y:y+dy*step/10}] });
    await page.waitForTimeout(15);
  }
  await session.send('Input.dispatchTouchEvent', { type:'touchEnd',touchPoints:[] });
  await session.detach(); await page.waitForTimeout(250);
}
try {
  for (const [width, height] of screens) for (const mode of modes) {
    await scenario('screen-' + mode + '-' + width + 'x' + height, async register => {
      const page = await fixture(mode, { ...real, touch: width < 1000, dpr: width < 500 ? 3 : 1, logo: true, count: 45, longText: width < 1000 }, width, height); register(page);
      assert.equal(await page.locator('.nova-skin-root').count(), mode === 'native' ? 0 : 1, 'one active layout or native startup');
      assert.equal(await page.locator('.nova-bwa-scope').count(), ['native','nova'].includes(mode) ? 0 : 1, 'scope belongs only to the selected appearance');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), true, 'no horizontal page overflow');
      if (mode !== 'native') {
        const font = await page.locator('.nova-card').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
        assert.ok(font >= 12, 'readable episode font, actual ' + font);
        await page.evaluate(() => novaFixture.focus('item:19'));
        await page.waitForFunction(() => {const rect=document.querySelector('[data-nova-focus="item:19"]').getBoundingClientRect();return rect.top>=78 && rect.bottom<=innerHeight+3;},null,{timeout:3500});
        assert.equal(await visible(page, '[data-nova-focus="item:19"]'), true, 'focused last visible-page episode stays inside the screen');
      }
      await page.screenshot({ path: join(output, mode + '-' + width + 'x' + height + '.png') });
      return page;
    });
  }
  for (const mode of ['filmstrip','credits','credits_plus']) {
    await scenario('resize-focus-' + mode, async register => {
      const page=await fixture(mode,{...real,count:45},1366,768);register(page);
      await page.evaluate(()=>novaFixture.focus('item:19'));
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
      assert.equal(await visible(page,'[data-nova-focus="item:19"]'),true,'focused episode remains visible after narrowing');
      await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(500);
      assert.equal(await visible(page,'[data-nova-focus="item:19"]'),true,'focused episode remains visible after widening');
      return page;
    });
    await scenario('actors-wheel-' + mode, async register => {
      const page = await fixture(mode, { ...real, people: 10 }, 1280,720); register(page);
      await page.locator('[data-nova-focus="appearance:details"]').click();
      await page.waitForTimeout(50);
      const strip = page.locator('.bwv-info__p');
      assert.ok(await strip.evaluate(node => node.scrollWidth > node.clientWidth), 'actor row needs scrolling');
      await strip.hover(); await page.mouse.wheel(0, 1300); await page.waitForTimeout(100);
      assert.ok(await strip.evaluate(node => node.scrollLeft > 0), 'wheel reaches actors beyond the visible row');
      return page;
    });
    await scenario('details-resize-' + mode, async register => {
      const page = await fixture(mode, { ...real }, 390,844); register(page);
      await page.evaluate(() => novaFixture.enter('appearance:details'));
      assert.equal(await page.locator('.bwv-info').count(), 1, 'details panel opens');
      await page.setViewportSize({ width:1920, height:1080 });
      await page.waitForTimeout(80);
      assert.equal(await page.locator('.nova-skin-root > .bwv-info').count(), 1, 'details moves back to desktop root after orientation change');
      await page.setViewportSize({ width:390, height:844 });
      await page.waitForTimeout(80);
      assert.equal(await page.locator('.nova-skin-root > .bwv-info').count(), 0, 'details belongs to mobile content after orientation change');
      return page;
    });
  }
  for (const mode of modes) await scenario('touch-' + mode, async register => {
    const page = await fixture(mode, { ...real,touch:true,dpr:3,count:45 },390,844); register(page);
    const scroll = page.locator('.fixture .scroll');
    const beforeSwipe=(await page.evaluate(()=>fixtureActions)).filter(action=>action[0]==='play').length;
    await swipe(page,195,700,0,-450);
    assert.ok(await scroll.evaluate(node=>node.scrollTop>0), 'phone swipe scrolls the page');
    assert.equal((await page.evaluate(()=>fixtureActions)).filter(action=>action[0]==='play').length,beforeSwipe,'swipe cannot start playback');
    const card = page.locator(mode === 'native' ? '.online-prestige--full' : '.nova-card').first();
    await card.scrollIntoViewIfNeeded(); await card.tap(); await page.waitForTimeout(60);
    assert.equal((await page.evaluate(()=>fixtureActions)).filter(action=>action[0]==='play').length,beforeSwipe+1, 'one phone tap plays one selected episode');
    if (mode === 'filmstrip') {
      const rail=page.locator('.bwv-rail'); await rail.scrollIntoViewIfNeeded();
      const rect=await rail.boundingBox(); await swipe(page,320,Math.min(rect.y+40,780),-240,0);
      assert.ok(await rail.evaluate(node=>node.scrollLeft>0), 'phone horizontal swipe scrolls episode filmstrip');
    }
    await page.setViewportSize({width:844,height:390}); await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'phone rotation has no page overflow');
    return page;
  });
  for (const mode of ['nova','poster','filmstrip','credits','credits_plus']) for (const input of ['mouse','mouse_pc']) await scenario('mouse-' + mode + '-' + input, async register => {
    const page = await fixture(mode,{...real,input,sources:32,seasons:32,count:45},1366,768); register(page);
    if(mode==='credits_plus') {await page.locator('[data-nova-focus="appearance:settings"]').click();await page.waitForTimeout(40);}
    await page.locator('[data-nova-focus="source"]').click(); await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>novaFixture.state().open),'source','mouse opens source selector');
    const panel=page.locator(mode==='credits' ? '.nova-layout__aside' : mode==='credits_plus' ? '.nova-layout__drawer' : mode==='filmstrip' ? '.bwv-chips' : '.fixture .scroll');
    const option=page.locator('.nova-drop .nova-chip').last();
    // Core Mouse PC scrolls pixels, while ordinary mouse mode may advance the
    // focus by a row. Use actual wheel events until the last option is visible;
    // one huge delta can legitimately scroll past it into the episode list.
    for(let step=0;step<16;step++) {
      const rect=await option.boundingBox();
      if(rect.y>=88 && rect.y+rect.height<=760) break;
      const delta=rect.y<88 ? Math.max(-640,rect.y-96) : Math.min(640,rect.y+rect.height-748);
      await panel.hover();await page.mouse.wheel(0,delta);await page.waitForTimeout(200);
    }
    assert.equal(await option.evaluate(node=>{const r=node.getBoundingClientRect();return r.top>=80 && r.bottom<=innerHeight;}),true,'mouse wheel reaches the last source option');
    await option.click();await page.waitForTimeout(100);
    assert.ok((await page.evaluate(()=>fixtureActions)).some(action=>action[0]==='filter'&&action[1]==='sort'),'mouse selection invokes original source filter');
    const card=page.locator('.nova-card').first();await card.scrollIntoViewIfNeeded();
    const before=(await page.evaluate(()=>fixtureActions)).filter(action=>action[0]==='play').length;
    await card.click();await page.waitForTimeout(50);
    assert.equal((await page.evaluate(()=>fixtureActions)).filter(action=>action[0]==='play').length,before+1,'one mouse click starts one episode');
    return page;
  });
  for(const code of [8,27,461,10009,88]) await scenario('remote-back-'+code,async register=>{
    const page=await fixture('credits',{...real,input:'remote'},1280,720);register(page);
    await page.evaluate(()=>novaFixture.focus('source'));await page.keyboard.press('Enter');
    await page.evaluate(code=>{window.dispatchEvent(new KeyboardEvent('keydown',{keyCode:code,which:code,bubbles:true,cancelable:true}));window.dispatchEvent(new KeyboardEvent('keyup',{keyCode:code,which:code,bubbles:true,cancelable:true}));},code);
    assert.equal(await page.evaluate(()=>novaFixture.state().open),'','TV Back alias closes source selector');
    await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>novaFixture.state().open),'source','OK reopens source after TV Back');
    return page;
  });
  for (const mode of ['nova','poster','filmstrip','credits','credits_plus']) for (const input of ['remote','mouse','mouse_pc']) {
    await scenario('input-' + mode + '-' + input, async register => {
      const page = await fixture(mode, { ...real, input, seasons:32, sources:32, voices:32, count:45 },1366,768); register(page);
      await page.evaluate(() => novaFixture.focus('item:0'));
      await page.keyboard.press(mode === 'filmstrip' ? 'ArrowRight' : 'ArrowDown');
      const focus = await page.evaluate(() => novaFixture.currentFocus());
      assert.ok(focus.startsWith('item:') && focus !== 'item:0', 'Keypad arrows move episode focus through Controller');
      await page.keyboard.press('Enter');
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'play'), 'Keypad OK delegates to original provider');
      await page.evaluate(() => novaFixture.focus('item:1'));
      await page.keyboard.down('Enter'); await page.waitForTimeout(850); await page.keyboard.up('Enter');
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'long'), 'holding OK opens original provider context menu');
      if (mode === 'credits_plus') { await page.evaluate(() => novaFixture.focus('item:0')); await page.evaluate(() => novaFixture.enter('appearance:settings')); }
      const setting = mode === 'poster' ? 'source' : 'season';
      await page.evaluate(key => novaFixture.focus(key), setting);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => novaFixture.state().open), setting, 'OK opens requested setting');
      await page.keyboard.press('Escape');
      if (mode !== 'nova') assert.equal(await page.evaluate(() => novaFixture.state().open), '', 'Back closes options or drawer');
      if (mode === 'credits_plus') { await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.enter('appearance:settings'); }); }
      if (mode !== 'nova' && mode !== 'poster') {
        await page.evaluate(() => novaFixture.focus('season'));
        await page.keyboard.press('Enter');
        for (let index=0; index<27; index++) await page.keyboard.press(mode === 'filmstrip' ? 'ArrowRight' : 'ArrowDown');
        assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'season:27', 'remote can reach late seasons');
        assert.equal(await visible(page, '[data-nova-focus="season:27"]'), true, 'late season remains visible');
      }
      return page;
    });
  }
  for (const mode of modes) await scenario('native-cycle-' + mode, async register => {
    const page = await fixture('nova', { ...real },1280,720); register(page);
    for (const target of [mode,'native','credits_plus','native','nova']) {
      await page.evaluate(target => novaFixture.apply(target),target); await page.waitForTimeout(40);
      assert.equal(await page.locator('.nova-skin-root').count(),target === 'native' ? 0 : 1, 'switch keeps one layout');
      assert.equal(await page.locator('.nova-bwa-scope').count(), ['native','nova'].includes(target) ? 0 : 1, 'switch restores proper CSS scope');
    }
    return page;
  });
} finally {
  writeFileSync(join(output,'results.json'),JSON.stringify({ total:results.length, passed:results.filter(x=>x.status==='passed').length, failed:results.filter(x=>x.status==='failed').length,results },null,2));
  console.log(JSON.stringify({ total:results.length, passed:results.filter(x=>x.status==='passed').length, failed:results.filter(x=>x.status==='failed').length, report:join(output,'results.json') }));
  await browser.close();
}
if(results.some(x=>x.status==='failed')) process.exitCode=1;
