import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fixture, browser, browserErrors, args } from './nova_skin_appearance.browser.mjs';

const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const results = [];
const modes = ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
const real = { nativeFilter: true, nativeController: true, nativeScroll: true, nativeKeypad: true, count: 24 };
const initial = [
  { title: 'Missing', source: 'missing', ghost: true },
  { title: 'Found second', source: 'found-second', ghost: false },
  { title: 'Unknown', source: 'unknown' },
  { title: 'Selected missing', source: 'selected-missing', selected: true, ghost: true },
  { title: 'Found', source: 'found', ghost: false }
];

async function scenario(name, run) {
  if (args['--filter'] && !name.includes(args['--filter'])) return;
  let page;
  try {
    await run(value => { page = value; });
    assert.deepEqual(browserErrors.get(page), [], 'no script errors');
    assert.deepEqual(await page.evaluate(() => fixtureNetworkRequests), [], 'skin never creates a probe client or sends a second search');
    results.push({ name, status: 'passed' });
  } catch (error) {
    const record = { name, status: 'failed', message: error.message };
    if (page && !page.isClosed()) {
      record.state = await page.evaluate(() => novaFixture.state()).catch(() => null);
      await page.screenshot({ path: join(output, name + '-failed.png') }).catch(() => {});
    }
    results.push(record);
    console.log('FAIL', name, error.message);
  } finally { if (page && !page.isClosed()) await page.close(); }
}
async function sourceKeys(page) {
  return page.locator('.nova-drop [data-nova-src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-nova-src')));
}
async function openSources(page, mode) {
  if (mode === 'credits_plus' && await page.locator('.nova-layout__drawer--closed').count()) {
    await page.evaluate(() => novaFixture.focus('appearance:settings'));
    await page.keyboard.press('Enter');
  }
  await page.evaluate(() => novaFixture.focus('source'));
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => novaFixture.state().open), 'source', 'original OK handler opens sources');
}
async function enter(page, key) {
  await page.evaluate(key => novaFixture.focus(key), key);
  await page.keyboard.press('Enter');
}
async function update(page, list) {
  await page.evaluate(list => {
    window.sourcePayload = list;
    window.sourcePayloadText = JSON.stringify(list);
    novaFixture.updateSources(list);
  }, list);
  assert.equal(await page.evaluate(() => novaFixture.nativeSources() === sourcePayload), true, 'native setter receives the original list object');
  assert.equal(await page.evaluate(() => JSON.stringify(sourcePayload) === sourcePayloadText), true, 'skin never sorts or mutates native source objects');
}
async function captureContent(page) {
  await page.evaluate(() => {
    const hero = document.querySelector('.nova-hero,.nova-bwa-hero,.bwa-hero');
    window.originalContent = { cards: [...document.querySelectorAll('.nova-card')], hero, heroNodes: hero ? [...hero.querySelectorAll('*')] : [], list: document.querySelector('.nova__list') };
  });
}
async function sameContent(page) {
  assert.equal(await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.nova-card')];
    const hero = document.querySelector('.nova-hero,.nova-bwa-hero,.bwa-hero');
    const heroNodes = hero ? [...hero.querySelectorAll('*')] : [];
    return originalContent.hero === hero && originalContent.heroNodes.length === heroNodes.length && heroNodes.every((node, index) => node === originalContent.heroNodes[index]) && originalContent.list === document.querySelector('.nova__list') &&
      cards.length === originalContent.cards.length && cards.every((node, index) => node === originalContent.cards[index]);
  }), true, 'source updates preserve the same hero, episode list and card DOM');
}

