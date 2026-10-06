'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const premium = fs.readFileSync(path.join(__dirname, '..', 'nova_skin_premium.js'), 'utf8').replace(/\r\n/g, '\n');
let patchSearchReliability;
let anchors;
test.before(async () => {
  ({ patchSearchReliability, searchReliabilityAnchors: anchors } = await import(pathToFileURL(
    path.join(__dirname, '..', 'scripts', 'nova-skin-search-reliability.mjs')
  ).href));
});

function originalFunction(name) {
  const start = premium.indexOf('  function ' + name + '(');
  assert.notEqual(start, -1, 'generated Premium lacks ' + name);
  const next = premium.indexOf('\n  function ', start + 1);
  const chunk = premium.slice(start, next < 0 ? undefined : next);
  const end = chunk.lastIndexOf('\n  }');
  assert.notEqual(end, -1);
  return chunk.slice(0, end + 4);
}

function load(context, functions) {
  vm.createContext(context);
  vm.runInContext(functions.map(originalFunction).join('\n'), context);
  return context;
}

class Selection {
  constructor(nodes = []) { this.nodes = nodes; this.length = nodes.length; nodes.forEach((node, index) => { this[index] = node; }); }
  first() { return new Selection(this.nodes.slice(0, 1)); }
  find(selector) {
    const node = this.nodes[0];
    if (!node) return new Selection();
    if (selector === '.online-prestige--full,.online-prestige--folder') return new Selection(node.cards || []);
    if (selector === '.online-empty') return new Selection(node.empty ? [node.empty] : []);
    if (selector === '.nova-hidden') return new Selection(node.hidden || []);
    if (selector === '.online-empty__title') return new Selection(node.title ? [{ text: node.title }] : []);
    if (selector === '.online-empty__time') return new Selection(node.message ? [{ text: node.message }] : []);
    if (selector === '.nova-card') return new Selection(node.children || []);
    return new Selection();
  }
  addClass(names) { this.nodes.forEach(node => names.split(' ').forEach(name => node.classes.add(name))); return this; }
  removeClass(names) { this.nodes.forEach(node => names.split(' ').forEach(name => node.classes.delete(name))); return this; }
  hasClass(name) { return !!this.nodes[0]?.classes.has(name); }
  remove() { this.nodes.forEach(node => { node.removed = true; }); return this; }
  text() { return this.nodes.map(node => node.text || '').join(''); }
  children() { return new Selection(this.nodes[0]?.children || []); }
  empty() { if (this.nodes[0]) this.nodes[0].children = []; return this; }
  append(card) { if (this.nodes[0]) this.nodes[0].children.push(card); return this; }
}
function node(classes = []) { return { classes: new Set(classes), children: [] }; }

function renderContext() {
  const timers = new Map();
  let nextTimer = 0;
  const body = node();
  body.cards = [];
  const rootNode = node();
  const heroImage = {};
  const heroNode = node(['nova-hero--loading']);
  heroNode.image = heroImage;
  const ownNode = node();
  const nativeLoading = node();
  body.hidden = [nativeLoading];
  rootNode.hidden = body.hidden;
  const logs = [];
  const calls = { cards: 0, loading: 0, note: 0, nativeEnable: 0, preserve: null };
  const noop = () => {};
  const context = {
    window: { console: { warn: (...args) => logs.push(args) } },
    setInterval: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id), clearTimeout: noop, timer: null,
    enabled: () => true, aside: false, busy: false, activeNode: () => rootNode,
    scope: () => ({ root: new Selection([rootNode]), body: new Selection([body]), movie: { id: 11, title: 'Film' } }),
    $: input => input instanceof Selection ? input : new Selection([input]),
    search_watch_timer: null, search_watch_state: null, search_watch_target: null,
    observer: null, observed: null, signature: '', note_sig: '', ui_open: '', ui_page: -1, ui_page_focus: -1,
    root: new Selection([rootNode]), host: body, movie: { id: 11 }, filter: null,
    ui: { root: new Selection([ownNode]), list: new Selection([node()]), hero: new Selection([heroNode]), rows: new Selection([node()]) },
    patchHost: noop, componentNow: () => null, activeFilter: () => null,
    readGroups: () => ({ sort: [] }), readExtras: () => [], nativeKind: 'loading',
    nativeState: () => context.nativeKind ? { kind: context.nativeKind, node: new Selection([body.empty || nativeLoading]) } : null,
    knownRemember: noop, pendingLive: () => false,
    loadingPanel() { calls.loading++; context.ui.load = {}; },
    loadingStop() { context.ui.load = null; }, hopStop: noop, probeStop: noop,
    inplaceStop: noop, lockRelease: noop, switchDone: noop, hopReset: noop,
    uiFrame: noop, hideHost: noop, listFree: noop,
    collect: () => body.cards.map((origin, index) => ({ index, folder: false, title: 'Found film', origin: new Selection([origin]) })),
    blank: () => false, stamp: () => 'same-film', viewMode: () => 'grid', JUMP_FROM: 50,
    buildCard(item) { calls.cards++; return item.origin[0]; },
    buildHero(preserve) { calls.preserve = preserve; return null; }, buildRows: noop,
    lockActive: () => false, restoreFocus: noop, relayout: noop, probeSchedule: noop,
    currentSourceKey: () => 'a', probeHook: () => 'external',
    notePanel() { calls.note++; },
    Lampa: { Lang: { translate: key => ({ empty_title_two: 'Nothing found', empty_text: 'Try another title' }[key] || key) },
      Controller: { collectionSet: noop, enable() { calls.nativeEnable++; } } }
  };
  load(context, ['searchWatchStop', 'searchEmptyNote', 'searchRecover', 'searchWatchTick', 'searchWatchStart', 'draw', 'drawFrame', 'attach']);
  return { context, body, rootNode, ownNode, heroNode, heroImage, calls, timers, logs };
}

