'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const runtimePath = path.join(__dirname, '..', 'scripts', 'nova-skin-appearance', 'runtime.js');
const patchPath = path.join(__dirname, '..', 'scripts', 'nova-skin-appearance.mjs');
const source = fs.readFileSync(path.join(__dirname, '..', 'nova_skin_premium.js'), 'utf8');
const modes = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];

function harness(initial = {}, access = true) {
  const storage = { language: 'uk', ...initial };
  const added = [];
  let replacements = 0;
  const noop = () => {};
  const context = {
    window: { nova_skin_lampac_access: access, addEventListener: noop },
    document: {},
    ENABLED_KEY: 'nova_skin_enabled',
    ui: {}, root: null, host: null, movie: null, last: null, items: [],
    groups: {}, extras: [], ui_open: '', ui_focus: '', ui_lock: '',
    get: (key, fallback) => Object.hasOwn(storage, key) ? storage[key] : fallback,
    save: (key, value) => { storage[key] = value; },
    enabled: () => context.window.nova_skin_lampac_access === true && storage.nova_skin_enabled !== false,
    settings() {
      context.Lampa.SettingsApi.addParam({
        component: 'nova_skin',
        param: { name: 'nova_skin_enabled', type: 'trigger', default: true },
        field: { name: 'Увімкнути Nova Skin' }, onChange: noop
      });
    },
    Lampa: {
      Storage: { get: (key, fallback) => context.get(key, fallback), set: (key, value) => context.save(key, value) },
      SettingsApi: { addParam: value => added.push(value) },
      Activity: { replace: () => { replacements++; } }
    },
    setTimeout: noop, clearTimeout: noop,
    uiFrame: noop, buildHero: noop, buildRows: noop, buildCard: noop,
    stamp: () => 'baseline', viewMode: () => 'grid', focusNode: noop, scrollTo: noop,
    novaUp: noop, novaDown: noop, novaLeft: noop, novaRight: noop,
    hookController: noop, restoreFocus: noop, bind: noop, forget: noop,
    refreshMarks: noop, draw: noop, searchRecover: noop, lockRelease: noop,
    refreshCollection: noop, inSkin: () => false, pendingLive: () => false
  };
  vm.createContext(context);
  if (fs.existsSync(runtimePath)) {
    vm.runInContext(fs.readFileSync(runtimePath, 'utf8') + '\nthis.api = installNovaAppearance("");', context);
  }
  context.settings();
  return {
    context, storage, added,
    setting: added.find(entry => entry.param.name === 'nova_skin_appearance'),
    replacements: () => replacements
  };
}

test('appearance menu replaces the boolean toggle with six ordered Ukrainian choices', () => {
  const state = harness();
  assert.ok(state.setting, 'appearance select must replace the old boolean trigger');
  assert.equal(state.setting.param.type, 'select');
  assert.deepEqual(Object.keys(state.setting.param.values), modes);
  assert.deepEqual(Object.values(state.setting.param.values), ['Рідний', 'Нова', 'Афіша', 'Плівка', 'Титри', 'Титри+']);
  assert.equal(state.added.some(entry => entry.param.name === 'nova_skin_enabled'), false);
});

for (const [name, initial, expected] of [
  ['new installation', {}, 'nova'],
  ['previously enabled', { nova_skin_enabled: true }, 'nova'],
  ['previously disabled', { nova_skin_enabled: false }, 'native'],
  ['saved choice overrides legacy false', { nova_skin_enabled: false, nova_skin_appearance: 'credits_plus' }, 'credits_plus'],
  ['unknown choice preserves legacy disabled', { nova_skin_enabled: false, nova_skin_appearance: 'unknown' }, 'native']
]) {
  test(`${name} preserves the correct initial appearance`, () => {
    const state = harness(initial);
    assert.ok(state.setting, 'appearance setting is registered');
    assert.equal(state.setting.param.default, expected);
    assert.equal(state.context.api.current(), expected);
  });
}

test('choosing native synchronizes the legacy preference and stops the skin immediately', () => {
  const state = harness();
  assert.ok(state.setting);
  state.storage.nova_skin_appearance = 'native';
  state.setting.onChange('native');
  assert.equal(state.storage.nova_skin_enabled, false);
  assert.equal(state.context.enabled(), false);
  assert.equal(state.replacements(), 1);
});

test('a saved new layout enables Nova and survives installer re-entry', () => {
  const state = harness({ nova_skin_enabled: false });
  assert.ok(state.setting);
  state.storage.nova_skin_appearance = 'filmstrip';
  state.setting.onChange('filmstrip');
  assert.equal(state.storage.nova_skin_enabled, true);
  assert.equal(state.context.enabled(), true);
  assert.equal(state.context.api.current(), 'filmstrip');
  vm.runInContext('installNovaAppearance("");', state.context);
  assert.equal(state.context.api.current(), 'filmstrip');
});

test('revoking Premium access disables every saved appearance', () => {
  for (const mode of modes) {
    const state = harness({ nova_skin_appearance: mode });
    state.context.window.nova_skin_lampac_access = false;
    assert.equal(state.context.enabled(), false, mode);
  }
});

test('the generator fails closed on missing or duplicated appearance integration anchors', async () => {
  const patch = fs.existsSync(patchPath)
    ? (await import(pathToFileURL(patchPath).href)).patchAppearance
    : value => value;
  const pristine = source.replace(/\r\n/g, '\n');
  assert.throws(() => patch(pristine.replace('  function start() {', '  function renamedStart() {')), /appearance|Appearance/);
  assert.throws(() => patch(pristine + '\n  function start() {}'), /appearance|Appearance/);
});

module.exports = { harness };
