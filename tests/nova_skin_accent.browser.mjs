import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fixture, browser, browserErrors, args } from './nova_skin_appearance.browser.mjs';

// Changing an accent must not rebuild the activity, its nodes or its controls.
// Inspect the real generated skin and the current Lampa controller in the browser.
const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const results = [];
const modes = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
const palettes = { lavender: '165, 180, 252', blue: '116, 185, 255', mint: '100, 216, 195', gold: '216, 181, 106', silver: '199, 205, 216' };
const selectedPalettes = args['--palettes'] ? args['--palettes'].split(',') : Object.keys(palettes);
for (const palette of selectedPalettes) assert.ok(Object.hasOwn(palettes, palette), 'unknown test palette ' + palette);
const real = { nativeController: true, nativeScroll: true, nativeKeypad: true, sources: 24, seasons: 24, voices: 24, people: 12, count: 45 };

async function scenario(name, run) {
  if (args['--filter'] && !name.includes(args['--filter'])) return;
  let page;
  try {
    await run(value => { page = value; });
    assert.deepEqual(browserErrors.get(page), [], 'no uncaught script errors');
    results.push({ name, status: 'passed' });
  } catch (error) {
    const record = { name, status: 'failed', message: error.message };
    if (page && !page.isClosed()) {
      record.state = await page.evaluate(() => novaFixture.state()).catch(() => null);
      await page.screenshot({ path: join(output, name + '-failed.png') }).catch(() => {});
    }
    results.push(record);
    console.log('FAIL', name, error.message);
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
}

async function settle(page) {
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
}

async function prepare(page) {
  await page.addStyleTag({ content: '*,:before,:after{transition:none!important;animation:none!important;scroll-behavior:auto!important}' });
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const color = /rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b/gi;
    const tracked = [
      'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'box-sizing',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
      'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'white-space', 'text-align', 'text-overflow',
      'overflow-x', 'overflow-y', 'flex-basis', 'flex-grow', 'flex-shrink', 'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content',
      'grid-template-columns', 'grid-template-rows', 'column-gap', 'row-gap', 'transform', 'opacity', 'visibility', 'pointer-events', 'z-index', 'content',
      'outline-width', 'outline-style', 'outline-offset', 'background-size', 'background-position', 'background-repeat',
      'color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
      'outline-color', 'box-shadow', 'text-shadow', 'text-decoration-color', 'fill', 'stroke', '--bwa-rgb'
    ];
    window.accentTest = {
      style(node, pseudo, allowColor) {
        const computed = getComputedStyle(node, pseudo), values = {};
        // A pseudo with no content has no rendered box. Retain its content
        // state so an accidental creation still fails without re-reading
        // hundreds of inherited properties for every absent pseudo element.
        if (pseudo && (computed.content === 'none' || computed.content === 'normal')) return { content: computed.content };
        for (const property of tracked) {
          let value = computed.getPropertyValue(property);
          if (allowColor) {
            if (property === '--bwa-rgb') value = '<rgb>';
            else if (/color|shadow|^background-image$|^fill$|^stroke$/.test(property)) value = value.replace(color, '<color>');
          }
          values[property] = value;
        }
        return values;
      },
      attrs(node) { return [...node.attributes].map(attr => [attr.name, attr.value]).sort((a, b) => a[0].localeCompare(b[0])); },
      rect(node) { const rect = node.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height]; },
      text(node) { return node.tagName === 'STYLE' ? '' : [...node.childNodes].filter(child => child.nodeType === 3).map(child => child.nodeValue).join(''); },
      capture(allowColor) {
        this.allowColor = allowColor;
        this.nodes = [...document.body.querySelectorAll('*')];
        this.values = this.nodes.map(node => ({
          attrs: this.attrs(node), rect: this.rect(node), text: this.text(node), scroll: [node.scrollLeft, node.scrollTop],
          style: this.style(node, null, allowColor), before: this.style(node, '::before', allowColor), after: this.style(node, '::after', allowColor)
        }));
        this.focus = [...document.querySelectorAll('.focus')];
        this.state = JSON.stringify(novaFixture.state());
        this.actions = JSON.stringify(fixtureActions);
        this.controller = Lampa.Controller.enabled().name;
        this.styleNode = document.getElementById('nova-appearance-css');
        this.styleCount = document.querySelectorAll('#nova-appearance-css').length;
      },
      compare() {
        const now = [...document.body.querySelectorAll('*')], failures = [];
        if (now.length !== this.nodes.length) failures.push('DOM element count changed');
        for (let index = 0; index < this.nodes.length && failures.length < 12; index++) {
          const node = this.nodes[index], expected = this.values[index];
          const label = node.getAttribute('data-nova-focus') || node.className || node.tagName;
          if (now[index] !== node || !node.isConnected) { failures.push(label + ': DOM node was replaced or moved'); continue; }
          const actual = {
            attrs: this.attrs(node), rect: this.rect(node), text: this.text(node), scroll: [node.scrollLeft, node.scrollTop],
            style: this.style(node, null, this.allowColor), before: this.style(node, '::before', this.allowColor), after: this.style(node, '::after', this.allowColor)
          };
          for (const key of Object.keys(expected)) {
            if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
              if (key === 'style' || key === 'before' || key === 'after') {
                const changed = Object.keys(expected[key]).filter(property => actual[key][property] !== expected[key][property]);
                failures.push(label + ': ' + key + ' changed ' + changed.slice(0, 5).join(', '));
              } else failures.push(label + ': ' + key + ' changed');
            }
          }
        }
        const focus = [...document.querySelectorAll('.focus')];
        if (focus.length !== this.focus.length || focus.some((node, index) => node !== this.focus[index])) failures.push('focus changed');
        if (JSON.stringify(novaFixture.state()) !== this.state) failures.push('open controls or stored focus changed');
        if (JSON.stringify(fixtureActions) !== this.actions) failures.push('an action or Activity.replace was triggered');
        if (Lampa.Controller.enabled().name !== this.controller) failures.push('controller changed');
        if (document.getElementById('nova-appearance-css') !== this.styleNode || document.querySelectorAll('#nova-appearance-css').length !== this.styleCount) failures.push('appearance style node was replaced or duplicated');
        return failures;
      }
    };
  });
}

