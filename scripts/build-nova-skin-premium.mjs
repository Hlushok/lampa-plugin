import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const markerAnchor = `(function () {
  'use strict';`;

const markerReplacement = `(function () {
  'use strict';

  // LampaUA Premium build: upstream Nova Skin by amikdn; access, managed settings, and resume patches only.

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
