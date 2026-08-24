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
