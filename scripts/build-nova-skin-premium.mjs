import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const markerAnchor = `(function () {
  'use strict';`;

const markerReplacement = `(function () {
  'use strict';

  // LampaUA Premium build: upstream Nova Skin by amikdn; access, managed settings, resume, and loading patches only.

  if (window.nova_skin_lampac_access !== true) return;`;

const enabledAnchor = `  function enabled() { return get(ENABLED_KEY, true) !== false; }`;

const enabledReplacement = `  function enabled() {
    return window.nova_skin_lampac_access === true && get(ENABLED_KEY, true) !== false;
  }`;

const probeManagedLabelAnchor = `    nova_skin_set_probe_ext: { ru: 'Источники проверяет сам онлайн-плагин, повторный обход не нужен', uk: 'Джерела перевіряє сам онлайн-плагін, повторний обхід не потрібен', en: 'The online plugin checks sources itself, no second pass needed' },`;

const probeManagedLabelReplacement = `    nova_skin_set_probe_ext: { ru: 'Источники проверяет сам онлайн-плагин, повторный обход не нужен', uk: 'Джерела перевіряє сам онлайн-плагін, повторний обхід не потрібен', en: 'The online plugin checks sources itself, no second pass needed' },
    nova_skin_set_probe_managed: { ru: 'Управляется LampaUA', uk: 'Керується LampaUA', en: 'Managed by LampaUA' },`;

const probeSettingsAnchor = `      Lampa.SettingsApi.addParam({
        component: 'nova_skin',
        param: { name: 'nova_skin_probe', type: 'trigger', default: false },
        field: {
          name: label('nova_skin_set_probe'),
          description: label('nova_skin_set_probe_descr')
        },
        onChange: function () { redraw(); }
      });

      try {
        Lampa.Settings.listener.follow('open', function (e) {
          if (!e || e.name !== 'nova_skin' || !e.body) return;

          var mode = probeHook();
          var item = e.body.find('[data-name="nova_skin_probe"]');
          if (!item.length) return;

          if (mode === 'disabled') {
            item.addClass('hide');
            return;
          }

          item.removeClass('hide');

          var descr = item.find('.settings-param__descr');
          if (!descr.length) return;

          if (mode === 'external') {
            descr.text(label('nova_skin_set_probe_ext'));
            item.css('opacity', '.6');
          } else {
            descr.text(label('nova_skin_set_probe_descr'));
            item.css('opacity', '');
          }
        });
      } catch (e) {}`;

const probeSettingsReplacement = `      var probeSettingsMode = probeHook();

      if (probeSettingsMode !== 'disabled') {
        var probeSettingsManaged = probeSettingsMode === 'external';
        var probeSettingsParam = {
          component: 'nova_skin',
          param: probeSettingsManaged
            ? { name: 'nova_skin_probe_managed', type: 'static' }
            : { name: 'nova_skin_probe', type: 'trigger', default: false },
          field: {
            name: label('nova_skin_set_probe'),
            description: label(probeSettingsManaged ? 'nova_skin_set_probe_managed' : 'nova_skin_set_probe_descr')
          }
        };

        if (!probeSettingsManaged) {
          probeSettingsParam.onChange = function () { redraw(); };
        }

        Lampa.SettingsApi.addParam(probeSettingsParam);
      }`;

const timelineAnchor = `    var percent = 0;

    if (hash) {
      try { percent = Lampa.Timeline.view(hash).percent || 0; } catch (e) { percent = 0; }
    }`;

const timelineReplacement = `    var percent = 0;
    var updated = 0;

    if (hash) {
      try {
        var timeline = Lampa.Timeline.view(hash);
        percent = timeline.percent || 0;
        updated = timeline.updated || 0;
      } catch (e) {
        percent = 0;
        updated = 0;
      }
    }`;

const timelineFieldAnchor = `      percent: percent,
      hash: hash`;

const timelineFieldReplacement = `      percent: percent,
      updated: updated,
      hash: hash`;

const resumeAnchor = `    for (i = 0; i < list.length; i++) {
      if (isStarted(list[i])) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      if (!isSeen(list[i])) return list[i];
    }
    return list[list.length - 1];`;

