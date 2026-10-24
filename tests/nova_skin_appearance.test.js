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

function harness(initial = {}, access = true, css = '') {
  const storage = { language: 'uk', ...initial };
  const added = [];
  const styles = {};
  let replacements = 0;
  const noop = () => {};
  const context = {
    window: { nova_skin_lampac_access: access, addEventListener: noop },
    document: { getElementById: id => styles[id], createElement: () => ({}), head: { appendChild: node => { styles[node.id] = node; } } },
    ENABLED_KEY: 'nova_skin_enabled',
    ui: {}, root: null, host: null, movie: null, last: null, items: [],
    groups: {}, extras: [], ui_open: '', ui_focus: '', ui_lock: '',
    get: (key, fallback) => Object.hasOwn(storage, key) ? storage[key] : fallback,
    save: (key, value) => { storage[key] = value; },
    enabled: () => context.window.nova_skin_lampac_access === true && storage.nova_skin_enabled !== false,
    settings() {
      try {
        context.Lampa.SettingsApi.addParam({
          component: 'nova_skin',
          param: { name: 'nova_skin_enabled', type: 'trigger', default: true },
          field: { name: 'Увімкнути Nova Skin' }, onChange: noop
        });
      } catch (ignore) {}
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
    refreshCollection: noop, inSkin: () => false, pendingLive: () => false, toolbarFocused: () => false
  };
  const navigation = { up: context.novaUp, down: context.novaDown, left: context.novaLeft, right: context.novaRight };
  vm.createContext(context);
  if (fs.existsSync(runtimePath)) {
    vm.runInContext(fs.readFileSync(runtimePath, 'utf8') + '\nthis.api = installNovaAppearance(' + JSON.stringify(css) + ');', context);
  }
  context.settings();
  return {
    context, storage, added, navigation, styles,
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

test('accent setting offers lavender by default and all five approved palettes', () => {
  const state = harness();
  const accent = state.added.find(entry => entry.param.name === 'nova_skin_accent');
  assert.ok(accent, 'accent belongs in the plugin settings');
  assert.equal(accent.field.name, 'Колір акценту');
  assert.deepEqual(Object.keys(accent.param.values), ['lavender', 'blue', 'mint', 'gold', 'silver']);
  assert.deepEqual(Object.values(accent.param.values), ['Лавандовий', 'Блакитний', 'М’ятний', 'Золотистий', 'Сріблястий']);
  assert.equal(accent.param.default, 'lavender');
  assert.equal(state.context.api.accent(), 'lavender');
  assert.equal(state.added.indexOf(accent), state.added.indexOf(state.setting) + 1);
});

test('accent preference persists and changes only the existing stylesheet', () => {
  const css = '.nova-bwa-scope .focus{color:#ffd400;background:rgba(255,212,0,.06);border:1px solid #8a7d3e;padding:12px}.neutral{color:#f3edd8;background:#0c0c0d}.seen{color:#54e08a}';
  const state = harness({}, true, css);
  const style = state.styles['nova-appearance-css'];
  assert.ok(style.textContent.includes('#a5b4fc'));
  const originalDirections = state.navigation;
  state.context.api.accentSetting().onChange('blue');
  assert.equal(state.storage.nova_skin_accent, 'blue');
  assert.equal(state.styles['nova-appearance-css'], style, 'keep the original style node');
  assert.ok(style.textContent.includes('#74b9ff'));
  assert.ok(style.textContent.includes('rgba(116,185,255,.06)'));
  assert.ok(style.textContent.includes('padding:12px'));
  assert.ok(style.textContent.includes('.neutral{color:#f3edd8;background:#0c0c0d}.seen{color:#54e08a}'));
  assert.equal(state.replacements(), 0, 'changing color never replaces the activity');
  assert.equal(state.setting.param.default, 'nova', 'appearance remains unchanged');
  assert.equal(state.context.novaUp, originalDirections.up);
  state.context.api.accentSetting().onChange('mint');
  assert.ok(style.textContent.includes('#64d8c3'));
  assert.equal(style.textContent.includes('#74b9ff'), false, 'always recolor the pristine CSS');
  const reloaded = harness(state.storage, true, css);
  assert.equal(reloaded.context.api.accent(), 'mint');
  assert.equal(reloaded.styles['nova-appearance-css'].textContent, style.textContent);
  for (const [name, color, rgb] of [['gold','#d8b56a','216,181,106'],['silver','#c7cdd8','199,205,216']]) {
    state.context.api.accentSetting().onChange(name);
    assert.ok(style.textContent.includes(color));
    assert.ok(style.textContent.includes('rgba(' + rgb + ',.06)'));
    assert.equal(state.replacements(), 0);
    assert.equal(harness(state.storage).context.api.accent(), name);
  }
});

test('invalid saved accents fall back to lavender without affecting the selected appearance', () => {
  const state = harness({ nova_skin_accent: 'unknown', nova_skin_appearance: 'credits' });
  assert.equal(state.context.api.accent(), 'lavender');
  assert.equal(state.context.api.current(), 'credits');
  state.context.api.accentSetting().onChange('invalid');
  assert.equal(state.context.api.accent(), 'lavender');
  assert.equal(state.replacements(), 0);
});

test('accent setting follows the plugin language and safely falls back to English', () => {
  for (const [language, title] of [['uk','Колір акценту'],['ua','Колір акценту'],['ru','Цвет акцента'],['en','Accent color'],['unknown','Accent color'],['__proto__','Accent color']]) {
    const state = harness({ language });
    assert.equal(state.context.api.accentSetting().field.name, title);
  }
});

test('all appearances retain the original Nova directional handlers', () => {
  for (const mode of modes) {
    const state = harness({ nova_skin_appearance: mode });
    for (const [direction, original] of Object.entries(state.navigation)) {
      assert.equal(state.context['nova' + direction[0].toUpperCase() + direction.slice(1)], original, mode + ' keeps Nova ' + direction);
    }
  }
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

test('missing SettingsApi retains the original settings error handling', () => {
  const state = harness();
  state.context.Lampa.SettingsApi = null;
  assert.doesNotThrow(() => state.context.settings());
});

test('the generator fails closed on missing or duplicated appearance integration anchors', async () => {
  const patch = fs.existsSync(patchPath)
    ? (await import(pathToFileURL(patchPath).href)).patchAppearance
    : value => value;
  let pristine = source.replace(/\r\n/g, '\n');
  const runtimeStart = pristine.indexOf('  // LampaUA appearance adapters.');
  if (runtimeStart !== -1) {
    const startup = pristine.indexOf('  function start() {', runtimeStart);
    pristine = pristine.slice(0, runtimeStart) + pristine.slice(startup);
    pristine = pristine.replace(/^    installNovaAppearance\(.*\);\n/m, '');
    pristine = pristine.replace("        var active = Lampa.Activity.active();\n        if (e.object && active && e.object !== active) return;\n", '');
  }
  assert.throws(() => patch(pristine.replace('  function start() {', '  function renamedStart() {')), /appearance|Appearance/);
  assert.throws(() => patch(pristine + '\n  function start() {}'), /appearance|Appearance/);
  assert.throws(() => patch(pristine.replace('  function buildCard(', '  function renamedCard(')), /appearance|Appearance/);
  assert.throws(() => patch(pristine.replace("      if (e.type === 'destroy') {", "      if (e.type === 'removed') {")), /appearance|Appearance/);
  assert.throws(() => patch(patch(pristine)), /already installed/);
});

module.exports = { harness };
