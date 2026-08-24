'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

let buildPremiumSource;

test.before(async () => {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '..', 'scripts', 'build-nova-skin-premium.mjs')
  );
  ({ buildPremiumSource } = await import(moduleUrl.href));
});

function upstreamFixture(eol = '\r\n') {
  return [
    '(function () {',
    "  'use strict';",
    '',
    '  if (window.nova_skin) return;',
    '  window.nova_skin = true;',
    '',
    "  var ENABLED_KEY = 'nova_skin_enabled';",
    "  function get() { return true; }",
    '  function enabled() { return get(ENABLED_KEY, true) !== false; }',
    '',
    '  var lang = {',
    "    nova_skin_set_probe_ext: { ru: 'Источники проверяет сам онлайн-плагин, повторный обход не нужен', uk: 'Джерела перевіряє сам онлайн-плагін, повторний обхід не потрібен', en: 'The online plugin checks sources itself, no second pass needed' },",
    '  };',
    '',
    '  function readCard(node, index) {',
    '    var origin = $(node);',
    "    var line = origin.find('.time-line').first();",
    "    var hash = line.attr('data-hash') || '';",
    '    var percent = 0;',
    '',
    '    if (hash) {',
    '      try { percent = Lampa.Timeline.view(hash).percent || 0; } catch (e) { percent = 0; }',
    '    }',
    '    if (!percent) {',
    "      var raw = (line.children('div').first().attr('style') || '').match(/([\\d.]+)%/);",
    '      if (raw) percent = parseFloat(raw[1]) || 0;',
    '    }',
    '',
    '    return {',
    '      origin: origin,',
    '      index: index,',
    '      folder: false,',
    '      soon: false,',
    '      percent: percent,',
    '      hash: hash',
    '    };',
    '  }',
    '',
    '  function pickResume(full) {',
    '    var i;',
    '    if (!full || !full.length) return null;',
    '',
    '    var list = full.filter(function (item) {',
    '      return !item.soon;',
    '    });',
    '    if (!list.length) return null;',
    '',
    '    if (!serial) {',
    '      for (i = 0; i < list.length; i++) {',
    '        if (isSeen(list[i])) continue;',
    '        if (list[i].percent > 0 && list[i].percent < SEEN_PERCENT) return list[i];',
    '      }',
    '      return list[0];',
    '    }',
    '',
    '    for (i = 0; i < list.length; i++) {',
    '      if (isStarted(list[i])) return list[i];',
    '    }',
    '    for (i = 0; i < list.length; i++) {',
    '      if (!isSeen(list[i])) return list[i];',
    '    }',
    '    return list[list.length - 1];',
    '  }',
    '',
    '  function settingsFixture() {',
    '      Lampa.SettingsApi.addParam({',
    "        component: 'nova_skin',",
    "        param: { name: 'nova_skin_probe', type: 'trigger', default: false },",
    '        field: {',
    "          name: label('nova_skin_set_probe'),",
    "          description: label('nova_skin_set_probe_descr')",
    '        },',
    '        onChange: function () { redraw(); }',
    '      });',
    '',
    '      try {',
    "        Lampa.Settings.listener.follow('open', function (e) {",
    "          if (!e || e.name !== 'nova_skin' || !e.body) return;",
    '',
    '          var mode = probeHook();',
    "          var item = e.body.find('[data-name=\"nova_skin_probe\"]');",
    '          if (!item.length) return;',
    '',
    "          if (mode === 'disabled') {",
    "            item.addClass('hide');",
    '            return;',
    '          }',
    '',
    "          item.removeClass('hide');",
    '',
    "          var descr = item.find('.settings-param__descr');",
    '          if (!descr.length) return;',
    '',
    "          if (mode === 'external') {",
    "            descr.text(label('nova_skin_set_probe_ext'));",
    "            item.css('opacity', '.6');",
    '          } else {',
    "            descr.text(label('nova_skin_set_probe_descr'));",
    "            item.css('opacity', '');",
    '          }',
    '        });',
    '      } catch (e) {}',
    '  }',
    '',
    '  function freshItem() {}',
    '})();',
    ''
  ].join(eol);
}

