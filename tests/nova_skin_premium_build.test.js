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
    '  function patchHost(comp) {',
    '    if (!comp || comp.nova_host_hooked) return;',
    "    if (typeof comp.changeBalanser !== 'function') return;",
    '',
    '    comp.nova_host_hooked = true;',
    '',
    "    if (typeof comp.request === 'function') {",
    '      var request = comp.request;',
    '      comp.request = function (url) {',
    '        try { learnUrl(url); } catch (e) {}',
    '        return request.apply(comp, arguments);',
    '      };',
    '    }',
    '',
    '    var real = comp.changeBalanser;',
    '',
    '    comp.changeBalanser = function () {',
    '      return real.apply(comp, arguments);',
    '    };',
    '  }',
    '',
    '  function buildHero() {',
    '    if (!heroEnabled()) {',
    '      ui.hero_box.empty();',
    '      ui.hero = null;',
    "      ui.hero_kind = '';",
    '      return null;',
    '    }',
    '',
    '    var target = nav ? null : pickResume(items);',
    '    var button = playButton();',
    "    var kind = target ? 'full' : 'static';",
    '    var withArt = artEnabled();',
    '',
    '    if (ui.hero && ui.hero_kind !== kind) {',
    '      button.detach();',
    '      nextButton().detach();',
    '      ui.hero_box.empty();',
    '      ui.hero = null;',
    '    }',
    '',
    '    if (!ui.hero) {',
    '      ui.hero_kind = kind;',
    '    }',
    '',
    '    return button;',
    '  }',
    '',
    '  function drawFixture() {',
    '    hopStop();',
    '    hopReset();',
    '    loadingStop();',
    "    root.addClass('nova-skin-scope nova-skin-chips');",
    '    uiFrame();',
    '',
    '    var button = buildHero();',
    '    buildRows();',
    '    return button;',
    '  }',
    '',
    '  var loading_started = 0;',
    '  var loading_timer = null;',
    '',
    '  function loadingPanel() {',
    '    uiFrame();',
    "    note_sig = '';",
    '',
    '    if (ui.hero && ui.hero.parent().length) {',
    '      loadingStop();',
    '      listHold().empty().append(skeleton(4));',
    '      refreshCollection();',
    '      var keep = (lockActive() && seek(ui_lock)) || seek(ui_focus);',
    '      if (keep) focusNode(keep, true);',
    '      return;',
    '    }',
    '',
    '    ui.hero_box.empty();',
    '    ui.hero = null;',
    "    ui.hero_kind = '';",
    '    ui.rows.empty();',
    '',
    '    if (!ui.load) {',
    '      loading_started = Date.now();',
    "      ui.load = $('<div class=\"nova-loading\">' +",
    "        '<div class=\"nova-loading__title\"></div>' +",
    "        '<div class=\"nova-loading__text\"></div>' +",
    "        '<div class=\"nova-loading__bar\"><div></div></div>' +",
    "        '</div>');",
    "      ui.load.find('.nova-loading__title').text(text('nova_loading_title', 'nova_skin_loading_title'));",
    '    }',
    '',
    '    listHold().empty().append(ui.load).append(skeleton(3));',
    '    loadingText();',
    '',
    '    clearInterval(loading_timer);',
    '    loading_timer = setInterval(loadingText, 1000);',
    '  }',
    '',
    '  function loadingText() {',
    '    if (!ui.load || !ui.load.parent().length) return loadingStop();',
    '    var seconds = Math.max(0, Math.round((Date.now() - loading_started) / 1000));',
    "    var line = text('nova_loading_start', 'nova_skin_loading_start') +",
    "      ' \\u00b7 ' + seconds + text('nova_sec', 'nova_skin_sec');",
    "    ui.load.find('.nova-loading__text').text(line);",
    "    ui.load.find('.nova-loading__bar>div').css('width', Math.min(90, seconds * 7) + '%');",
    '  }',
    '',
    '  function loadingStop() {',
    '    clearInterval(loading_timer);',
    '    loading_timer = null;',
    '    ui.load = null;',
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