const resumeReplacement = `    var reached = [];
    var hasUpdated = false;
    for (i = 0; i < list.length; i++) {
      if (!isSeen(list[i]) && percentOf(list[i]) <= 0) continue;

      var stamp = parseFloat(list[i].updated);
      if (isNaN(stamp) || stamp < 0) stamp = 0;
      if (stamp > 0) hasUpdated = true;
      reached.push({ item: list[i], index: i, updated: stamp });
    }

    var latest = null;
    if (reached.length) {
      if (hasUpdated) {
        reached.forEach(function (entry) {
          if (!entry.updated) return;
          if (
            !latest ||
            entry.updated > latest.updated ||
            (entry.updated === latest.updated && entry.index > latest.index)
          ) latest = entry;
        });
      } else {
        latest = reached[reached.length - 1];
      }
    }

    if (latest) {
      if (isStarted(latest.item)) return latest.item;
      for (i = latest.index + 1; i < list.length; i++) {
        if (!isSeen(list[i])) return list[i];
      }
      return latest.item;
    }

    for (i = 0; i < list.length; i++) {
      if (!isSeen(list[i])) return list[i];
    }
    return list[0];`;

const heroLoadingAnchor = `  var loading_started = 0;
  var loading_timer = null;

  function loadingPanel() {
    uiFrame();
    note_sig = '';

    if (ui.hero && ui.hero.parent().length) {
      loadingStop();
      listHold().empty().append(skeleton(4));
      refreshCollection();
      var keep = (lockActive() && seek(ui_lock)) || seek(ui_focus);
      if (keep) focusNode(keep, true);
      return;
    }

    ui.hero_box.empty();
    ui.hero = null;
    ui.hero_kind = '';
    ui.rows.empty();

    if (!ui.load) {
      loading_started = Date.now();
      ui.load = $('<div class="nova-loading">' +
        '<div class="nova-loading__title"></div>' +
        '<div class="nova-loading__text"></div>' +
        '<div class="nova-loading__bar"><div></div></div>' +
        '</div>');
      ui.load.find('.nova-loading__title').text(text('nova_loading_title', 'nova_skin_loading_title'));
    }

    listHold().empty().append(ui.load).append(skeleton(3));
    loadingText();

    clearInterval(loading_timer);
    loading_timer = setInterval(loadingText, 1000);
  }

  function loadingText() {
    if (!ui.load || !ui.load.parent().length) return loadingStop();
    var seconds = Math.max(0, Math.round((Date.now() - loading_started) / 1000));
    var line = text('nova_loading_start', 'nova_skin_loading_start') +
      ' \\u00b7 ' + seconds + text('nova_sec', 'nova_skin_sec');
    ui.load.find('.nova-loading__text').text(line);
    ui.load.find('.nova-loading__bar>div').css('width', Math.min(90, seconds * 7) + '%');
  }

  function loadingStop() {
    clearInterval(loading_timer);
    loading_timer = null;
    ui.load = null;
  }`;

