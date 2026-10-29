// Exact-once Premium-only patches. Upstream Nova Skin remains unmodified.
export const searchReliabilityAnchors = {
  draw: `  function draw() {
    if (!enabled() || busy) return;

    var found = scope();`,
  note: `    var native = nativeState();
    if (native) {
      busy = true;`,
  cache: `    if (dead && movie) probeSave(movie.id, dead, 'empty', 0);`,
  rank: `    var state = sourceState(key);
    if (state === 'ok') return 0;`,
  active: `  function sourceActive(item, key, state, graded) {
    if (state === 'empty') return false;`,
  row: `    var probe = probeCache(movie.id).list || {};
    var life = lifeKnown();`,
  filter: `        inst.nova_sets[type] = list;
        return setter.apply(inst, arguments);`,
  status: `      var state = probe[key] ? probe[key].s : (life ? (item.ghost ? 'empty' : 'ok') : '');`,
  more: `text('nova_more_sources', 'nova_skin_more_sources')
        .replace('{count}', hidden.length)`,
  allLabel: `    nova_skin_all_sources: { ru: 'Все источники', uk: 'Всі джерела', en: 'All sources' },`,
  attach: `  function attach() {
    if (!window.MutationObserver || !enabled()) return;
    if (observer) observer.disconnect();

    var target = activeNode();
    if (!target) return;
    observed = target;

    observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var node = records[i].target;
        if (node && node.nodeType === 1 && $(node).closest('.nova-skin-root').length) continue;
        if (pendingLive()) reattach();
        return scheduleNow();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }`,
  detach: `  function detach() {
    if (observer) observer.disconnect();`
};

const searchRuntime = `  function sourceStatusStamp(list) {
    return JSON.stringify((list || []).map(function (item) {
      return [item.source || '', item.title || '', item.ghost, !!item.selected];
    }));
  }

  function sourceResultsChanged(inst) {
    // Native Lampac has already checked these sources. Only repaint the shared
    // controls; never restart the provider search or rebuild hero/episode nodes.
    if (probeHook() !== 'external' || !enabled() || aside || inst !== filter || !inSkin()) return;
    source_results_pending = inst;
    if (busy) return;
    try {
      var controller = Lampa.Controller.enabled();
      // Appearance adapters may refresh their own collection in buildRows.
      // Keep settings/select/player controllers intact until content resumes.
      if (!controller || controller.name !== 'content') return;
      var ownFocus = rowsFocused();
      groups = readGroups(inst);
      buildRows();
      // Native Filter.chosen may trigger the existing DOM observer next. The
      // controls now match the current open/all flags; keep episode DOM cached.
      signature = stamp();
      source_results_pending = null;
      refreshCollection();
      if (ownFocus) restoreFocus(false);
    } catch (error) { searchRecover(error); }
  }

  var source_results_pending = null;
  var search_watch_timer = null;
  var search_watch_state = null;
  var search_watch_target = null;

  function searchWatchStop() {
    clearInterval(search_watch_timer);
    search_watch_timer = null;
    search_watch_state = null;
    search_watch_target = null;
    source_results_pending = null;
  }

  function searchEmptyNote(native) {
    try {
      var title = Lampa.Lang.translate('empty_title_two');
      var message = Lampa.Lang.translate('empty_text');
      return !!title && !!message && title !== 'empty_title_two' && message !== 'empty_text' &&
        native.node.find('.online-empty__title').text().trim() === title.trim() &&
        native.node.find('.online-empty__time').text().trim() === message.trim();
    } catch (e) { return false; }
  }

  function searchRecover(error) {
    // Fail open for this activity only; do not clear user settings/history or
    // restart/cancel the native network search or its source fallback timer.
    var native_host = host;
    aside = true;
    busy = false;
    signature = '';
    note_sig = '';
    searchWatchStop();
    clearTimeout(timer);
    [loadingStop, hopStop, probeStop, inplaceStop, lockRelease, switchDone].forEach(function (stop) {
      try { stop(); } catch (e) {}
    });
    try { if (observer) observer.disconnect(); } catch (e) {}
    observer = null;
    // Keep the content-toggle listener from treating recovery as a new activity
    // and immediately re-entering the failing skin.
    observed = activeNode();
    try { if (root) root.removeClass('nova-skin-scope nova-skin-chips'); } catch (e) {}
    try { if (root) root.find('.nova-hidden').removeClass('nova-hidden'); } catch (e) {}
    try { if (ui.root) ui.root.remove(); } catch (e) {}
    try {
      if (native_host) {
        $(native_host).find('.online-prestige--full,.online-prestige--folder').addClass('selector');
        Lampa.Controller.collectionSet(native_host, false, true);
        Lampa.Controller.enable('content');
      }
    } catch (e) {}
    ui = {};
    try {
      if (error && window.console && window.console.warn) {
        window.console.warn('Nova Skin Premium: restored native Online after a render error', error);
      }
    } catch (e) {}
  }

  function searchWatchTick() {
    if (!enabled() || aside || activeNode() !== search_watch_target) return searchWatchStop();
    if (busy) return;
    try {
      if (source_results_pending) sourceResultsChanged(source_results_pending);
      var found = scope();
      if (!found) return;
      var body = found.body[0];
      var cards = $(body).find('.online-prestige--full,.online-prestige--folder');
      var empty = $(body).find('.online-empty').first();
      var state = {
        body: body, count: cards.length, first: cards[0], last: cards[cards.length - 1],
        empty: empty[0], title: empty.find('.online-empty__title').text(),
        source: currentSourceKey()
      };
      var previous = search_watch_state;
      search_watch_state = state;
      var changed = !previous || previous.body !== state.body || previous.count !== state.count ||
        previous.first !== state.first || previous.last !== state.last ||
        previous.empty !== state.empty || previous.title !== state.title || previous.source !== state.source;
      if (previous && (previous.body !== state.body || previous.first !== state.first || previous.last !== state.last)) {
        signature = '';
      }
      // No redraw of an unchanged ready page, and no poster replacement.
      if (changed || (ui.load && cards.length)) draw();
    } catch (e) { searchRecover(e); }
  }

  function searchWatchStart(target) {
    searchWatchStop();
    if (!target || !enabled() || aside) return;
    search_watch_target = target;
    search_watch_timer = setInterval(searchWatchTick, 500);
  }

  function draw() {
    if (!enabled() || busy || aside) return;
    try { return drawFrame(); }
    catch (e) { searchRecover(e); }
    finally { busy = false; }
  }

  function drawFrame() {
    if (!enabled() || busy) return;

    var found = scope();`;