test('late native results replace loading even without MutationObserver and retain the same poster', () => {
  const state = renderContext();
  state.context.attach();
  state.context.draw();
  assert.equal(state.context.observer, null);
  assert.equal(state.timers.size, 1);
  state.context.searchWatchTick();
  state.body.cards = [node(['selector'])];
  state.context.nativeKind = null;
  state.context.searchWatchTick();
  assert.equal(state.calls.cards, 1);
  assert.equal(state.context.ui.load, null);
  assert.equal(state.context.busy, false);
  assert.equal(state.calls.preserve, true);
  assert.equal(state.heroNode.image, state.heroImage);
  state.context.searchWatchTick();
  state.context.searchWatchTick();
  assert.equal(state.calls.cards, 1, 'unchanged ready results must not be rebuilt');
});

test('replacement native nodes with identical titles refresh click origins rather than keeping stale cards', () => {
  const state = renderContext();
  state.context.nativeKind = null;
  state.body.cards = [node(['selector'])];
  state.context.attach();
  state.context.searchWatchTick();
  const replacement = node(['selector']);
  state.body.cards = [replacement];
  state.context.searchWatchTick();
  assert.equal(state.calls.cards, 2);
  assert.equal(state.context.ui.list[0].children[0], replacement);
});

test('render exception releases busy, reveals native results and restores native focus selectors', () => {
  const state = renderContext();
  state.body.cards = [node([])];
  state.context.nativeKind = null;
  state.context.buildCard = () => { throw new TypeError('incompatible device API'); };
  state.rootNode.classes.add('nova-skin-scope');
  state.body.hidden[0].classes.add('nova-hidden');
  state.context.attach();
  assert.doesNotThrow(() => state.context.draw());
  assert.equal(state.context.busy, false);
  assert.equal(state.context.aside, true);
  assert.equal(state.context.signature, '');
  assert.equal(state.rootNode.classes.has('nova-skin-scope'), false);
  assert.equal(state.body.hidden[0].classes.has('nova-hidden'), false);
  assert.equal(state.body.cards[0].classes.has('selector'), true);
  assert.equal(state.ownNode.removed, true);
  assert.equal(state.calls.nativeEnable, 1);
  assert.equal(state.context.observed, state.rootNode);
  assert.equal(state.timers.size, 0);
  assert.equal(state.logs.length, 1);
  state.context.draw(); // No repeated render-error loop on the same activity.
  assert.equal(state.logs.length, 1);
});

test('native server errors are handed back without cancelling their fallback timer or marking empty', () => {
  const state = renderContext();
  state.body.empty = { ...node(), title: 'Source does not answer', message: 'Retry in 5 seconds' };
  state.context.nativeKind = 'note';
  state.context.draw();
  assert.equal(state.calls.note, 0, 'Nova notePanel must not intercept native errors');
  assert.equal(state.context.aside, true);
  assert.equal(state.calls.nativeEnable, 1);
  assert.equal(state.body.empty.removed, undefined);
});

test('genuine native empty-result messages still use the Nova note UI', () => {
  const state = renderContext();
  state.body.empty = { ...node(), title: 'Nothing found', message: 'Try another title' };
  state.context.nativeKind = 'note';
  state.context.draw();
  assert.equal(state.calls.note, 1);
  assert.equal(state.context.aside, false);
});

test('a watchdog also survives a failing observer constructor', () => {
  const state = renderContext();
  state.context.window.MutationObserver = true;
  state.context.MutationObserver = function () { throw new Error('unsupported observer'); };
  assert.doesNotThrow(() => state.context.attach());
  assert.equal(state.context.observer, null);
  assert.equal(state.timers.size, 1);
});

test('an observer callback failure restores native Online instead of trapping the loading page', () => {
  const state = renderContext();
  let callback;
  state.context.window.MutationObserver = true;
  state.context.MutationObserver = function (run) { callback = run; this.observe = () => {}; this.disconnect = () => {}; };
  state.context.pendingLive = () => true;
  state.context.reattach = () => { throw new Error('observer compatibility error'); };
  state.context.attach();
  assert.doesNotThrow(() => callback([{ target: null }]));
  assert.equal(state.context.aside, true);
  assert.equal(state.context.busy, false);
  assert.equal(state.timers.size, 0);
});