try {
  for (const mode of modes) {
    await scenario('remote-contract-' + mode, async register => {
      const page = await fixture(mode, { ...real, input: 'remote', sourceStates: initial,
        sourceCache: { missing: { s: 'ok', t: Date.now() }, unknown: { s: 'ok', t: Date.now() }, found: { s: 'empty', t: Date.now() } }
      }, 1366, 768); register(page);
      await captureContent(page);
      await openSources(page, mode);
      assert.deepEqual(await sourceKeys(page), ['found-second', 'found'], 'only explicit backend matches are initially visible, in native order');
      assert.equal(await page.locator('[data-nova-src="found"] .nova-chip__dot').count(), 1, 'backend match wins over a stale empty probe cache');
      const more = page.locator('[data-nova-focus="src:more"]');
      assert.match(await more.textContent(), /^Усі джерела\s*\(3\)$/, 'remaining sources are offered through All sources');
      await enter(page, 'src:more');
      assert.deepEqual(await sourceKeys(page), ['found-second', 'found', 'missing', 'unknown', 'selected-missing'], 'all sources retain a stable confirmed-first partition');
      assert.equal(await page.locator('[data-nova-src="unknown"] .nova-chip__dot').count(), 0, 'unconfirmed does not get a found indicator');
      assert.ok(await page.locator('[data-nova-src="missing"]').evaluate(node => Number(getComputedStyle(node).opacity)) < .5, 'unavailable source stays dimmed after expansion');
      await sameContent(page);
      await enter(page, 'src:missing');
      assert.ok((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'filter' && action[1] === 'sort'), 'selection delegates to the original native source handler');
      assert.equal((await page.evaluate(() => fixtureActions)).some(action => action[0] === 'replace'), false, 'source UI does not replace the activity');
    });

    await scenario('late-native-results-' + mode, async register => {
      const page = await fixture(mode, { ...real, input: 'mouse_pc', sourceStates: initial }, 1366, 768); register(page);
      await page.evaluate(() => novaFixture.focus('item:1'));
      await captureContent(page);
      const first = initial.map(item => ({ ...item, ghost: item.source === 'found-second' || item.source === 'unknown' ? false : true }));
      await update(page, first);
      await sameContent(page);
      assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'item:1', 'closed source update preserves episode focus');
      await openSources(page, mode);
      assert.deepEqual(await sourceKeys(page), ['found-second', 'unknown'], 'late native statuses apply without manual render or search');
      await page.evaluate(() => novaFixture.focus('src:found-second'));
      const next = first.map(item => ({ ...item, ghost: item.source === 'found' ? false : item.ghost }));
      await update(page, next);
      assert.deepEqual(await sourceKeys(page), ['found-second', 'unknown', 'found'], 'same-count, same-title update refreshes the open source list');
      const signature = await page.evaluate(() => novaFixture.sourceSignature());
      assert.equal(signature.saved, signature.rendered, 'source-only refresh synchronizes the render signature before a native chosen DOM mutation');
      await page.evaluate(() => novaFixture.sourceDraw());
      await sameContent(page);
      assert.equal(await page.evaluate(() => novaFixture.currentFocus()), 'src:found-second', 'a still-present source keeps its focus key');
      assert.equal(await page.locator('[data-nova-focus="src:found-second"].focus').count(), 1, 'the controller focuses the refreshed source item');
      await sameContent(page);
      await page.evaluate(() => { window.sameOption = document.querySelector('[data-nova-src="found-second"]'); });
      await update(page, next);
      assert.equal(await page.evaluate(() => sameOption === document.querySelector('[data-nova-src="found-second"]')), true, 'identical native statuses do not rebuild source rows');
      await sameContent(page);
      await page.evaluate(() => {
        window.modalOption = document.querySelector('[data-nova-src="found-second"]');
        window.originalCollectionSet = Lampa.Controller.collectionSet;
        window.modalCollectionCalls = 0;
        Lampa.Controller.collectionSet = function () { modalCollectionCalls++; return originalCollectionSet.apply(this, arguments); };
        Lampa.Controller.add('settings', { name: 'settings', toggle() {} });
        Lampa.Controller.toggle('settings');
        modalCollectionCalls = 0;
      });
      const deferred = next.map(item => ({ ...item, ghost: item.source === 'found' ? true : item.ghost }));
      await update(page, deferred);
      assert.equal(await page.evaluate(() => Lampa.Controller.enabled().name), 'settings', 'native status updates never steal an active settings controller');
      assert.equal(await page.evaluate(() => modalCollectionCalls), 0, 'background source updates do not replace a modal focus collection');
      assert.equal(await page.evaluate(() => modalOption === document.querySelector('[data-nova-src="found-second"]')), true, 'source DOM waits while a separate controller is active');
      assert.deepEqual(await sourceKeys(page), ['found-second', 'unknown', 'found'], 'background list remains unchanged until content resumes');
      await page.evaluate(() => {
        Lampa.Controller.collectionSet = originalCollectionSet;
        Lampa.Controller.toggle('content');
        novaFixture.resumeSources();
      });
      assert.deepEqual(await sourceKeys(page), ['found-second', 'unknown'], 'latest deferred result applies when original content resumes');
      await sameContent(page);
    });

    await scenario('phone-edge-cases-' + mode, async register => {
      const page = await fixture(mode, { ...real, input: 'mouse', touch: true, sourceStates: initial }, 390, 844); register(page);
      await captureContent(page);
      await openSources(page, mode);
      const unknownOnly = initial.map(({ ghost, ...item }) => item);
      await update(page, unknownOnly);
      assert.deepEqual(await sourceKeys(page), initial.map(item => item.source), 'plugins without native flags keep all sources accessible');
      assert.equal(await page.locator('.nova-drop .nova-chip__dot').count(), 0, 'absent flags never imply a confirmed search match');
      assert.equal(await page.locator('[data-nova-focus="src:more"]').count(), 0, 'no artificial hidden sources when backend has no flags');
      const empty = initial.map(item => ({ ...item, ghost: true }));
      await update(page, empty);
      assert.deepEqual(await sourceKeys(page), [], 'an all-unconfirmed backend result exposes no false matches');
      assert.match(await page.locator('[data-nova-focus="src:more"]').textContent(), /^Усі джерела\s*\(5\)$/, 'all-unconfirmed sources remain accessible through All sources');
      await enter(page, 'src:more');
      assert.deepEqual(await sourceKeys(page), initial.map(item => item.source), 'all-unconfirmed list can still be expanded');
      assert.equal(await page.locator('.nova-drop .nova-chip__dot').count(), 0, 'expanded unavailable sources never show a found indicator');
      await sameContent(page);
    });
  }
} finally {
  writeFileSync(join(output, 'results.json'), JSON.stringify({ total: results.length, passed: results.filter(x => x.status === 'passed').length, failed: results.filter(x => x.status === 'failed').length, results }, null, 2));
  console.log(JSON.stringify({ total: results.length, passed: results.filter(x => x.status === 'passed').length, failed: results.filter(x => x.status === 'failed').length }));
  await browser.close();
}
if (results.some(x => x.status === 'failed')) process.exitCode = 1;