const replacements = {
  draw: searchRuntime,
  note: `    var native = nativeState();
    if (native) {
      if (native.kind !== 'loading' && probeHook() === 'external' && !searchEmptyNote(native)) {
        searchRecover(null);
        return;
      }
      busy = true;`,
  cache: `    if (dead && movie && probeHook() !== 'external' && searchEmptyNote(native)) {
      probeSave(movie.id, dead, 'empty', 0);
    }`,
  rank: `    if (probeHook() === 'external' && lifeKnown()) return item.ghost === false ? 0 : 3;
    var state = probeHook() === 'external' ? '' : sourceState(key);
    if (state === 'ok') return 0;`,
  active: `  function sourceActive(item, key, state, graded) {
    if (probeHook() === 'external') return !lifeKnown() || item.ghost === false;
    if (state === 'empty') return false;`,
  row: `    var external = probeHook() === 'external';
    var probe = external ? {} : (probeCache(movie.id).list || {});
    var life = lifeKnown();`,
  filter: `        var status = type === 'sort' ? sourceStatusStamp(list) : '';
        var changed = type === 'sort' && inst.nova_source_status !== status;
        inst.nova_sets[type] = list;
        var result = setter.apply(inst, arguments);
        if (type === 'sort') inst.nova_source_status = status;
        if (changed) sourceResultsChanged(inst);
        return result;`,
  status: `      var state = external ? (item.ghost === false ? 'ok' : item.ghost === true ? 'empty' : '')
        : (probe[key] ? probe[key].s : (life ? (item.ghost ? 'empty' : 'ok') : ''));`,
  more: `text('nova_all_sources', 'nova_skin_all_sources') + ' (' + hidden.length + ')'`,
  allLabel: `    nova_skin_all_sources: { ru: 'Все источники', uk: 'Усі джерела', en: 'All sources' },`,
  attach: `  function attach() {
    searchWatchStop();
    if (!enabled() || aside) return;
    try { if (observer) observer.disconnect(); } catch (e) {}
    observer = null;

    var target = activeNode();
    if (!target) return;
    observed = target;
    searchWatchStart(target);
    if (!window.MutationObserver) return;

    try {
      observer = new MutationObserver(function (records) {
        try {
          for (var i = 0; i < records.length; i++) {
            var node = records[i].target;
            if (node && node.nodeType === 1 && $(node).closest('.nova-skin-root').length) continue;
            if (pendingLive()) reattach();
            return scheduleNow();
          }
        } catch (e) { searchRecover(e); }
      });
      observer.observe(target, { childList: true, subtree: true });
    } catch (e) {
      try { if (observer) observer.disconnect(); } catch (ignore) {}
      observer = null;
    }
  }`,
  detach: `  function detach() {
    searchWatchStop();
    try { if (observer) observer.disconnect(); } catch (e) {}`
};

export function patchSearchReliability(source) {
  for (const [label, anchor] of Object.entries(searchReliabilityAnchors)) {
    const count = source.split(anchor).length - 1;
    if (count !== 1) throw new Error('Search reliability ' + label + ' anchor must occur exactly once; found ' + count);
    source = source.replace(anchor, replacements[label]);
  }
  return source;
}