function patchedPolicy(output) {
  const normalized = output.replace(/\r\n/g, '\n');
  const start = normalized.indexOf('  function pickResume(full) {');
  const end = normalized.indexOf('\n\n  function freshItem()', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const context = {
    serial: true,
    SEEN_PERCENT: 90,
    percentOf(item) {
      return Number(item && item.percent) || 0;
    },
    isSeen(item) {
      return !!(item && (item.viewed || Number(item.percent) >= 90));
    },
    isStarted(item) {
      const percent = Number(item && item.percent) || 0;
      return percent > 0 && percent < 90;
    }
  };
  vm.runInNewContext(normalized.slice(start, end) + '\nthis.pickResume = pickResume;', context);
  return context.pickResume;
}

function renderedProbeSetting(output, mode) {
  const normalized = output.replace(/\r\n/g, '\n');
  const start = normalized.indexOf('  function settingsFixture() {');
  const end = normalized.indexOf('\n\n  function freshItem()', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const added = [];
  const context = {
    Lampa: {
      SettingsApi: {
        addParam(param) {
          added.push(param);
        }
      }
    },
    label(key) {
      return key;
    },
    probeHook() {
      return mode;
    },
    redraw() {}
  };
  vm.runInNewContext(
    normalized.slice(start, end) + '\nthis.settingsFixture = settingsFixture;',
    context
  );
  context.settingsFixture();
  return added;
}

function episodes(progress) {
  return Array.from({ length: 10 }, (_, index) => ({
    num: index + 1,
    index,
    percent: 0,
    updated: 0,
    viewed: false,
    soon: false,
    ...(progress[index + 1] || {})
  }));
}

test('normalizes LF while adding the Premium access guard and timeline updated field', () => {
  const output = buildPremiumSource(upstreamFixture());

  assert.match(output, /LampaUA Premium build/);
  assert.match(output, /window\.nova_skin_lampac_access !== true/);
  assert.match(output, /window\.nova_skin_lampac_access === true && get/);
  assert.match(output, /updated: updated,/);
  assert.ok(!output.includes('\r'));
  assert.ok(output.includes('\n'));
});

test('renders externally managed probing as static LampaUA information', () => {
  const output = buildPremiumSource(upstreamFixture('\n'));
  const external = renderedProbeSetting(output, 'external');
  const legacy = renderedProbeSetting(output, 'legacy');
  const disabled = renderedProbeSetting(output, 'disabled');

  assert.equal(external.length, 1);
  assert.equal(external[0].param.type, 'static');
  assert.equal(external[0].param.name, 'nova_skin_probe_managed');
  assert.equal(external[0].field.name, 'nova_skin_set_probe');
  assert.equal(external[0].field.description, 'nova_skin_set_probe_managed');
  assert.equal(external[0].onChange, undefined);

  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].param.type, 'trigger');
  assert.equal(legacy[0].param.name, 'nova_skin_probe');
  assert.equal(legacy[0].field.description, 'nova_skin_set_probe_descr');
  assert.equal(typeof legacy[0].onChange, 'function');

  assert.equal(disabled.length, 0);
  assert.match(output, /ru: 'Управляется LampaUA'/);
  assert.match(output, /uk: 'Керується LampaUA'/);
  assert.match(output, /en: 'Managed by LampaUA'/);
  assert.ok(!output.includes("item.css('opacity', '.6')"));
});

test('keeps a directly loaded Premium build inert without bridge entitlement', () => {
  const output = buildPremiumSource(upstreamFixture('\n'));
  const denied = { window: { nova_skin_lampac_access: false } };
  vm.runInNewContext(output, denied);
  assert.equal(denied.window.nova_skin, undefined);

  const allowed = { window: { nova_skin_lampac_access: true } };
  vm.runInNewContext(output, allowed);
  assert.equal(allowed.window.nova_skin, true);
});

test('continues after the newest completed episode instead of an older partial episode', () => {
  const pickResume = patchedPolicy(buildPremiumSource(upstreamFixture('\n')));
  const list = episodes({
    6: { percent: 25, updated: 1_000 },
    8: { percent: 100, updated: 2_000, viewed: true }
  });

  assert.equal(pickResume(list).num, 9);
});

test('resumes the most recently updated partial episode', () => {
  const pickResume = patchedPolicy(buildPremiumSource(upstreamFixture('\n')));
  const list = episodes({
    6: { percent: 25, updated: 1_000 },
    8: { percent: 40, updated: 2_000 }
  });

  assert.equal(pickResume(list).num, 8);
});

test('uses the highest reached episode when legacy progress has no timestamps', () => {
  const pickResume = patchedPolicy(buildPremiumSource(upstreamFixture('\n')));
  const list = episodes({
    6: { percent: 25 },
    8: { percent: 100, viewed: true }
  });

  assert.equal(pickResume(list).num, 9);
});

test('refuses to build when the upstream resume anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'if (isStarted(list[i])) return list[i];',
    'if (isStarted(list[i])) return list[i].origin;'
  );

  assert.throws(() => buildPremiumSource(changed), /resume anchor/i);
});

test('refuses to build when the upstream enable anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'function enabled() { return get(ENABLED_KEY, true) !== false; }',
    'function enabled() { return get(ENABLED_KEY, true) === true; }'
  );

  assert.throws(() => buildPremiumSource(changed), /premium access anchor/i);
});

test('refuses to build when the upstream probe settings anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    "item.css('opacity', '.6');",
    "item.css('opacity', '.5');"
  );

  assert.throws(() => buildPremiumSource(changed), /probe settings anchor/i);
});
