import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPremiumSource } from '../scripts/build-nova-skin-premium.mjs';

// Local real-DOM verification; browser tooling is supplied by the calling environment.
const args = Object.fromEntries(process.argv.slice(2).map(arg => { const at = arg.indexOf('='); return [arg.slice(0, at), arg.slice(at + 1)]; }));
for (const key of ['--playwright', '--jquery', '--edge', '--upstream', '--output']) if (!args[key]) throw new Error('Missing ' + key);
const { chromium } = await import(pathToFileURL(resolve(args['--playwright'])).href);
const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const css = readFileSync(new URL('../scripts/nova-skin-appearance/styles.css', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('./fixtures/nova_appearance_bridge.js', import.meta.url), 'utf8');
const source = buildPremiumSource(readFileSync(resolve(args['--upstream']), 'utf8'))
  .replace('  if (window.appready) start();', bridge + '\n  if (window.appready) start();');
const jquery = readFileSync(resolve(args['--jquery']), 'utf8');
const browser = await chromium.launch({ executablePath: resolve(args['--edge']), headless: true });
let checks = 0;

async function fixture(mode, options = {}, width = 1600) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route('**/*', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#0b0b0c;color:#eee;font:18px Arial}body{overflow:hidden}*{box-sizing:border-box}.head{height:80px;border-bottom:1px solid #333;padding:20px 36px;font-size:30px}.fixture{height:calc(100vh - 80px)}.scroll{height:100%;width:100%;overflow:auto}.scroll__body{min-height:100%;width:100%;padding:26px 36px}.focus{outline:2px solid #fff}</style></head><body><div class="head">LampaUA · Оформлення</div><div class="fixture"><div class="scroll"><div class="scroll__body"><div class="native-results"></div></div></div></div></body></html>');
  await page.addScriptTag({ content: jquery });
  await page.evaluate(() => {
    const values = { language: 'uk', nova_skin_logo: false, nova_skin_view: 'grid', nova_skin_probe: false };
    window.fixtureActions = [];
    window.fixtureControllers = {};
    window.fixtureArtwork = index => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g"><stop stop-color="#111728"/><stop offset="1" stop-color="' + ['#725946','#30495b','#59613e','#55465f'][index % 4] + '"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><path d="M550 900L950 150 1300 900z" fill="#14141c"/><circle cx="1000" cy="330" r="130" fill="#37343d"/><path d="M0 750L500 420 800 900z" fill="#1b242a"/></svg>');
    const storage = {
      get: (key, fallback) => Object.hasOwn(values, key) ? values[key] : fallback,
      set: (key, value) => { values[key] = value; },
      cache: (key, size, fallback) => Object.hasOwn(values, key) ? values[key] : (values[key] = fallback),
      listener: { follow() {} }
    };
    window.nova_skin_lampac_access = true;
    window.nova_skin_probe_mode = () => 'external';
    window.appready = false;
    const translations = {};
    window.Lampa = {
      Storage: storage,
      Lang: { translate: key => translations[key] && (translations[key].uk || translations[key].en) || key, add: entries => Object.assign(translations, entries) },
      SettingsApi: { addParam() {}, addComponent() {} },
      Listener: { follow() {} },
      Activity: { active: () => window.fixtureActivity, replace: () => window.fixtureActions.push(['replace']) },
      Timeline: { view: hash => ({ percent: hash === 'fixture:0' ? 35 : 0, updated: hash === 'fixture:0' ? 1000 : 0 }) },
      TMDB: { image: () => window.fixtureArtwork(0) },
      Controller: {
        add: (name, object) => { window.fixtureControllers[name] = object; },
        enabled: () => window.fixtureControllers.content || { name: 'content' },
        enable() {}, collectionSet() {},
        collectionFocus(node) { $('.focus').removeClass('focus'); $(node).addClass('focus').trigger('hover:focus'); }
      },
      Utils: { hash: text => String(text), parseTime: () => ({ full: '' }) },
      Select: { show() {}, close() {} },
      Layer: { update() {} },
      Player: { listener: { follow() {} } }
    };
  });
  await page.addScriptTag({ content: source });
  await page.evaluate(({ mode, options, css }) => window.novaFixture.mount(mode, options, css), { mode, options, css });
  assert.deepEqual(errors, [], 'render script errors');
  return page;
}

try {
  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode);
    const hasLayout = await page.locator('.nova-layout--' + mode).count();
    assert.equal(hasLayout, mode === 'nova' ? 0 : 1, mode + ' layout'); checks++;
    assert.equal(await page.locator('.nova-card').count(), 12, mode + ' cards'); checks++;
    await page.screenshot({ path: join(output, mode + '.png'), fullPage: false });
    if (mode === 'filmstrip') {
      const titleFits = await page.evaluate(() => {
        const title = document.querySelector('.nova-card__title').getBoundingClientRect();
        const rail = document.querySelector('.nova__list').getBoundingClientRect();
        return title.height > 0 && title.bottom <= rail.bottom;
      });
      if (!titleFits) console.log('Filmstrip geometry', await page.evaluate(() => ['.nova__list','.nova-card','.nova-card__thumb','.nova-card__body','.nova-card__title'].map(selector => {
        const node = document.querySelector(selector), style = getComputedStyle(node), rect = node.getBoundingClientRect();
        return { selector, height: rect.height, top: rect.top, bottom: rect.bottom, position: style.position, flex: style.flex, display: style.display };
      })));
      assert.equal(titleFits, true, 'filmstrip episode title fits inside the visible rail'); checks++;
      await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
      assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'item:1'); checks++;
      await page.evaluate(() => novaFixture.key('up'));
      assert.notEqual(await page.evaluate(() => novaFixture.currentFocus()), 'item:1'); checks++;
    }
    if (mode === 'credits') {
      assert.equal(await page.locator('.nova-card__thumb:visible').count(), 0); checks++;
      await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('left'); });
      assert.notEqual(await page.evaluate(() => novaFixture.currentFocus()), 'item:0'); checks++;
    }
    if (mode === 'credits_plus') {
      await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
      assert.equal(await page.locator('.nova-layout__drawer:visible').count(), 1); checks++;
      await page.screenshot({ path: join(output, 'credits_plus_drawer.png') });
      await page.evaluate(() => novaFixture.enter('season'));
      await page.evaluate(() => novaFixture.key('back'));
      assert.equal(await page.locator('.nova-layout__drawer:visible').count(), 0); checks++;
      assert.equal(await page.evaluate(() => novaFixture.state().open), '', 'closing drawer closes its options'); checks++;
      assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'item:0'); checks++;
      await page.evaluate(() => novaFixture.restoreHiddenControl());
      assert.ok((await page.evaluate(() => novaFixture.currentFocus())).startsWith('item:'), 'closed drawer cannot retain a source focus lock'); checks++;
      await page.evaluate(() => { novaFixture.key('right'); novaFixture.enter('season'); });
      const option = await page.locator('.nova-drop .nova-chip').nth(1).getAttribute('data-nova-focus');
      await page.evaluate(key => novaFixture.enter(key), option);
      await page.waitForTimeout(50);
      assert.equal(await page.locator('.nova-layout__drawer:visible').count(), 0, 'selection closes drawer'); checks++;
      assert.ok((await page.evaluate(() => novaFixture.currentFocus())).startsWith('item:'), 'selection restores episode focus'); checks++;
    }
    await page.evaluate(() => { novaFixture.enter('item:0'); novaFixture.enter('item:0', true); });
    const actions = await page.evaluate(() => window.fixtureActions);
    assert.ok(actions.some(entry => entry[0] === 'play' && entry[1] === 0), mode + ' original playback action'); checks++;
    assert.ok(actions.some(entry => entry[0] === 'long' && entry[1] === 0), mode + ' original long-press action'); checks++;
    await page.evaluate(() => novaFixture.choose('native'));
    assert.equal(await page.locator('.nova-skin-root').count(), 0, mode + ' native cleanup'); checks++;
    assert.equal(await page.locator('.online-prestige--full.selector').count(), 12); checks++;
    assert.equal(await page.locator('.online-prestige--full:visible').count(), 12, mode + ' native visibility'); checks++;
    await page.close();
  }
  for (const mode of ['filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { count: 45 });
    await page.evaluate(mode => {
      novaFixture.focus('item:19');
      novaFixture.key(mode === 'filmstrip' ? 'right' : 'down');
    }, mode);
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'item:20', mode + ' next episode page'); checks++;
    await page.close();
  }
  for (const mode of ['poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { art: false, film: true, count: 2 }, 580);
    assert.equal(await page.locator('.nova-card:visible').count(), 2, mode + ' narrow film without artwork'); checks++;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    assert.equal(overflow, false, mode + ' narrow overflow'); checks++;
    await page.screenshot({ path: join(output, mode + '-narrow.png') });
    await page.close();
  }
  console.log(JSON.stringify({ checks, result: 'passed', screenshots: output }, null, 2));
} finally { await browser.close(); }
