import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { buildPremiumSource } from '../scripts/build-nova-skin-premium.mjs';
import { buildAppearanceCss } from '../scripts/nova-skin-appearance/bwa-styles.mjs';

// Local real-DOM verification; browser tooling is supplied by the calling environment.
const args = Object.fromEntries(process.argv.slice(2).map(arg => { const at = arg.indexOf('='); return [arg.slice(0, at), arg.slice(at + 1)]; }));
for (const key of ['--playwright', '--jquery', '--edge', '--upstream', '--output']) if (!args[key]) throw new Error('Missing ' + key);
const { chromium } = await import(pathToFileURL(resolve(args['--playwright'])).href);
const { PNG } = createRequire(import.meta.url)(args['--pngjs'] || resolve(args['--playwright'], '../../pngjs'));
const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const css = buildAppearanceCss();
const bridge = readFileSync(new URL('./fixtures/nova_appearance_bridge.js', import.meta.url), 'utf8');
const generated = buildPremiumSource(readFileSync(resolve(args['--upstream']), 'utf8'));
const activityListener = generated.slice(generated.indexOf("    Lampa.Listener.follow('activity', function (e) {"), generated.indexOf("    Lampa.Controller.listener.follow('toggle', function (e) {"));
assert.ok(activityListener.includes("e.type === 'destroy'"), 'verify the production activity listener');
const source = generated.replace('  if (window.appready) start();', bridge + '\nwindow.novaFixture.listen = function () {\n' + activityListener + '\n};\n  if (window.appready) start();');
const jquery = readFileSync(resolve(args['--jquery']), 'utf8');
const lampaDirectory = resolve(args['--jquery'], '../../..');
const lampaBundle = readFileSync(args['--lampa'] || join(lampaDirectory, 'app.min.js'), 'utf8');
const lampaCss = readFileSync(args['--lampa-css'] || join(lampaDirectory, 'css/app.css'), 'utf8');
const nativeScroll = lampaBundle.slice(lampaBundle.indexOf('\tfunction Scroll() {'), lampaBundle.indexOf('\tvar html$b,', lampaBundle.indexOf('\tfunction Scroll() {')));
const mousePc = lampaBundle.slice(lampaBundle.indexOf("\tvar MODE = 'mouse_pc';"), lampaBundle.indexOf('\tAdManager.init = function'));
const nativeController = lampaBundle.slice(lampaBundle.indexOf('\tvar listener$2 = Subscribe$2();'), lampaBundle.indexOf('\tvar http = window.location.protocol'));
assert.ok(nativeController.includes('function collectionFocus('), 'verify the actual Lampa controller');
const navigator = readFileSync(join(lampaDirectory, 'vender/navigator/navigator.js'), 'utf8');
const fontDirectory = resolve(args['--jquery'], '../../../fonts/SegoeUI');
const fontFaces = [['SegoeUI',400],['SegoeUI-SemiBold',600],['SegoeUI-Bold',700]].map(([name,weight]) => '@font-face{font-family:SegoeUI;src:url(data:font/woff;base64,' + readFileSync(join(fontDirectory, name + '.woff')).toString('base64') + ');font-weight:' + weight + '}').join('');
const rawBwa = name => readFileSync(new URL('../scripts/nova-skin-appearance/bwa/' + name + '.css', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: resolve(args['--edge']), headless: true });
let checks = 0;
const browserErrors = new WeakMap();

