(function () {
  'use strict';

  var marker = 'nova_skin_lampac_loader';
  var mirror = 'https://hlushok.github.io/nova-skin/nova_skin.js';

  function report(message, error) {
    try {
      if (window.console && typeof window.console.error === 'function') {
        if (error) window.console.error(message, error);
        else window.console.error(message);
      }
    } catch (e) {}
  }

  if (window[marker]) return;
  window[marker] = true;

  window.nova_skin_probe_mode = function () {
    return 'external';
  };

  if (window.nova_skin) return;

  if (
    !window.Lampa ||
    !window.Lampa.Utils ||
    typeof window.Lampa.Utils.putScriptAsync !== 'function'
  ) {
    report('[Nova Skin Lampac] Lampa script loader is unavailable.');
    return;
  }

  var hour = Math.floor(Date.now() / 3600000);
  var url = mirror + '?v=' + hour;

  try {
    window.Lampa.Utils.putScriptAsync(
      [url],
      false,
      function () {
        report('[Nova Skin Lampac] Nova Skin failed to load.');
      },
      false,
      false
    );
  } catch (error) {
    report('[Nova Skin Lampac] Nova Skin request failed.', error);
  }
})();