const heroLoadingReplacement = `  var loading_started = 0;
  var loading_timer = null;
  var loading_mark_slot = null;
  var loading_mark_signature = '';

  var LOADING_MARK_CSS = [
    '.nova-skin-root .nova-hero__title--loading{position:relative!important;display:block!important;overflow:visible!important;-webkit-line-clamp:none!important;-webkit-box-orient:horizontal!important}',
    '.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__base,.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__shine{display:block}',
    '.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__base{opacity:.24}',
    '.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__shine{position:absolute!important;top:0;left:0;right:auto;bottom:auto;opacity:1;pointer-events:none;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 42%,#000 58%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 42%,#000 58%,transparent 100%);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:42% 100%;mask-size:42% 100%;-webkit-animation:novaLoadingMarkSweep 1.8s linear infinite;animation:novaLoadingMarkSweep 1.8s linear infinite}',
    '@-webkit-keyframes novaLoadingMarkSweep{0%{-webkit-mask-position:-60% 0}100%{-webkit-mask-position:160% 0}}',
    '@keyframes novaLoadingMarkSweep{0%{-webkit-mask-position:-60% 0;mask-position:-60% 0}100%{-webkit-mask-position:160% 0;mask-position:160% 0}}',
    '@media screen and (prefers-reduced-motion:reduce){.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__shine{display:none!important;-webkit-animation:none!important;animation:none!important}.nova-skin-root .nova-hero__title--loading>.nova-loading-mark__base{opacity:.72}}'
  ].join('');

  function loadingMarkStyles() {
    if (typeof document === 'undefined' || document.getElementById('nova-skin-loading-mark-css')) return;
    var target = document.head || document.body;
    if (!target) return;
    var style = document.createElement('style');
    style.id = 'nova-skin-loading-mark-css';
    style.textContent = LOADING_MARK_CSS;
    target.appendChild(style);
  }

  function loadingMarkRestore() {
    var slot = loading_mark_slot;
    loading_mark_slot = null;
    loading_mark_signature = '';
    if (!slot || !slot.length) return;

    var base = slot.children('.nova-loading-mark__base').first();
    var shine = slot.children('.nova-loading-mark__shine');
    shine.remove();

    if (base.length) {
      if (base.is('img')) {
        base.removeClass('nova-loading-mark__base');
      } else {
        var content = base.contents().detach();
        slot.empty().append(content);
      }
    }
    slot.removeClass('nova-hero__title--loading');
  }

  function loadingMarkSync() {
    if (!ui.hero || !ui.hero.hasClass('nova-hero--loading')) return;

    var slot = logoSlot();
    if (!slot || !slot.length) return;
    if (loading_mark_slot && loading_mark_slot[0] !== slot[0]) loadingMarkRestore();
    loading_mark_slot = slot;

    var picture = slot.children('img').not('.nova-loading-mark__shine').first();
    if (picture.length) {
      picture.addClass('nova-loading-mark__base');
      var picture_class = String(picture.attr('class') || '')
        .replace(/\\bnova-loading-mark__base\\b/g, '')
        .replace(/^\\s+|\\s+$/g, '');
      var picture_signature = 'img:' + (picture.attr('src') || '') + '|' + picture_class;
      var picture_shine = slot.children('img.nova-loading-mark__shine').first();

      if (!picture_shine.length || loading_mark_signature !== picture_signature) {
        picture_shine.remove();
        picture_shine = picture.clone(false)
          .removeClass('nova-loading-mark__base')
          .addClass('nova-loading-mark__shine')
          .attr('aria-hidden', 'true');
        slot.append(picture_shine);
        loading_mark_signature = picture_signature;
      }
      slot.addClass('nova-hero__title--loading');
      return;
    }

    var base = slot.children('span.nova-loading-mark__base').first();
    var value = base.length ? base.text() : slot.text();
    if (!value) return;

    var text_signature = 'text:' + value;
    var text_shine = slot.children('span.nova-loading-mark__shine').first();
    if (!base.length) {
      slot.empty();
      base = $('<span class="nova-loading-mark__base"></span>').text(value);
      slot.append(base);
    }
    if (!text_shine.length || loading_mark_signature !== text_signature) {
      text_shine.remove();
      text_shine = base.clone(false)
        .removeClass('nova-loading-mark__base')
        .addClass('nova-loading-mark__shine')
        .attr('aria-hidden', 'true');
      slot.append(text_shine);
      loading_mark_signature = text_signature;
    }
    slot.addClass('nova-hero__title--loading');
  }

  function loadingHeroPanel() {
    if (!heroEnabled() || !movie) return false;

    if (ui.hero && !ui.hero.parent().length) {
      ui.hero = null;
      ui.hero_kind = '';
    }

    nav = false;
    serial = !!(movie.name || movie.number_of_seasons);
    buildHero();

    if (!ui.hero || !ui.hero.parent().length) return false;

    if (!ui.load) {
      loading_started = Date.now();
      ui.load = $('<div class="nova-loading">' +
        '<div class="nova-loading__title"></div>' +
        '<div class="nova-loading__text"></div>' +
        '</div>');
      ui.load.find('.nova-loading__title').text(text('nova_loading_title', 'nova_skin_loading_title'));
    }

    ui.load.addClass('nova-loading--hero').css({
      padding: '0',
      background: 'none',
      margin: '0',
      minWidth: '0'
    });
    ui.load.find('.nova-loading__title').css({
      fontSize: '1.15em',
      marginBottom: '.2em'
    });
    ui.load.find('.nova-loading__text').css('margin-bottom', '0');

    loadingMarkStyles();
    ui.hero.addClass('nova-hero--loading');
    ui.hero.find('.nova-hero__actions').prepend(ui.load);
    ui.hero.find('.nova-hero__hint').empty();
    ui.hero.find('.nova-hero__season').hide();
    ui.hero.find('.nova-hero__progress').empty().hide();
    loadingMarkSync();
    return true;
  }

  function loadingPanel() {
    uiFrame();
    note_sig = '';

    if (ui.hero && ui.hero.parent().length && !ui.hero.hasClass('nova-hero--loading')) {
      loadingStop();
      listHold().empty().append(skeleton(4));
      refreshCollection();
      var keep = (lockActive() && seek(ui_lock)) || seek(ui_focus);
      if (keep) focusNode(keep, true);
      return;
    }

    ui.rows.empty();

    if (loadingHeroPanel()) {
      listHold().empty().append(skeleton(3));
      refreshCollection();
      loadingText();

      clearInterval(loading_timer);
      loading_timer = setInterval(loadingText, 1000);
      return;
    }

    ui.hero_box.empty();
    ui.hero = null;
    ui.hero_kind = '';

    if (!ui.load) {
      loading_started = Date.now();
      ui.load = $('<div class="nova-loading">' +
        '<div class="nova-loading__title"></div>' +
        '<div class="nova-loading__text"></div>' +
        '<div class="nova-loading__bar"><div></div></div>' +
        '</div>');
      ui.load.find('.nova-loading__title').text(text('nova_loading_title', 'nova_skin_loading_title'));
    }

    listHold().empty().append(ui.load).append(skeleton(3));
    loadingText();

    clearInterval(loading_timer);
    loading_timer = setInterval(loadingText, 1000);
  }

  function loadingText() {
    if (!ui.load || !ui.load.parent().length) return loadingStop();
    var seconds = Math.max(0, Math.round((Date.now() - loading_started) / 1000));
    var line = text('nova_loading_start', 'nova_skin_loading_start') +
      ' \\u00b7 ' + seconds + text('nova_sec', 'nova_skin_sec');
    ui.load.find('.nova-loading__text').text(line);
    loadingMarkSync();
    ui.load.find('.nova-loading__bar>div').css('width', Math.min(90, seconds * 7) + '%');
  }

  function loadingStop() {
    clearInterval(loading_timer);
    loading_timer = null;
    loading_started = 0;

    if (ui.load && ui.load.parent().length) ui.load.remove();
    ui.load = null;
    loadingMarkRestore();

    if (ui.hero && ui.hero.hasClass('nova-hero--loading')) {
      ui.hero.removeClass('nova-hero--loading');
      ui.hero.find('.nova-hero__progress').empty().hide();
    }
  }`;