test('card-reading errors before busy is set also restore native results', () => {
  const state = renderContext();
  state.context.nativeKind = null;
  state.body.cards = [node(['selector'])];
  state.context.collect = () => { throw new Error('unsupported native markup'); };
  state.context.draw();
  assert.equal(state.context.aside, true);
  assert.equal(state.calls.nativeEnable, 1);
});

test('normal detach clears its watchdog and remains safe when observer disconnect fails', () => {
  const state = renderContext();
  state.context.attach();
  Object.assign(state.context, { afterPlayerStop() {}, lockStopWatch() {}, forget() {},
    observer: { disconnect() { throw new Error('disconnect unsupported'); } } });
  load(state.context, ['detach']);
  assert.doesNotThrow(() => state.context.detach());
  assert.equal(state.timers.size, 0);
  assert.equal(state.context.observer, null);
});

test('repeated attach replaces rather than leaks watchdog timers; leaving activity stops the timer', () => {
  const state = renderContext();
  state.context.attach();
  state.context.attach();
  assert.equal(state.timers.size, 1);
  state.context.activeNode = () => node();
  state.context.searchWatchTick();
  assert.equal(state.timers.size, 0);
});

test('disabled Premium does not start a watchdog or transform native results', () => {
  const state = renderContext();
  state.context.enabled = () => false;
  state.context.attach();
  state.context.draw();
  assert.equal(state.timers.size, 0);
  assert.equal(state.calls.loading, 0);
  assert.equal(state.calls.nativeEnable, 0);
});

test('external mode ignores stale negative cache but still excludes unavailable sources', () => {
  const context = load({
    probeHook: () => 'external', sourceState: () => 'empty', knownQuality: () => '',
    groups: { sort: [{ source: 'a', selected: true, ghost: false }, { source: 'b', title: 'B', ghost: false }, { source: 'c', ghost: true }] },
    hop: { tried: {} }, QUALITY_RANK: {}, splitSourceName: title => ({ badge: '', name: title })
  }, ['lifeKnown', 'sourceRank', 'sourceActive', 'nextSource']);
  assert.equal(context.sourceRank(context.groups.sort[1]), 0);
  assert.equal(context.sourceActive(context.groups.sort[1], 'b', 'empty', true), true);
  assert.equal(context.nextSource().source, 'b');
  assert.equal(context.sourceRank(context.groups.sort[2]), 3);
  assert.equal(context.sourceActive(context.groups.sort[2], 'c', 'ok', false), false);
  context.probeHook = () => 'legacy';
  assert.equal(context.sourceRank(context.groups.sort[1]), 3);
});

test('notePanel caches only confirmed empty results in legacy mode, never external errors/results', () => {
  const empty = {
    length: 0, find() { return this; }, first() { return this; },
    parent() { return this; }, children() { return this; },
    text(value) { return value === undefined ? '' : this; },
    attr() { return this; }, append() { return this; }, empty() { return this; }
  };
  const $ = () => empty;
  $.contains = () => false;
  const saved = [];
  const noop = () => {};
  let mode = 'external';
  let genuineEmpty = true;
  const context = load({
    $, ui: { list: empty, rows: empty }, root: empty, movie: { id: 11 }, groups: { sort: [{}, {}] },
    note_sig: '', noteStamp: () => 'note', uiFrame: noop, loadingStop: noop, lockRelease: noop,
    switchDone: noop, buildHero: noop, buildRows: noop, currentSourceKey: () => 'a',
    probeHook: () => mode, searchEmptyNote: () => genuineEmpty,
    probeSave: (...args) => saved.push(args), bind: noop, hopReset: noop, hopStop: noop,
    hostTimerStop: noop, hop: { tried: {} }, nextSource: () => null, text: key => key,
    ICON: {}, refreshCollection: noop, seek: () => null, ui_focus: ''
  }, ['notePanel']);
  context.notePanel({ node: empty });
  assert.equal(saved.length, 0);
  mode = 'legacy';
  genuineEmpty = false;
  context.notePanel({ node: empty });
  assert.equal(saved.length, 0);
  genuineEmpty = true;
  context.notePanel({ node: empty });
  assert.deepEqual(saved, [[11, 'a', 'empty', 0]]);
});

test('the actual build remains inert without Premium entitlement', () => {
  const context = { window: { nova_skin_lampac_access: false } };
  vm.runInNewContext(premium, context);
  assert.equal(context.window.nova_skin, undefined);
});

test('all new search patch anchors fail closed on upstream drift or duplication', () => {
  const fixture = Object.values(anchors).join('\n');
  assert.doesNotThrow(() => patchSearchReliability(fixture));
  for (const [label, anchor] of Object.entries(anchors)) {
    assert.throws(() => patchSearchReliability(fixture.replace(anchor, '// changed ' + label)), /anchor must occur exactly once/);
    assert.throws(() => patchSearchReliability(fixture + '\n' + anchor), /anchor must occur exactly once/);
  }
});