async function fixture(mode, options = {}, width = 1600, height = 900) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.route('**/*', route => route.abort());
  const errors = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#0b0b0c;color:#eee;font:18px Arial}body{overflow:hidden}*{box-sizing:border-box}.head{height:80px;border-bottom:1px solid #333;padding:20px 36px;font-size:30px}.fixture{height:calc(100vh - 80px)}.explorer__files-body,.scroll{height:100%;width:100%;overflow:auto}.scroll__body{min-height:100%;width:100%;padding:26px 36px}.focus{outline:2px solid #fff}</style></head><body><div class="head">LampaUA · Оформлення</div><div class="fixture"><div class="explorer__files-body"><div class="scroll"><div class="scroll__body"><div class="native-results"></div></div></div></div></div></body></html>');
  await page.addStyleTag({ content: fontFaces + 'body{font-family:SegoeUI,sans-serif;line-height:1}' });
  await page.addScriptTag({ content: jquery });
  await page.evaluate(() => {
    const values = { language: 'uk', nova_skin_logo: false, nova_skin_view: 'grid', nova_skin_probe: false };
    window.fixtureActions = [];
    window.fixtureProgress = { 0: 35 };
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
      Listener: { callbacks: {}, follow(name, fn) { (this.callbacks[name] ||= []).push(fn); }, send(name, value) { (this.callbacks[name] || []).forEach(fn => fn(value)); } },
      Activity: { active: () => window.fixtureActivity, replace: () => window.fixtureActions.push(['replace']), push: value => window.fixtureActions.push(['activity', value.component]) },
      Timeline: { view: hash => ({ percent: window.fixtureProgress[+hash.split(':')[1]] || 0, updated: hash === 'fixture:0' ? 1000 : 0 }) },
      TMDB: { image: () => window.fixtureArtwork(0) },
      Controller: {
        listener: { follow() {} },
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
  if (options.nativeController) {
    await page.addScriptTag({ content: navigator });
    await page.addScriptTag({ content: `(function () {
      function Subscribe$2() { const callbacks = {}; return { follow(name, fn) { (callbacks[name] ||= []).push(fn); }, send(name, value) { (callbacks[name] || []).forEach(fn => fn(value)); } }; }
      HTMLElement.prototype.toggleClass = function (name, value) { this.classList.toggle(name, value); };
      HTMLElement.prototype.addClass = function (name) { this.classList.add(name); };
      HTMLElement.prototype.removeClass = function (name) { this.classList.remove(name); };
      const Storage = { field: key => key === 'navigation_type' ? 'mouse' : false };
      const Platform = { screen: name => name === 'tv' };
      const DeviceInput = { canClick: () => true, noDubleClick: () => true };
      const Utils$1 = { trigger(node, name) { node.dispatchEvent(new Event(name, { bubbles: false, cancelable: true })); }, isTouchDevice: () => false };
      const Activity = { call() {} }, Layer = { update() {} }, Screensaver$2 = { stopSlideshow() {} };
      ${nativeController}
      const add = Controller.add;
      Controller.add = function (name, object) { window.fixtureControllers[name] = object; return add(name, object); };
      Lampa.Controller = Controller;
      Navigator.follow('focus', event => Controller.focus(event.elem));
      Controller.observe();
    })();` });
  }
  if (options.nativeScroll) {
    assert.ok(mousePc.includes("document.addEventListener('wheel'"), 'actual Lampa mouse mode is supplied');
    await page.addStyleTag({ content: lampaCss });
    await page.addStyleTag({ content: '.fixture{position:absolute;top:80px;bottom:0;width:100%;height:auto}.fixture .explorer__files-body{width:100%;height:100%}.fixture .scroll{height:100%;width:100%;overflow:hidden}.fixture .scroll__body{min-height:0;padding:0}.fixture .head{display:none}' });
    await page.addScriptTag({ content: `(function () {
      const Lang = Lampa.Lang, Controller = Lampa.Controller;
      const Platform = { screen: name => name === 'tv', pc: () => true };
      const Storage = { field: key => key === 'navigation_type' ? 'mouse' : false, get: key => key === 'navigation_mouse_pc', set() {} };
      const Params = { init() {}, values: { navigation_type: {} } };
      const Settings$1 = { listener: { follow() {} } }, Select = { show() {} };
      const Utils$1 = { trigger(node, name) { node.dispatchEvent(new Event(name, { bubbles: false, cancelable: true })); } };
      const Layer = { visible() {} };
      const Template = { js() { return $('<div class="scroll"><div class="scroll__content"><div class="scroll__body"><div class="native-results"></div></div></div></div>')[0]; } };
      ${nativeScroll}
      window.fixtureScroll = new Scroll({ over: true });
      document.querySelector('.fixture .scroll').replaceWith(fixtureScroll.render(true));
      ${mousePc}
    })();` });
  }
  await page.addScriptTag({ content: source });
  await page.evaluate(({ mode, options, css }) => window.novaFixture.mount(mode, options, css), { mode, options, css });
  if (options.nativeController) await page.evaluate(() => Lampa.Controller.toggle('content'));
  assert.deepEqual(errors, [], 'render script errors');
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function compareOriginalBwa(page, mode) {
  const selectors = {
    poster: ['.bwa-hero','.bwa-hero__title','.bwa-hero__q','.bwa-play','.bwa-pill','.bwa-season','.bwa-ep__art'],
    filmstrip: ['.bwv-head','.bwv-title','.bwv-rts','.bwv-meta','.bwv-cr','.bwv-btn','.bwv-chip','.bwv-card','.bwv-card__im'],
    credits: ['.bwv-col','.bwv-title','.bwv-btn--play','.bwv-it','.bwv-listbox','.bwv-lh','.bwv-row'],
    credits_plus: ['.bwv-left','.bwv-title','.bwv-btn','.bwv-pline','.bwv-plist','.bwv-prow__im','.bwv-prow__h']
  }[mode];
  if (await page.locator('.bwv-logo').count()) selectors[selectors.indexOf('.bwv-title')] = '.bwv-logo';
  const markup = await page.evaluate(mode => {
    document.querySelectorAll('.focus').forEach(node => node.classList.remove('focus'));
    const root = document.querySelector('.nova-skin-root').cloneNode(true);
    function unwrap(selector) { root.querySelectorAll(selector).forEach(node => node.replaceWith(...node.childNodes)); }
    if (mode !== 'poster') {
      unwrap('.nova__hero'); unwrap('.nova-bwa-hero'); unwrap('.nova-toolbar');
      unwrap('.nova-bwa-logo-slot');
      if (mode === 'credits') { unwrap('.nova-hero__actions'); unwrap('.nova__rows'); }
      if (mode === 'credits_plus') unwrap('.nova-layout__main');
    }
    [root, ...root.querySelectorAll('*')].forEach(node => {
      [...node.classList].forEach(name => { if (name.startsWith('nova')) node.classList.remove(name); });
    });
    root.querySelectorAll('.bwv-drawer').forEach(node => node.remove());
    return root.outerHTML;
  }, mode);
  const reference = await browser.newPage({ viewport: page.viewportSize() });
  await reference.route('**/*', route => route.abort());
  const base = await page.locator('head style').first().textContent();
  await reference.setContent('<!doctype html><html><head><style>' + base + fontFaces + 'body{font-family:SegoeUI,sans-serif;line-height:1}</style></head><body class="bwa-on"><div class="head">LampaUA · Оформлення</div><div class="fixture bwa-scope"><div class="explorer__files-body"><div class="scroll"><div class="scroll__body">' + markup + '</div></div></div></div></body></html>');
  await reference.addStyleTag({ content: rawBwa('base') + rawBwa('theme') + (mode === 'credits' ? rawBwa('lite') : '') + (mode === 'poster' ? '' : rawBwa('views')) });
  await reference.evaluate(() => document.fonts.ready);
  const geometry = target => target.evaluate(selectors => selectors.map(selector => {
    const node = document.querySelector(selector), rect = node.getBoundingClientRect(), css = getComputedStyle(node);
    const round = value => Math.round(value * 100) / 100;
    return { selector, x: round(rect.x), y: round(rect.y), width: round(rect.width), height: round(rect.height), font: css.fontSize, weight: css.fontWeight, color: css.color, radius: css.borderRadius, padding: css.padding, margin: css.margin };
  }), selectors);
  const actual = await geometry(page), expected = await geometry(reference);
  await reference.screenshot({ path: join(output, mode + '-bwa-reference.png') });
  for (let index = 0; index < expected.length; index++) {
    assert.deepEqual(actual[index], expected[index], mode + ' matches original BWA geometry/style for ' + expected[index].selector); checks++;
  }
  const root = await page.locator('.nova-skin-root').boundingBox();
  const clip = { x: root.x, y: root.y, width: root.width, height: Math.min(root.height, page.viewportSize().height - root.y) };
  const actualImage = await page.screenshot({ clip }), referenceImage = await reference.screenshot({ clip });
  if (!actualImage.equals(referenceImage)) {
    writeFileSync(join(output, mode + '-pixel-actual.png'), actualImage);
    writeFileSync(join(output, mode + '-pixel-reference.png'), referenceImage);
  }
  const a = PNG.sync.read(actualImage), b = PNG.sync.read(referenceImage);
  assert.equal(a.width, b.width); assert.equal(a.height, b.height);
  let maxDelta = 0;
  for (let index = 0; index < a.data.length; index++) maxDelta = Math.max(maxDelta, Math.abs(a.data[index] - b.data[index]));
  // Chromium can round a gradient channel by one level across compositing layers.
  assert.ok(maxDelta <= 1, mode + ' matches original BWA pixels (max channel delta ' + maxDelta + ') at ' + page.viewportSize().width); checks++;
  await reference.close();
}

try {
  for (const mode of mousePc.includes("document.addEventListener('wheel'") ? ['credits', 'credits_plus'] : []) {
    const page = await fixture(mode, { seasons: 32, sources: 32, count: 640, nativeController: true, nativeScroll: true });
    if (mode === 'credits_plus') await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
    await page.locator('[data-nova-focus="source"]').click();
    await page.waitForTimeout(60);
    const panel = page.locator(mode === 'credits' ? '.nova-layout__aside' : '.nova-layout__drawer');
    await panel.hover();
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(150);
    assert.ok(await panel.evaluate(node => node.scrollTop > 0), mode + ' settings scroll with the actual Lampa Mouse PC wheel interceptor'); checks++;
    const viewport = await panel.boundingBox();
    const lastOption = await page.locator('.nova-drop .nova-chip').last().boundingBox();
    assert.ok(lastOption.y >= viewport.y && lastOption.y + lastOption.height <= viewport.y + viewport.height, mode + ' real Lampa allows the final source to be selected'); checks++;
    await page.locator('.nova-drop .nova-chip').last().click();
    await page.waitForTimeout(80);
    const episodes = page.locator(mode === 'credits' ? '.bwv-list' : '.bwv-plist');
    await episodes.hover();
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(150);
    assert.ok(await episodes.evaluate(node => node.scrollTop > 0), mode + ' episodes scroll with the actual Lampa mouse handler'); checks++;
    assert.deepEqual(browserErrors.get(page), [], mode + ' native scroll integration errors'); checks++;
    await page.close();
  }
  for (const mode of ['filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { lifecycle: true });
    await page.evaluate(() => { novaFixture.enter('appearance:details'); novaFixture.enter('appearance:person:0'); novaFixture.actorRoundTrip(); });
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.nova-bwa-scope').count(), 1, mode + ' actor destruction must not strip the restored Online styles'); checks++;
    assert.equal(await page.locator('.nova-skin-root').count(), 1, mode + ' actor return rebuilds exactly one live layout'); checks++;
    await page.locator('.nova__list').dispatchEvent('wheel', { deltaY: 240 });
    assert.deepEqual(browserErrors.get(page), [], mode + ' actor return and subsequent wheel cannot use discarded UI handles'); checks++;
    await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('down'); });
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), mode === 'filmstrip' ? 'item:0' : 'item:1', mode + ' navigation works after actor return'); checks++;
    await page.close();
  }
  for (const mode of ['credits', 'credits_plus']) {
    const page = await fixture(mode, { seasons: 32, sources: 32, nativeController: true });
    if (mode === 'credits_plus') await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
    await page.locator('[data-nova-focus="season"]').click();
    await page.waitForTimeout(60);
    assert.equal(await page.evaluate(() => novaFixture.state().open), 'season', mode + ' a real mouse click opens the requested setting'); checks++;
    const panel = page.locator(mode === 'credits' ? '.nova-layout__aside' : '.nova-layout__drawer');
    assert.equal(await panel.evaluate(node => getComputedStyle(node).overflowY), 'auto', mode + ' settings must allow mouse-wheel scrolling'); checks++;
    await panel.hover();
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(100);
    assert.ok(await panel.evaluate(node => node.scrollTop > 0), mode + ' real wheel scrolls long settings'); checks++;
    await page.evaluate(() => { novaFixture.focus('season:27'); Lampa.Controller.enter(); });
    await page.waitForTimeout(80);
    assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'filter' && action[1] === 'filter'), mode + ' the native controller chooses the focused late option'); checks++;
    assert.deepEqual(browserErrors.get(page), [], mode + ' pointer and native controller errors'); checks++;
    await page.close();
  }
  for (const mode of ['filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { seasons: 32, sources: 32, voices: 32, count: 640, nativeController: true });
    for (const key of ['source', 'season', 'voice', 'jump']) {
      if (mode === 'credits_plus') await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
      await page.locator('[data-nova-focus="' + key + '"]').click();
      await page.waitForTimeout(60);
      assert.equal(await page.evaluate(() => novaFixture.state().open), key, mode + ' mouse opens ' + key); checks++;
      const panel = page.locator(mode === 'credits' ? '.nova-layout__aside' : mode === 'credits_plus' ? '.nova-layout__drawer' : '.bwv-chips');
      assert.equal(await panel.evaluate((node, mode) => getComputedStyle(node)[mode === 'filmstrip' ? 'overflowX' : 'overflowY'], mode), 'auto', mode + ' scrollable ' + key); checks++;
      await panel.hover();
      await page.mouse.wheel(0, 6000);
      await page.waitForTimeout(100);
      const option = page.locator('.nova-drop .nova-chip').last();
      const optionKey = await option.getAttribute('data-nova-focus');
      const visible = await option.evaluate((node, selector) => {
        const bounds = document.querySelector(selector).getBoundingClientRect(), rect = node.getBoundingClientRect();
        return rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom;
      }, mode === 'credits' ? '.nova-layout__aside' : mode === 'credits_plus' ? '.nova-layout__drawer' : '.bwv-chips');
      assert.equal(visible, true, mode + ' wheel brings the final ' + key + ' option into view'); checks++;
      const changesBefore = (await page.evaluate(() => fixtureActions)).filter(action => action[0] === 'filter').length;
      await option.click();
      await page.waitForTimeout(80);
      assert.equal(await page.evaluate(() => novaFixture.state().open), '', mode + ' click chooses ' + optionKey); checks++;
      if (key === 'jump') assert.equal(await page.locator('.nova-card').first().getAttribute('data-nova-focus'), optionKey.replace('jump:', 'item:'), mode + ' selected final episode range is rendered');
      else assert.equal((await page.evaluate(() => fixtureActions)).filter(action => action[0] === 'filter').length, changesBefore + 1, mode + ' final ' + key + ' option invokes the original filter');
      checks++;
    }
    assert.deepEqual(browserErrors.get(page), [], mode + ' all option lists retain mouse handlers'); checks++;
    await page.close();
  }
  {
    const page = await fixture('credits', { metadata: true });
    await page.waitForTimeout(50);
    assert.ok((await page.locator('.bwv-cr').textContent()).includes('Отриманий актор'), 'full credits are requested through Lampa actual query contract'); checks++;
    assert.equal((await page.evaluate(() => fixtureActions)).filter(action => action[0] === 'metadata').length, 1, 'metadata request is cached per title'); checks++;
    await page.close();
  }
  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode);
    const hasLayout = await page.locator('.nova-layout--' + mode).count();
    assert.equal(hasLayout, mode === 'nova' ? 0 : 1, mode + ' layout'); checks++;
    assert.equal(await page.locator('.nova-card').count(), 12, mode + ' cards'); checks++;
    if (mode !== 'nova') {
      assert.equal(await page.locator('.nova-bwa-scope').count(), 1, mode + ' isolates the original BWA styles'); checks++;
      assert.equal(await page.locator(mode === 'poster' ? '.bwa-hero' : '.bwv').count(), 1, mode + ' uses the original BWA structure'); checks++;
    }
    if (['filmstrip', 'credits', 'credits_plus'].includes(mode)) {
      assert.equal(await page.locator('.nova-skin-root').evaluate(node => getComputedStyle(node).display), mode === 'filmstrip' ? 'flex' : 'block', mode + ' retains the original BWA layout inside the real provider hierarchy'); checks++;
    }
    await page.screenshot({ path: join(output, mode + '.png'), fullPage: false });
    if (mode !== 'nova') await compareOriginalBwa(page, mode);
    if (mode !== 'nova') {
      await page.evaluate(() => novaFixture.refreshProgress(0, 96));
      assert.equal(await page.locator('[data-nova-focus="item:0"] .bwa-ep__mark').first().textContent(), '✓', mode + ' watched state refreshes after the player'); checks++;
      const progress = await page.locator('[data-nova-focus="item:0"] .bwa-ep__prog>i').first().getAttribute('style');
      assert.ok(progress.includes('96%'), mode + ' timeline identity and progress refresh are retained'); checks++;
    }
    if (mode === 'filmstrip') {
      const titleFits = await page.evaluate(() => {
        const title = document.querySelector('.bwv-card__nm').getBoundingClientRect();
        const rail = document.querySelector('.bwv-rail').getBoundingClientRect();
        return title.height > 0 && title.bottom <= rail.bottom;
      });
      if (!titleFits) console.log('Filmstrip geometry', await page.evaluate(() => ['.bwv-rail','.nova-card','.bwv-card__im','.bwv-card__nm'].map(selector => {
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
    if (mode !== 'nova') {
      if (mode === 'credits_plus') await page.evaluate(() => { novaFixture.focus('item:0'); novaFixture.key('right'); });
      await page.evaluate(() => novaFixture.enter('source'));
      const sourceOption = await page.locator('.nova-drop .nova-chip').nth(1).getAttribute('data-nova-focus');
      await page.evaluate(key => novaFixture.enter(key), sourceOption);
      await page.waitForTimeout(50);
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'filter' && action[1] === 'sort'), mode + ' changes the original provider'); checks++;
      assert.ok((await page.evaluate(() => novaFixture.currentFocus())).startsWith('item:'), mode + ' returns to the list after changing provider'); checks++;
      if (mode === 'credits_plus') await page.evaluate(() => novaFixture.key('right'));
      await page.evaluate(() => novaFixture.enter('appearance:search'));
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'native-search'), mode + ' retains the native search action'); checks++;
      if (mode === 'credits_plus') await page.evaluate(() => novaFixture.key('back'));
      if (mode !== 'poster') {
        await page.evaluate(() => novaFixture.enter('appearance:details'));
        assert.ok(await page.locator('.bwv-person:visible').count() > 0, mode + ' original BWA people strip is present'); checks++;
        await page.evaluate(() => novaFixture.key('right'));
        assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'appearance:person:1', mode + ' people navigation'); checks++;
        await page.evaluate(() => { novaFixture.enter('appearance:person:1'); novaFixture.key('back'); });
        assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'activity' && action[1] === 'actor'), mode + ' original actor activity'); checks++;
        assert.equal(await page.locator('.bwv-info').count(), 0, mode + ' details closes with Back'); checks++;
      }
    }
    await page.evaluate(() => novaFixture.choose('native'));
    assert.equal(await page.locator('.nova-skin-root').count(), 0, mode + ' native cleanup'); checks++;
    assert.equal(await page.locator('.online-prestige--full.selector').count(), 12); checks++;
    assert.equal(await page.locator('.online-prestige--full:visible').count(), 12, mode + ' native visibility'); checks++;
    assert.equal(await page.locator('.nova-bwa-scope').count(), 0, mode + ' BWA styles leave the native provider'); checks++;
    await page.close();
  }
  for (const mode of ['poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { logo: mode === 'filmstrip' || mode === 'credits_plus' }, 1920, 1020);
    await compareOriginalBwa(page, mode);
    await page.screenshot({ path: join(output, mode + '-1920.png') });
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
  for (const mode of ['credits', 'credits_plus']) {
    const page = await fixture(mode, { seasons: 32 });
    await page.evaluate(mode => {
      if (mode === 'credits_plus') { novaFixture.focus('item:0'); novaFixture.key('right'); }
      novaFixture.enter('season');
      for (let index = 0; index < 27; index++) novaFixture.key('down');
    }, mode);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'season:27', mode + ' late season reached with remote'); checks++;
    const visibility = await page.evaluate(mode => {
      const option = document.querySelector('[data-nova-focus="season:27"]').getBoundingClientRect();
      const panel = document.querySelector(mode === 'credits' ? '.nova-layout__aside' : '.nova-layout__drawer');
      const bounds = panel.getBoundingClientRect();
      return { scrolled: panel.scrollTop > 0, visible: option.top >= bounds.top && option.bottom <= bounds.bottom };
    }, mode);
    assert.deepEqual(visibility, { scrolled: true, visible: true }, mode + ' late season scrolls into the actual visible control panel'); checks++;
    await page.close();
  }
  for (const mode of ['filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { error: true });
    assert.equal(await page.locator('.nova-note__actions .selector').count(), 4, mode + ' real error renderer exposes recovery actions'); checks++;
    await page.evaluate(mode => {
      novaFixture.focus('note:0');
      novaFixture.key(mode === 'filmstrip' ? 'right' : 'down');
    }, mode);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'note:1', mode + ' remote reaches second error action'); checks++;
    await page.evaluate(mode => novaFixture.key(mode === 'filmstrip' ? 'right' : 'down'), mode);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'note:2', mode + ' remote reaches retry'); checks++;
    await page.evaluate(() => novaFixture.enter('note:2'));
    assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'replace'), mode + ' retry retains original action'); checks++;
    await page.evaluate(mode => novaFixture.key(mode === 'filmstrip' ? 'right' : 'down'), mode);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'note:clarify', mode + ' remote reaches search clarification'); checks++;
    await page.evaluate(() => novaFixture.enter('note:clarify'));
    assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'clarify'), mode + ' clarify retains provider search action'); checks++;
    await page.evaluate(mode => { novaFixture.key(mode === 'filmstrip' ? 'up' : 'left'); novaFixture.key(mode === 'filmstrip' ? 'down' : 'right'); }, mode);
    assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'note:clarify', mode + ' returns to the selected recovery action'); checks++;
    await page.close();
  }
  for (const mode of ['poster', 'filmstrip', 'credits', 'credits_plus']) {
    const folderPage = await fixture(mode, { folders: true, count: 3 });
    assert.equal(await folderPage.locator('.nova-card--nav:visible').count(), 3, mode + ' preserves native folder cards'); checks++;
    await folderPage.evaluate(() => { novaFixture.focus('item:1'); novaFixture.enter('item:1'); });
    assert.ok((await folderPage.evaluate(() => fixtureActions)).some(action => action[0] === 'play' && action[1] === 1), mode + ' opens the original folder action'); checks++;
    await folderPage.close();

    const loadingPage = await fixture(mode, { loading: true });
    assert.equal(await loadingPage.locator('.nova-loading:visible').count(), 1, mode + ' real loading renderer remains visible'); checks++;
    await loadingPage.evaluate(() => novaFixture.finishLoading());
    assert.equal(await loadingPage.locator('.nova-loading').count(), 0, mode + ' loading state clears'); checks++;
    assert.equal(await loadingPage.locator('.nova-card').count(), 12, mode + ' results return after loading'); checks++;
    await loadingPage.close();
  }
  for (const mode of ['poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { art: false, film: true, count: 2 }, 580);
    assert.equal(await page.locator('.nova-card:visible').count(), 2, mode + ' narrow film without artwork'); checks++;
    assert.equal(await page.locator('.nova-skin-root').evaluate(node => getComputedStyle(node).display), 'block', mode + ' narrow flow overrides fixed columns'); checks++;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    assert.equal(overflow, false, mode + ' narrow overflow'); checks++;
    if (mode !== 'poster') {
      const title = await page.locator('.bwv-title').boundingBox();
      assert.ok(title.y >= 80, mode + ' title stays below the header without artwork'); checks++;
    }
    await page.screenshot({ path: join(output, mode + '-narrow.png') });
    await page.close();
  }
  console.log(JSON.stringify({ checks, result: 'passed', screenshots: output }, null, 2));
} finally { await browser.close(); }