function occurrences(source, needle) {
  return source.split(needle).length - 1;
}

function replaceExactlyOnce(source, anchor, replacement, label) {
  const count = occurrences(source, anchor);
  if (count !== 1) {
    throw new Error(`${label} anchor must occur exactly once; found ${count}`);
  }
  return source.replace(anchor, replacement);
}

export function buildPremiumSource(upstreamSource) {
  if (typeof upstreamSource !== 'string' || !upstreamSource.trim()) {
    throw new Error('Upstream Nova Skin source is empty');
  }

  let source = upstreamSource.replace(/\r\n/g, '\n');
  source = replaceExactlyOnce(source, markerAnchor, markerReplacement, 'Premium marker');
  source = replaceExactlyOnce(source, enabledAnchor, enabledReplacement, 'Premium access');
  source = replaceExactlyOnce(source, probeManagedLabelAnchor, probeManagedLabelReplacement, 'Probe managed label');
  source = replaceExactlyOnce(source, probeSettingsAnchor, probeSettingsReplacement, 'Probe settings');
  source = replaceExactlyOnce(source, timelineAnchor, timelineReplacement, 'Timeline read');
  source = replaceExactlyOnce(source, timelineFieldAnchor, timelineFieldReplacement, 'Timeline updated field');
  source = replaceExactlyOnce(source, resumeAnchor, resumeReplacement, 'Resume');
  source = replaceExactlyOnce(source, heroLoadingAnchor, heroLoadingReplacement, 'Hero loading');

  return source;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input || !output) {
    throw new Error('Usage: node scripts/build-nova-skin-premium.mjs <upstream.js> <output.js>');
  }

  const source = readFileSync(input, 'utf8');
  writeFileSync(output, buildPremiumSource(source), 'utf8');
}