function heroTransition(output, preserve) {
  const normalized = output.replace(/\r\n/g, '\n');
  const start = normalized.indexOf('  function buildHero(');
  const end = normalized.indexOf('\n\n  function drawFixture()', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const hero = {};
  let emptyCalls = 0;
  let buttonDetaches = 0;
  let nextDetaches = 0;
  const context = {
    nav: false,
    items: [{}],
    ui: {
      hero,
      hero_kind: 'static',
      hero_box: {
        empty() {
          emptyCalls += 1;
        }
      }
    },
    heroEnabled() { return true; },
    pickResume(list) { return list[0] || null; },
    playButton() {
      return {
        detach() {
          buttonDetaches += 1;
        }
      };
    },
    nextButton() {
      return {
        detach() {
          nextDetaches += 1;
        }
      };
    },
    artEnabled() { return true; }
  };

  vm.runInNewContext(
    normalized.slice(start, end) + '\nthis.buildHero = buildHero;',
    context
  );
  context.buildHero(preserve);

  return {
    hero,
    ui: context.ui,
    emptyCalls,
    buttonDetaches,
    nextDetaches
  };
}

function nativeDrawTransition(output) {
  const normalized = output.replace(/\r\n/g, '\n');
  const start = normalized.indexOf('  function patchHost(comp) {');
  const end = normalized.indexOf('\n\n  function buildHero(', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const image = { id: 'loaded-poster' };
  const root = { image };
  const host = { children: [root] };
  const rootBox = {
    0: root,
    parent() {
      return { length: host.children.includes(root) ? 1 : 0 };
    },
    detach() {
      host.children = host.children.filter((item) => item !== root);
      return this;
    }
  };
  let attachedDuringClear = false;

  function jquery(target) {
    assert.equal(target, host);
    return {
      prepend(box) {
        host.children = host.children.filter((item) => item !== box[0]);
        host.children.unshift(box[0]);
      }
    };
  }
  jquery.contains = (parent, child) => parent.children.includes(child);

  const component = {
    changeBalanser() {},
    draw(value) {
      attachedDuringClear = host.children.includes(root);
      host.children = [];
      return `drawn:${value}`;
    }
  };
  const context = {
    ui: { root: rootBox },
    host,
    document: { body: { contains: (node) => node === host } },
    $: jquery,
    inplace: false
  };

  vm.runInNewContext(
    normalized.slice(start, end) + '\nthis.patchHost = patchHost;',
    context
  );
  context.patchHost(component);
  const result = component.draw('episodes');

  return {
    result,
    attachedDuringClear,
    root,
    image,
    host
  };
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

test('renders the initial source search inside the final hero shell', () => {
  const output = buildPremiumSource(upstreamFixture('\n'));

  assert.match(output, /function loadingHeroPanel\(\)/);
  assert.match(output, /function loadingMarkSync\(\)/);
  assert.match(output, /function loadingMarkRestore\(\)/);
  assert.ok(output.includes("ui.hero.addClass('nova-hero--loading')"));
  assert.ok(output.includes("ui.hero.find('.nova-hero__actions').prepend(ui.load)"));
  assert.ok(output.includes("ui.hero.find('.nova-hero__progress').empty().hide()"));
  assert.ok(output.includes('nova-loading-mark__base'));
  assert.ok(output.includes('nova-loading-mark__shine'));
  assert.ok(output.includes('@-webkit-keyframes novaLoadingMarkSweep'));
  assert.ok(output.includes('(prefers-reduced-motion:reduce)'));
  assert.ok(output.split('loadingMarkSync();').length - 1 >= 2);
  assert.ok(output.includes('loadingMarkRestore();'));
  assert.ok(!output.includes("? ui.hero.find('.nova-hero__progress .time-line>div')"));
  assert.ok(output.includes(
    "ui.load.find('.nova-loading__bar>div').css('width', Math.min(90, seconds * 7) + '%');"
  ));
  assert.ok(output.includes("!ui.hero.hasClass('nova-hero--loading')"));
  assert.ok(output.includes("ui.hero.removeClass('nova-hero--loading')"));
  assert.ok(output.includes('ui.load.remove();'));
  assert.ok(output.includes('listHold().empty().append(skeleton(4));'));
  assert.ok(output.includes('listHold().empty().append(skeleton(3));'));
  assert.ok(output.includes('listHold().empty().append(ui.load).append(skeleton(3));'));
  assert.ok(output.includes('focusNode(keep, true);'));
  assert.ok(!output.includes('ui.list.empty().append(skeleton('));
});

test('reuses the loaded hero when source search becomes playable results', () => {
  const output = buildPremiumSource(upstreamFixture('\n'));
  const held = heroTransition(output, true);
  const regular = heroTransition(output, false);

  assert.equal(held.ui.hero, held.hero);
  assert.equal(held.ui.hero_kind, 'full');
  assert.equal(held.emptyCalls, 0);
  assert.equal(held.buttonDetaches, 1);
  assert.equal(held.nextDetaches, 1);

  assert.equal(regular.ui.hero, null);
  assert.equal(regular.emptyCalls, 1);
});

test('keeps the loaded poster mounted while native Online clears its result list', () => {
  const output = buildPremiumSource(upstreamFixture('\n'));
  const transition = nativeDrawTransition(output);

  assert.equal(transition.attachedDuringClear, false);
  assert.equal(transition.result, 'drawn:episodes');
  assert.equal(transition.host.children[0], transition.root);
  assert.equal(transition.host.children[0].image, transition.image);
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

test('refuses to build when the upstream loading anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'listHold().empty().append(skeleton(4));',
    'listHold().empty().append(skeleton(5));'
  );

  assert.throws(() => buildPremiumSource(changed), /hero loading anchor/i);
});

test('refuses to build when the upstream hero reuse anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'if (ui.hero && ui.hero_kind !== kind) {',
    'if (ui.hero && ui.hero_kind !== kind && ui.hero.parent().length) {'
  );

  assert.throws(() => buildPremiumSource(changed), /hero result reuse anchor/i);
});

test('refuses to build when the upstream result render anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'var button = buildHero();',
    'var button = buildHero(false);'
  );

  assert.throws(() => buildPremiumSource(changed), /hero result render anchor/i);
});

test('refuses to build when the upstream result capture anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'hopReset();',
    'hopReset(true);'
  );

  assert.throws(() => buildPremiumSource(changed), /hero result capture anchor/i);
});

test('refuses to build when the native draw preservation anchor has changed', () => {
  const changed = upstreamFixture('\n').replace(
    'var real = comp.changeBalanser;',
    'var real = comp.changeBalanser.bind(comp);'
  );

  assert.throws(() => buildPremiumSource(changed), /native draw preservation anchor/i);
});