async function applyAndCompare(page, palette, label) {
  await page.evaluate(value => novaFixture.chooseAccent(value), palette);
  await settle(page);
  assert.equal(await page.evaluate(() => novaFixture.accent()), palette, label + ': selected accent persists');
  assert.deepEqual(await page.evaluate(() => accentTest.compare()), [], label + ': only colors change');
}

async function assertAccent(page, mode, palette, target) {
  const rgb = palettes[palette];
  const values = await page.locator(target).first().evaluate(node => {
    const style = getComputedStyle(node);
    return [style.borderTopColor, style.outlineColor, style.boxShadow, style.backgroundColor, style.backgroundImage, style.color].join('|');
  });
  assert.ok(values.includes('rgb(' + rgb + ')') || values.includes('rgba(' + rgb + ','), mode + ' displays ' + palette + ' on ' + target + ': ' + values);
}

try {
  for (const [screen, width, height] of [['desktop', 1366, 768], ['phone', 390, 844]]) {
    for (const mode of modes) await scenario('switch-' + screen + '-' + mode, async register => {
      const page = await fixture(mode, { ...real, touch: screen === 'phone', input: screen === 'phone' ? 'mouse' : 'remote' }, width, height); register(page);
      await prepare(page);
      assert.equal(await page.evaluate(() => novaFixture.accent()), 'lavender', 'lavender is the default');
      if (mode !== 'native') {
        await page.evaluate(() => novaFixture.focus('item:0'));
        await settle(page);
      }
      // Keep a genuine nonzero scroll offset on the phone while changing colors.
      if (screen === 'phone') {
        await page.locator('.fixture .scroll').evaluate(node => { node.scrollTop = Math.min(150, node.scrollHeight - node.clientHeight); });
        await settle(page);
      }
      await page.evaluate(allow => accentTest.capture(allow), !['native', 'nova'].includes(mode));
      for (const palette of selectedPalettes) {
        await applyAndCompare(page, palette, screen + ' ' + mode + ' ' + palette);
        if (!['native', 'nova'].includes(mode)) {
          // Native touch/mouse movement may clear hover focus while scrolling.
          // Preserve that state and inspect a focus ring only when it exists.
          if (await page.locator('[data-nova-focus="item:0"].focus').count()) await assertAccent(page, mode, palette, '[data-nova-focus="item:0"]');
          await assertAccent(page, mode, palette, '[data-nova-focus="item:0"] .bwa-ep__prog>i');
          if (mode === 'poster') {
            await assertAccent(page, mode, palette, '.bwa-play');
            await assertAccent(page, mode, palette, '[data-nova-focus="item:0"] .bwa-ep__badge');
          }
          await page.screenshot({ path: join(output, screen + '-' + mode + '-' + palette + '.png') });
        }
      }
      // The same event handlers must still dispatch a single playback action.
      if (mode !== 'native') {
        const before = await page.evaluate(() => fixtureActions.filter(action => action[0] === 'play').length);
        await page.evaluate(() => novaFixture.enter('item:0'));
        assert.equal(await page.evaluate(() => fixtureActions.filter(action => action[0] === 'play').length), before + 1, 'existing episode handler still plays exactly once');
      }
    });
    for (const mode of ['poster', 'filmstrip', 'credits', 'credits_plus']) await scenario('open-options-' + screen + '-' + mode, async register => {
      const page = await fixture(mode, { ...real, touch: screen === 'phone' }, width, height); register(page);
      await prepare(page);
      if (mode === 'credits_plus') await page.evaluate(() => novaFixture.enter('appearance:settings'));
      await page.evaluate(() => novaFixture.enter('source'));
      const option = page.locator('.nova-drop .nova-chip').nth(5);
      const key = await option.getAttribute('data-nova-focus');
      await page.evaluate(value => novaFixture.focus(value), key);
      await settle(page);
      await page.evaluate(() => accentTest.capture(true));
      for (const palette of selectedPalettes) await applyAndCompare(page, palette, screen + ' ' + mode + ' open source options');
      assert.ok(await option.isVisible(), 'the same option remains available after changing colors');
      await page.evaluate(value => novaFixture.enter(value), key);
      await page.waitForTimeout(60);
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'filter' && action[1] === 'sort'), 'the existing option handler still selects a source');
    });
    for (const mode of ['filmstrip', 'credits', 'credits_plus']) await scenario('open-details-' + screen + '-' + mode, async register => {
      const page = await fixture(mode, { ...real, touch: screen === 'phone' }, width, height); register(page);
      await prepare(page);
      await page.evaluate(() => novaFixture.enter('appearance:details'));
      assert.equal(await page.locator('.bwv-info').count(), 1, 'details is open');
      await page.evaluate(() => novaFixture.focus('appearance:person:5'));
      await page.locator('.bwv-info__p').evaluate(node => { node.scrollLeft = Math.min(100, node.scrollWidth - node.clientWidth); });
      await settle(page);
      await page.evaluate(() => accentTest.capture(true));
      for (const palette of selectedPalettes) {
        await applyAndCompare(page, palette, screen + ' ' + mode + ' open details');
        await assertAccent(page, mode, palette, '.bwv-info');
        if (await page.locator('[data-nova-focus="appearance:person:5"].focus').count()) await assertAccent(page, mode, palette, '[data-nova-focus="appearance:person:5"]');
      }
      await page.evaluate(() => novaFixture.enter('appearance:person:5'));
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'activity' && action[1] === 'actor'), 'the existing actor handler remains attached');
    });
  }
  for (const palette of selectedPalettes) await scenario('persisted-' + palette, async register => {
    const page = await fixture('poster', { ...real, accent: palette }); register(page);
    await prepare(page);
    assert.equal(await page.evaluate(() => novaFixture.accent()), palette, 'saved accent applies at installation');
    await assertAccent(page, 'poster', palette, '.bwa-play');
  });
  await scenario('invalid-accent-falls-back', async register => {
    const page = await fixture('poster', { ...real, accent: 'unknown' }); register(page);
    await prepare(page);
    assert.equal(await page.evaluate(() => novaFixture.accent()), 'lavender', 'invalid saved accent uses lavender');
    await assertAccent(page, 'poster', 'lavender', '.bwa-play');
  });
} finally {
  await browser.close();
}

const failed = results.filter(entry => entry.status === 'failed');
writeFileSync(join(output, 'results.json'), JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
console.log('Accent browser checks:', results.length - failed.length, 'passed,', failed.length, 'failed');
if (failed.length) process.exitCode = 1;
