// LampaUA appearance adapters. Local to the generated Nova Skin IIFE.
function installNovaAppearance(css) {
  if (installNovaAppearance.api) return installNovaAppearance.api;
  var KEY = 'nova_skin_appearance';
  var ORDER = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
  var TEXT = {
    uk: { title: 'Оформлення', description: 'Вигляд картки та списку серій', names: ['Рідний', 'Нова', 'Афіша', 'Плівка', 'Титри', 'Титри+'], settings: 'Налаштування', close: 'Закрити', details: 'Докладніше', creators: 'Творці', cast: 'У ролях', studio: 'Студія', network: 'Канал', settingsHint: 'Праворуч — налаштування' },
    ru: { title: 'Оформление', description: 'Вид карточки и списка серий', names: ['Родной', 'Нова', 'Афиша', 'Плёнка', 'Титры', 'Титры+'], settings: 'Настройки', close: 'Закрыть', details: 'Подробнее', creators: 'Создатели', cast: 'В ролях', studio: 'Студия', network: 'Канал', settingsHint: 'Вправо — настройки' },
    en: { title: 'Appearance', description: 'Movie details and episode layout', names: ['Native', 'Nova', 'Poster', 'Filmstrip', 'Credits', 'Credits+'], settings: 'Settings', close: 'Close', details: 'More details', creators: 'Creators', cast: 'Cast', studio: 'Studio', network: 'Network', settingsHint: 'Right — settings' }
  };

  function valid(value) { return ORDER.indexOf(value) !== -1; }
  function current() {
    var value = get(KEY, '');
    return valid(value) ? value : (get(ENABLED_KEY, true) === false ? 'native' : 'nova');
  }
  function words() {
    var language = get('language', 'ru');
    language = language === 'ua' ? 'uk' : language;
    return Object.prototype.hasOwnProperty.call(TEXT, language) ? TEXT[language] : TEXT.en;
  }
  function setting() {
    var text = words();
    var values = {};
    ORDER.forEach(function (mode, index) { values[mode] = text.names[index]; });
    return {
      component: 'nova_skin',
      param: { name: KEY, type: 'select', values: values, default: current() },
      field: { name: text.title, description: text.description },
      onChange: function (value) {
        var mode = valid(value) ? value : current();
        save(KEY, mode);
        save(ENABLED_KEY, mode !== 'native');
        // Restore native nodes before an activity replacement can detach them.
        if (root && ui.root) searchRecover(null);
        try { Lampa.Activity.replace(); } catch (error) {}
      }
    };
  }

  enabled = function () {
    return window.nova_skin_lampac_access === true && current() !== 'native';
  };

  var originalSettings = settings;
  settings = function () {
    var api = Lampa.SettingsApi;
    if (!api || typeof api.addParam !== 'function') return originalSettings.apply(this, arguments);
    var addParam = api.addParam;
    api.addParam = function (entry) {
      if (entry && entry.component === 'nova_skin' && entry.param && entry.param.name === ENABLED_KEY) {
        entry = setting();
      }
      return addParam.call(api, entry);
    };
    try { return originalSettings.apply(this, arguments); }
    finally { api.addParam = addParam; }
  };

  var state = { root: null, drawer: false, details: false, lastList: '', lastControl: '', returnList: false };
  var metadata = {};
  var noGap = null;
  function custom() { return enabled() && current() !== 'nova'; }
  function columns() { return current() === 'credits' || current() === 'credits_plus'; }
  function fixed() { return custom() && current() !== 'poster'; }

  function focusable(box) {
    return box && box.length ? box.find('.selector').filter(function () {
      return $(this).is(':visible') && !$(this).closest('.nova-layout__drawer--closed').length;
    }) : $();
  }
  function listMember(element) {
    var node = $(element)[0];
    return !!(node && ui.list && ui.list.length && $.contains(ui.list[0], node));
  }
  function listTarget() {
    var wanted = state.lastList ? seek(state.lastList) : null;
    if (wanted && wanted.length && wanted.is(':visible')) return wanted;
    var target = pickResume(items);
    if (target && target.card && target.card.is(':visible')) return target.card;
    return focusable(ui.list).first();
  }
  function controlTarget() {
    var wanted = state.lastControl ? seek(state.lastControl) : null;
    if (wanted && wanted.length && wanted.is(':visible')) return wanted;
    return focusable(ui.rows).first();
  }
  function heroTarget() {
    return ui.play && ui.play.is(':visible') ? ui.play : focusable(ui.hero_box).first();
  }
  function focus(target) {
    if (!target || !target.length) return true;
    lockRelease();
    focusNode(target, true);
    return true;
  }
  function drawer(show, restore) {
    if (!ui.appearanceDrawer) return false;
    var wasOpen = state.drawer;
    state.drawer = !!show;
    if (show) {
      ui.appearanceDrawer.removeClass('nova-layout__drawer--closed').attr('aria-hidden', 'false');
      ui.appearanceDrawer.find('.nova-layout__disabled-selector').addClass('selector').removeClass('nova-layout__disabled-selector');
      ui.appearanceSettings.attr('aria-expanded', 'true');
      refreshCollection();
      return focus(controlTarget());
    }
    if (wasOpen && ui_open) {
      ui_open = '';
      lockRelease();
      if (typeof probeStop === 'function') probeStop();
      buildRows();
    }
    ui.appearanceDrawer.addClass('nova-layout__drawer--closed').attr('aria-hidden', 'true');
    // Lampa binds mouse clicks only when selector nodes are inserted. Keep the
    // class while hidden; collectionSet(..., true) already excludes the drawer.
    if (ui.appearanceSettings) ui.appearanceSettings.attr('aria-expanded', 'false');
    refreshCollection();
    if (restore !== false) focus(listTarget());
    return true;
  }

  function size() {
    if (!custom() || !ui.root) return;
    var width = window.innerWidth || ui.root[0].clientWidth;
    var narrow = width < 760 || width < window.innerHeight;
    ui.root.toggleClass('nova-layout--narrow bwv--m', narrow && fixed());
    if (!fixed() || narrow) {
      ui.root.css('height', '');
      if (fixed()) ui.root.css('font-size', Math.max(13, Math.min(17, Math.round((window.innerWidth || 400) / 26))) + 'px');
      return;
    }
    var scroll = ui.root.closest('.scroll')[0];
    var height = Math.max(320, Math.round(scroll ? scroll.getBoundingClientRect().height : window.innerHeight * 0.88));
    ui.root.css({ height: height + 'px', fontSize: (Math.round(height / 47 * 10) / 10) + 'px' });
  }

  function frame() {
    if (!custom() || !ui.root) return;
    var mode = current();
    if (noGap === null) {
      var test = $('<div style="position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px"><div></div><div></div></div>').appendTo(document.body);
      noGap = test[0].scrollHeight !== 1;
      test.remove();
    }
    root.addClass('nova-bwa-scope').toggleClass('nova-bwa-fixed', fixed()).toggleClass('nova-bwa-credits', mode === 'credits').toggleClass('nova-bwa-no-gap', noGap);
    ui.root.addClass('nova-layout nova-layout--' + mode);
    if (state.root !== ui.root[0]) {
      state.root = ui.root[0];
      state.drawer = false;
      state.details = false;
      state.lastList = '';
      state.lastControl = '';
      state.returnList = false;
      if (fixed()) {
        ui.root.addClass('bwv ' + (mode === 'filmstrip' ? 'bwv--plenka' : mode === 'credits' ? 'bwv--titry' : 'bwv--plus'));
        ui.appearanceBackdrop = $('<div class="bwv-bd" aria-hidden="true"></div>').prependTo(ui.root);
        $('<div class="bwv-bdf" aria-hidden="true"></div>').insertAfter(ui.appearanceBackdrop);
      }
      if (mode === 'filmstrip') {
        ui.rows.addClass('bwv-chips');
        ui.appearanceRail = $('<div class="bwv-rail bwa-strip"></div>').appendTo(ui.root).append(ui.list);
        ui.list.addClass('bwv-rail__track bwa-strip__track');
      }
      if (columns()) {
        ui.appearanceAside = $('<div class="nova-layout__aside"></div>').addClass(mode === 'credits' ? 'bwv-col bwa-vlist' : 'bwv-left').appendTo(ui.root);
        var asideTrack = mode === 'credits' ? $('<div class="bwa-vlist__track"></div>').appendTo(ui.appearanceAside) : ui.appearanceAside;
        asideTrack.append(ui.hero_box);
        ui.appearanceMain = $('<div class="nova-layout__main"></div>').appendTo(ui.root);
        if (mode === 'credits') {
          asideTrack.append(ui.rows);
          ui.appearanceMain.addClass('bwv-listbox');
          ui.appearanceHeading = $('<div class="bwv-lh"><span class="bwv-row__n"><i>№</i></span><span class="bwv-row__t"><i class="bwv-lh__t"></i></span><span class="bwv-lh__p"></span><span class="bwv-row__q"><i></i></span><span class="bwv-lh__d"><i></i></span><span class="bwv-lh__m"></span></div>').appendTo(ui.appearanceMain);
          ui.appearanceHeading.find('.bwv-row__q i').text(get('language', 'uk') === 'uk' ? 'Якість' : get('language', 'uk') === 'ru' ? 'Качество' : 'Quality');
          ui.appearanceHeading.find('.bwv-lh__d i').text(get('language', 'uk') === 'uk' ? 'Час' : 'Time');
        }
        else {
          ui.appearanceSettings = $('<div class="nova-layout__settings bwv-pline selector" data-nova-focus="appearance:settings" role="button" aria-expanded="false"><span></span></div>');
          ui.appearanceSettings.find('span').text(words().settingsHint);
          bind(ui.appearanceSettings, function () { drawer(!state.drawer); });
          ui.appearanceMain.append(ui.appearanceSettings);
          ui.appearanceDrawer = $('<div class="bwv-drawer bwa-vlist nova-layout__drawer nova-layout__drawer--closed" aria-hidden="true"><div class="bwa-vlist__track"><div class="bwv-drawer__t"></div></div></div>').appendTo(ui.root);
          ui.appearanceDrawer.find('.bwv-drawer__t').text(words().settings);
          ui.appearanceDrawer.find('.bwa-vlist__track').append(ui.rows);
          $('<div class="bwv-ptip"></div>').text(words().settingsHint).appendTo(ui.root);
        }
        ui.appearanceList = $('<div class="bwa-vlist"></div>').addClass(mode === 'credits' ? 'bwv-list' : 'bwv-plist').append(ui.list.addClass('bwa-vlist__track'));
        ui.appearanceMain.append(ui.appearanceList);
      }
      ui.list.add(ui.rows).on('wheel.novaAppearance', function (event) {
        if (current() !== 'filmstrip') return;
        // Activity stacks retain old DOM while the shared ui object is reset.
        var rail = $(this).closest('.bwv-rail,.bwv-chips--opts')[0];
        if (!rail) return;
        var wheel = event.originalEvent || event;
        if (Math.abs(wheel.deltaY || 0) > Math.abs(wheel.deltaX || 0)) {
          rail.scrollLeft += wheel.deltaY;
          event.preventDefault();
        }
      });
    }
    size();
  }

  function data() { return $.extend({}, movie || {}, metadata[tmdbKind() + ':' + tmdbId()] || {}); }
  function loadMetadata() {
    var id = tmdbId(), key = tmdbKind() + ':' + id;
    if (!id || Object.prototype.hasOwnProperty.call(metadata, key)) return;
    metadata[key] = null;
    try {
      var api = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
      if (!api || typeof api.get !== 'function') return;
      api.get(tmdbKind() + '/' + id + '?append_to_response=credits', {}, function (answer) {
        if (!answer || typeof answer !== 'object') return;
        metadata[key] = answer;
        if (custom() && ui.root && movie && key === tmdbKind() + ':' + tmdbId()) {
          var keep = ui_focus;
          hero();
          refreshCollection();
          if (keep) focusNode(seek(keep), true);
        }
      }, function () {});
    } catch (ignore) {}
  }
  function creditsInfo() {
    var info = data();
    var box = $('<div class="bwv-cr"></div>');
    var add = function (title, entries, limit) {
      if (Object.prototype.toString.call(entries) !== '[object Array]' || !entries.length) return;
      var names = entries.slice(0, limit || 4).map(function (entry) { return entry && (entry.name || entry.original_name) || ''; }).filter(function (name) { return !!name; });
      if (!names.length) return;
      var row = $('<div class="bwv-cr__r"><b></b><span></span></div>');
      row.find('b').text(title);
      row.find('span').text(names.join(', '));
      box.append(row);
    };
    var crew = info.created_by || (info.credits && info.credits.crew || []).filter(function (entry) { return entry.job === 'Director'; });
    add(words().creators, crew);
    add(words().cast, info.credits && info.credits.cast, columns() ? 3 : 4);
    add(words().studio, info.production_companies, 2);
    add(words().network, info.networks, 2);
    return box;
  }

  function details(show) {
    state.details = show;
    if (!show) {
      if (ui.appearanceDetails) ui.appearanceDetails.remove();
      ui.appearanceDetails = null;
      refreshCollection();
      return focus(seek('appearance:details'));
    }
    if (ui.appearanceDetails) ui.appearanceDetails.remove();
    var info = data();
    var panel = $('<div class="nova-layout__details bwv-info"><div class="bwv-info__t"></div><div class="bwv-info__d"></div><div class="bwv-info__p bwa-strip"><div class="bwa-strip__track"></div></div><div class="bwv-info__c"></div></div>');
    panel.find('.bwv-info__t').text((movie.title || movie.name || '') + ' — ' + words().details.toLowerCase());
    panel.find('.bwv-info__d').text(info.overview || '');
    var crew = info.created_by || (info.credits && info.credits.crew || []).filter(function (entry) { return entry.job === 'Director'; });
    var people = crew.concat(info.credits && info.credits.cast || []).slice(0, 10);
    people.forEach(function (person, index) {
      if (!person) return;
      var card = $('<div class="bwv-person selector"><div class="bwv-person__ph"></div><div class="bwv-person__n"></div><div class="bwv-person__r"></div></div>').attr('data-nova-focus', 'appearance:person:' + index);
      if (person.profile_path) card.find('.bwv-person__ph').css('background-image', 'url("' + Lampa.TMDB.image('t/p/w185' + person.profile_path) + '")');
      else $('<span></span>').text(String(person.name || '').split(/\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2)).appendTo(card.find('.bwv-person__ph'));
      card.find('.bwv-person__n').text(person.name || '');
      card.find('.bwv-person__r').text(person.character || person.job || (index < crew.length ? words().creators : ''));
      bind(card, function () { try { Lampa.Activity.push({ url: '', component: 'actor', id: person.id, source: 'tmdb' }); } catch (ignore) {} });
      panel.find('.bwa-strip__track').append(card);
    });
    var credits = [];
    if (info.production_companies && info.production_companies.length) credits.push(words().studio + ' — ' + info.production_companies.map(function (entry) { return entry.name; }).join(', '));
    if (info.networks && info.networks.length) credits.push(words().network + ' — ' + info.networks.map(function (entry) { return entry.name; }).join(', '));
    panel.find('.bwv-info__c').text(credits.join(' · '));
    if (!people.length) {
      var close = $('<div class="bwv-btn selector" data-nova-focus="appearance:details-close" role="button"></div>').text(words().close);
      bind(close, function () { details(false); });
      panel.append(close);
    }
    if (ui.root.hasClass('bwv--m')) panel.insertAfter(ui.hero.find('.bwv-btns'));
    else panel.appendTo(ui.root);
    ui.appearanceDetails = panel;
    refreshCollection();
    return focus(focusable(panel).first());
  }

  function quality(value) {
    value = String(value || '');
    var match = value.match(/(2160|1080|720|480|360)/);
    return match ? match[1] + 'p' : /UHD|4K/i.test(value) ? '2160p' : /FHD/i.test(value) ? '1080p' : /HD/i.test(value) ? '720p' : value;
  }
  function progress(item) {
    return $('<span class="bwa-ep__prog"><i></i></span>').find('i').css('width', Math.max(0, Math.min(100, item.percent || 0)) + '%').end();
  }
  function titleHead() {
    var info = data(), head = $('<div class="bwv-head"></div>');
    $('<div class="bwv-title nova-hero__title"></div>').text(movie.title || movie.name || '').appendTo(head);
    var ratings = $('<div class="bwv-rts"></div>');
    [['КП', info.kp_rating], ['IMDb', info.imdb_rating], ['TMDB', info.vote_average]].forEach(function (entry) {
      if (+entry[1] > 0) $('<span class="bwv-rt"><i></i></span>').find('i').text(entry[0]).end().append(document.createTextNode((+entry[1]).toFixed(1))).appendTo(ratings);
    });
    if (ratings.children().length) head.append(ratings);
    var meta = [], year = String(info.release_date || info.first_air_date || '').slice(0, 4);
    if (year) meta.push(year);
    if (serial && info.number_of_seasons) meta.push(info.number_of_seasons + ' ' + (get('language', 'uk') === 'uk' ? 'сезонів' : 'сезонов'));
    var mins = episodeRuntime();
    if (mins) meta.push(mins + (get('language', 'uk') === 'uk' ? (serial ? ' хв серія' : ' хв') : (serial ? ' мин серия' : ' мин')));
    var country = (info.origin_country || [])[0] || ((info.production_countries || [])[0] || {}).name;
    if (country) meta.push(({ US: 'США', GB: 'Велика Британія', UA: 'Україна' })[country] || country);
    var genres = (info.genres || []).slice(0, 2).map(function (genre) { return (genre.name || '').toLowerCase(); }).filter(Boolean).join(', ');
    if (genres) meta.push(genres);
    if (meta.length) $('<div class="bwv-meta"></div>').text(meta.join(' · ')).appendTo(head);
    head.append(creditsInfo());
    return head;
  }
  function favorite() {
    var button = $('<div class="bwv-btn selector" data-nova-focus="appearance:favorite" role="button"></div>');
    function label() {
      var checked = false;
      try { checked = !!Lampa.Favorite.check(movie).book; } catch (ignore) {}
      button.text(checked ? 'В обраному ✓' : 'До обраного');
    }
    bind(button, function () { try { Lampa.Favorite.toggle('book', movie); } catch (ignore) {} label(); });
    label();
    return button;
  }
  function hero() {
    if (!custom() || !movie) return null;
    frame();
    loadMetadata();
    var info = data(), target = nav ? null : pickResume(items), picture = artEnabled() ? heroArt() : '';
    ui.root.toggleClass('nova-bwa-no-art', !picture);
    var started = target && target.percent > 0 && target.percent < SEEN_PERCENT;
    var label = started ? text('nova_continue', 'nova_skin_continue') : text('nova_watch', 'nova_skin_watch');
    var voice = groups.voice && groups.voice.subtitle || '';
    ui.hero_box.empty();
    ui.next = null;
    if (current() === 'poster') {
      ui.hero = $('<div class="bwa-hero"><div class="bwa-hero__bg"><div class="bwa-hero__scrim"></div></div><div class="bwa-hero__content"><div class="bwa-hero__title"></div><div class="bwa-hero__meta"><span class="bwa-hero__q"></span><span></span></div><div class="bwa-hero__chips"></div><div class="bwa-hero__desc"></div><div class="bwa-hero__cta nova-hero__actions"><span class="bwa-play"></span><span class="bwa-hero__voice"></span></div></div><div class="bwa-hero__prog"><i></i></div></div>');
      if (picture) ui.hero.find('.bwa-hero__bg').css('background-image', 'url("' + picture + '")');
      ui.hero.find('.bwa-hero__title').text(movie.title || movie.name || '');
      ui.hero.find('.bwa-hero__q').text((serial ? 'СЕЗОН ' + (seasonNumber() || 1) + ' · ' : '') + (shortQuality(target && target.quality || '') || ''));
      ui.hero.find('.bwa-hero__meta>span').last().text((+info.vote_average > 0 ? '★ ' + (+info.vote_average).toFixed(1) + ' · ' : '') + String(info.release_date || info.first_air_date || '').slice(0, 4));
      (info.genres || []).forEach(function (genre) { $('<span class="bwa-chip"></span>').text(genre.name || '').appendTo(ui.hero.find('.bwa-hero__chips')); });
      ui.hero.find('.bwa-hero__desc').text(info.overview || '');
      ui.hero.find('.bwa-play').html('<svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>').append($('<span class="bwa-play__t"></span>').text(label));
      ui.hero.find('.bwa-hero__voice').text(voice);
      ui.hero.find('.bwa-hero__prog>i').css('width', (target && target.percent || 0) + '%');
      ui.play = target ? ui.hero.addClass('selector').attr('data-nova-focus', 'hero') : null;
      if (ui.play) bindPlay(ui.play);
    } else {
      ui.hero = $('<div class="nova-bwa-hero"></div>').append(titleHead());
      var actions = $('<div class="bwv-btns nova-hero__actions"></div>').appendTo(ui.hero);
      ui.play = null;
      if (target) {
        ui.play = $('<div class="bwv-btn bwv-btn--play selector" data-nova-focus="hero"><span class="bwv-btn__ico"></span><span class="bwa-play__t"></span><small class="bwa-hero__voice"></small><span class="bwa-hero__prog"><i></i></span></div>');
        ui.play.find('.bwa-play__t').text(label);
        ui.play.find('small').text((started && serial ? 'S' + (seasonNumber() || 1) + 'E' + target.num + (voice ? ' · ' : '') : '') + voice);
        ui.play.find('.bwa-hero__prog>i').css('width', (target.percent || 0) + '%');
        bindPlay(ui.play);
        actions.append(ui.play);
      }
      var more = $('<div class="bwv-btn selector" data-nova-focus="appearance:details" role="button"></div>');
      bind(more, function () { details(true); });
      if (current() === 'credits') more.removeClass('bwv-btn').addClass('bwv-it').append($('<span class="bwv-chip__l"></span>').text(words().details), $('<div class="bwv-chip__v"></div>').text('титри, актори, студія'));
      else more.text(words().details);
      actions.append(more);
      if (current() === 'filmstrip') actions.append(favorite());
      if (ui.appearanceBackdrop) ui.appearanceBackdrop.toggle(!!picture).css('background-image', picture ? 'url("' + picture + '")' : 'none');
    }
    ui.hero_box.append(ui.hero);
    ui.hero_kind = target ? 'full' : 'static';
    if (current() !== 'poster' && current() !== 'credits') heroLogo();
    if (ui.appearanceHeading) {
      ui.appearanceHeading.find('.bwv-lh__t').text(serial ? 'Сезон ' + (seasonNumber() || 1) : 'Доріжки');
      ui.appearanceHeading.find('.bwv-lh__p,.bwv-lh__d,.bwv-lh__m').toggle(!!serial);
    }
    size();
    if (fixed() && ui.root.hasClass('bwv--m')) ui.root.css('font-size', Math.max(13, Math.min(17, Math.round((window.innerWidth || 400) / 26))) + 'px');
    return ui.play;
  }

  function rows() {
    if (!custom() || !ui.rows) return;
    frame();
    var poster = current() === 'poster';
    var nativeSearch = root.find('.filter--search').first();
    if (nativeSearch.length && !ui.rows.find('[data-nova-focus="appearance:search"]').length) {
      var search = $('<div class="nova-chip selector" data-nova-focus="appearance:search" data-bwa-label="Пошук"><span class="nova-chip__label"></span></div>');
      search.find('span').text((Lampa.Activity.active() || {}).clarification ? 'Уточнений' : 'Звичайний');
      chip_actions['appearance:search'] = { enter: function () { nativeSearch.trigger('hover:enter'); }, long: null };
      bind(search, chip_actions['appearance:search'].enter);
      ui.rows.find('.nova-toolbar').append(search);
    }
    ui.rows.find('.nova-toolbar__label').each(function () {
      var label = $(this);
      var chip = label.next('.nova-chip');
      if (chip.length) chip.attr('data-bwa-label', label.text());
      label.remove();
    });
    ui.rows.find('.nova-toolbar>.nova-chip').each(function () {
      var chip = $(this), key = chip.attr('data-nova-focus'), value = chip.find('.nova-chip__label').text();
      var label = chip.attr('data-bwa-label') || '';
      chip.empty().addClass(poster ? 'bwa-pill' : current() === 'filmstrip' ? 'bwv-chip' : 'bwv-it');
      chip.append($('<span></span>').addClass(poster ? 'bwa-pill__k' : 'bwv-chip__l').text(label));
      var field = $('<span></span>').addClass(poster ? 'bwa-pill__v' : 'bwv-chip__v').text(value).appendTo(chip);
      if (poster) chip.append('<span class="bwa-pill__c"></span>');
      else if (key === 'voice' && groups.voice) field.append($('<small></small>').text(' ' + quality(items[0] && items[0].quality || '') + (groups.voice.items.length > 1 ? ' · ' + groups.voice.items.length + ' переклади' : '')));
      else if (key === 'season') {
        var parts = String(value).match(/^(\d+)\s*(.*)$/);
        if (parts) field.text(parts[1]).append($('<small></small>').text(parts[2] ? ' ' + parts[2] : ''));
      }
      if (poster && key === 'season') chip.hide();
    });
    ui.rows.find('.nova-drop').addClass(columns() ? 'bwv-opts' : 'bwa-strip__track');
    ui.rows.find('.nova-drop>.nova-chip').each(function () {
      var chip = $(this), value = chip.find('.nova-chip__label').text();
      chip.empty().addClass('bwv-opt').toggleClass('is-cur', chip.hasClass('nova-chip--active')).append($('<span class="bwv-opt__v"></span>').text(value));
    });
    if (current() === 'filmstrip') {
      ui.rows.toggleClass('bwv-chips--opts', !!ui_open);
      if (ui_open) $('<span class="bwv-chips__lab"></span>').text(ui.rows.find('[data-nova-focus="' + ui_open + '"]').attr('data-bwa-label') || '').prependTo(ui.rows);
    }
    if (poster) {
      ui.rows.find('.nova-toolbar').addClass('bwa-pills');
      if (groups.season && groups.season.items.length > 1) {
        $('<div class="bwa-note"></div>').text('Сезони').appendTo(ui.rows);
        var seasons = $('<div class="bwa-seasons"></div>').appendTo(ui.rows);
        groups.season.items.forEach(function (entry, index) {
          var season = $('<div class="bwa-season selector"></div>').toggleClass('is-sel', !!entry.selected).attr('data-nova-focus', 'poster-season:' + index).text(entry.title);
          bind(season, function () { state.returnList = true; chooseOption(groups.season, typeof entry.index === 'number' ? entry.index : index); });
          seasons.append(season);
        });
      }
    }
    if (columns() && ui_open) {
      var owner = ui.rows.find('.nova-toolbar [data-nova-focus="' + ui_open + '"]').first();
      if (owner.length) ui.rows.find('.nova-drop').insertAfter(owner);
    }
    if (current() === 'credits_plus') {
      var summary = [];
      ui.rows.find('.nova-toolbar>.nova-chip').each(function () {
        var chip = $(this), key = chip.attr('data-nova-focus');
        if (key === 'extra:search' || key === 'appearance:search') return;
        summary.push({ label: (chip.attr('data-bwa-label') || '').toLowerCase(), value: chip.find('.bwv-chip__v').text() });
      });
      if (ui.appearanceSettings) {
        ui.appearanceSettings.empty();
        summary.forEach(function (entry, index) {
          if (index) ui.appearanceSettings.append(document.createTextNode(' · '));
          ui.appearanceSettings.append($('<span></span>').text(entry.label + ' '), $('<b></b>').text(entry.value));
        });
      }
      if (!state.drawer) drawer(false, false);
    }
    size();
  }

  function textCard(item) {
    var mode = current(), card, art = ownArt(item) || (artEnabled() ? heroArt() : ''), q = quality(item.quality);
    if (mode === 'poster') {
      card = serial ? $('<div class="bwa-ep"><div class="bwa-ep__art"><span class="bwa-ep__badge"></span><span class="bwa-ep__mark"></span><span class="bwa-ep__scrim"></span><span class="bwa-ep__play">▶</span></div><div class="bwa-ep__body"><div class="bwa-ep__top"><div class="bwa-ep__title"></div><span class="bwa-ep__resume"></span><div class="bwa-ep__time"></div></div><div class="bwa-ep__sub"></div></div></div>') : $('<div class="bwa-voice"><span class="bwa-voice__q"></span><span class="bwa-voice__name"></span></div>');
      card.find('.bwa-ep__badge').text('S' + (seasonNumber() || 1) + 'E' + item.num);
      card.find('.bwa-ep__title,.bwa-voice__name').text(item.title);
      card.find('.bwa-ep__sub').text((item.meta || []).join(' · '));
      card.find('.bwa-voice__q').text(q);
      card.find('.bwa-ep__art').css('background-image', art ? 'url("' + art + '")' : 'none').append(progress(item));
    } else if (mode === 'filmstrip' && serial) {
      card = $('<div class="bwv-card"><div class="bwv-card__im"><span class="bwv-tag bwv-card__n"></span><span class="bwv-tag bwv-card__q"></span><span class="bwa-ep__mark"></span></div><div class="bwv-card__nm"></div><div class="bwv-card__sub"><span class="bwa-ep__time"></span><span class="bwv-card__date"></span></div></div>');
      card.find('.bwv-card__n').text('S' + (seasonNumber() || 1) + ' E' + item.num);
      card.find('.bwv-card__q').text(q).toggle(!!q);
      card.find('.bwv-card__im').css('background-image', art ? 'url("' + art + '")' : 'none').after(progress(item));
      card.find('.bwv-card__nm').text(item.title);
      card.find('.bwv-card__date').text(item.meta && item.meta[0] ? ' · ' + item.meta[0] : '');
    } else if (mode === 'filmstrip') {
      card = $('<div class="bwv-track"><div class="bwv-track__l"></div><div class="bwv-track__n"></div><div class="bwv-track__tags"><span class="bwv-tag"></span></div></div>');
      card.find('.bwv-track__l').text('Доріжка ' + (item.index + 1));
      card.find('.bwv-track__n').text(item.title);
      card.find('.bwv-tag').text(q).toggle(!!q);
      if (item.percent) card.append(progress(item));
    } else if (mode === 'credits_plus') {
      card = $('<div class="bwv-prow"><div class="bwv-prow__im"><span class="bwv-tag bwv-prow__q"></span><span class="bwa-ep__mark"></span></div><div class="bwv-prow__b"><div class="bwv-prow__h"><span class="bwv-prow__n"></span><span class="bwv-prow__t"></span><span class="bwa-ep__time"></span></div><div class="bwv-prow__p"></div></div></div>');
      card.find('.bwv-prow__im').css('background-image', art ? 'url("' + art + '")' : 'none');
      card.find('.bwv-prow__q').text(q).toggle(!!q);
      card.find('.bwv-prow__n').text('E' + item.num);
      card.find('.bwv-prow__t').text(item.title);
      card.find('.bwv-prow__p').text((item.meta || []).join(' · '));
      card.find('.bwv-prow__b').append(progress(item));
      if (!serial) card.addClass('bwv-prow--track').find('.bwv-prow__im,.bwv-prow__n').remove();
    } else {
      card = $('<div class="bwv-row"><span class="bwv-row__n"></span><span class="bwv-row__t"></span><span class="bwv-row__q"><span class="bwv-tag"></span></span><span class="bwa-ep__time"></span><span class="bwa-ep__mark"></span></div>');
      card.find('.bwv-row__n').text(item.num || item.index + 1);
      card.find('.bwv-row__t').text(item.title);
      card.find('.bwv-tag').text(q).toggle(!!q);
      if (serial) card.find('.bwv-row__q').before(progress(item));
      else card.find('.bwa-ep__time,.bwa-ep__mark').remove();
    }
    card.addClass('nova-card selector').toggleClass('nova-card--nav', !!item.folder);
    card.attr('data-nova-focus', 'item:' + item.index);
    card.find('.bwa-ep__time').text(item.time || '');
    card.find('.bwa-ep__mark').text(item.viewed || isSeen(item) ? '✓' : '');
    if (item.soon) card.addClass('is-dim').removeClass('selector');
    else bind(card, function () { play(item); }, item.folder ? null : function () { longPress(item); });
    item.card = card;
    return card;
  }

  function scroll(element) {
    if (!fixed() || !ui.root || ui.root.hasClass('nova-layout--narrow')) return false;
    var node = element instanceof jQuery ? element[0] : element;
    if (!node || !$.contains(ui.root[0], node)) return false;
    // In column layouts rows grow inside the scrolling aside/drawer.
    var panel = $(node).closest(columns() ? '.bwv-info__p,.nova-layout__drawer,.nova-layout__aside,.bwv-list,.bwv-plist' : '.bwv-info__p,.bwv-rail,.nova__rows');
    if (!panel.length) return true;
    var target = node.getBoundingClientRect();
    var seat = panel[0].getBoundingClientRect();
    if ((current() === 'filmstrip' && panel.is('.bwv-rail,.bwv-chips')) || panel.is('.bwv-info__p')) {
      if (target.left < seat.left + 8) panel[0].scrollLeft -= seat.left - target.left + 12;
      if (target.right > seat.right - 8) panel[0].scrollLeft += target.right - seat.right + 12;
    } else {
      if (target.top < seat.top + 8) panel[0].scrollTop -= seat.top - target.top + 12;
      if (target.bottom > seat.bottom - 8) panel[0].scrollTop += target.bottom - seat.bottom + 12;
    }
    return true;
  }

  function step(nodes, delta) {
    var at = -1;
    nodes.each(function (index) { if (this === last) at = index; });
    if (at < 0) return focus(nodes.first());
    var next = at + delta;
    if (next >= 0 && next < nodes.length) return focus(nodes.eq(next));
    if ($(last).hasClass('nova-card')) {
      var index = keyIndex(ui_focus);
      var wanted = index + delta;
      if (wanted >= 0 && wanted < items.length && preselectPage('item:' + wanted)) return true;
    }
    return true;
  }

  function navigate(direction) {
    if (!custom() || current() === 'poster' || !inSkin() || !last) return false;
    if (state.details) {
      if (direction === 'left' || direction === 'right') return step(focusable(ui.appearanceDetails), direction === 'left' ? -1 : 1);
      return true;
    }
    var box = $(last);
    var mode = current();
    var listItem = listMember(last);
    var inRows = $.contains(ui.rows[0], last);
    if (mode === 'credits_plus' && state.drawer) {
      if (direction === 'left') return drawer(false);
      if (direction === 'up' || direction === 'down') return step(focusable(ui.appearanceDrawer), direction === 'up' ? -1 : 1);
      return true;
    }
    if (mode === 'credits' || mode === 'credits_plus') {
      if (listItem) {
        state.lastList = ui_focus;
        if (direction === 'up' || direction === 'down') return step(focusable(ui.list), direction === 'up' ? -1 : 1);
        if (direction === 'right' && mode === 'credits_plus') return drawer(true);
        return focus(mode === 'credits' ? (controlTarget().length ? controlTarget() : heroTarget()) : heroTarget());
      }
      if (direction === 'right') {
        if (box.is('[data-nova-focus="appearance:settings"]')) return drawer(true);
        return focus(listTarget());
      }
      if (direction === 'left') return focus(listTarget());
      if (direction === 'down' && box.is('[data-nova-focus="appearance:settings"]')) return focus(listTarget());
      return step(focusable(mode === 'credits' ? ui.appearanceAside : ui.hero_box), direction === 'up' ? -1 : 1);
    }
    if (mode === 'filmstrip') {
      if (listItem) {
        state.lastList = ui_focus;
        if (direction === 'left' || direction === 'right') return step(focusable(ui.list), direction === 'left' ? -1 : 1);
        return direction === 'up' ? focus(controlTarget().length ? controlTarget() : heroTarget()) : true;
      }
      if (direction === 'left' || direction === 'right') {
        return step(focusable(box.closest('.nova-drop').length ? box.closest('.nova-drop') : (inRows ? ui.rows.find('.nova-toolbar') : ui.hero_box)), direction === 'left' ? -1 : 1);
      }
      if (direction === 'down') {
        if (inRows) {
          if (ui_open && !box.closest('.nova-drop').length) return focus(focusable(ui.rows.find('.nova-drop')).first());
          return focus(listTarget());
        }
        return focus(controlTarget().length ? controlTarget() : listTarget());
      }
      if (direction === 'up' && inRows) return focus(heroTarget());
    }
    return false;
  }

  function back() {
    if (!custom() || !inSkin()) return false;
    if (state.details) return details(false);
    if (state.drawer) return drawer(false);
    if (ui_open) {
      var key = ui_open;
      ui_open = '';
      buildRows();
      return focus(seek(key));
    }
    if (columns() && listMember(last) && heroTarget().length) return focus(heroTarget());
    return false;
  }

  var originalFrame = uiFrame;
  uiFrame = function () { var result = originalFrame.apply(this, arguments); frame(); return result; };
  var originalHero = buildHero;
  buildHero = function () { return custom() ? hero() : originalHero.apply(this, arguments); };
  var originalRows = buildRows;
  buildRows = function () { var result = originalRows.apply(this, arguments); rows(); return result; };
  var originalCard = buildCard;
  buildCard = function (item) {
    return custom() ? textCard(item) : originalCard.apply(this, arguments);
  };
  var originalView = viewMode;
  viewMode = function () { return custom() ? 'list' : originalView.apply(this, arguments); };
  var originalStamp = stamp;
  stamp = function () { return originalStamp.apply(this, arguments) + '|' + current(); };
  var originalScroll = scrollTo;
  scrollTo = function (element) { if (!scroll(element)) return originalScroll.apply(this, arguments); };
  var originalFocus = focusNode;
  focusNode = function (target) {
    var result = originalFocus.apply(this, arguments);
    if (custom() && target && result) {
      var node = $(target);
      if (listMember(node)) state.lastList = ui_focus;
      else if (node.closest('.nova-toolbar').length) state.lastControl = ui_focus;
    }
    return result;
  };
  var originalBind = bind;
  bind = function (element, enter, long) {
    return originalBind(element, function () {
      if (custom() && element.closest('.nova-drop').length) state.returnList = true;
      return enter();
    }, long);
  };
  var originalRestore = restoreFocus;
  restoreFocus = function (fallback) {
    if (custom() && current() === 'credits_plus' && !state.drawer) {
      var locked = seek(ui_lock || ui_focus);
      if (locked && locked.closest('.nova-layout__drawer').length) state.returnList = true;
    }
    if (custom() && state.returnList && !ui_open && ui.list && focusable(ui.list).length) {
      var target = fallback && $(fallback).hasClass('nova-card') ? $(fallback) : listTarget();
      if (state.drawer) drawer(false, false);
      state.returnList = false;
      lockRelease();
      if (target && target.length) ui_focus = target.attr('data-nova-focus') || '';
    }
    return originalRestore.apply(this, arguments);
  };
  var originalFit = typeof fitToolbar === 'function' ? fitToolbar : null;
  if (originalFit) fitToolbar = function () { if (!custom()) return originalFit.apply(this, arguments); };
  if (typeof logoDraw === 'function') {
    var originalLogoDraw = logoDraw;
    logoDraw = function (box) {
      var result = originalLogoDraw.apply(this, arguments);
      if (custom() && box && box.length) {
        var image = box.find('img');
        box.toggleClass('bwv-title', !image.length).toggleClass('nova-bwa-logo-slot', !!image.length);
        image.addClass('bwv-logo');
        image.on('error.novaBwa', function () { box.addClass('bwv-title').removeClass('nova-bwa-logo-slot'); });
      }
      return result;
    };
  }
  var originalMarks = refreshMarks;
  refreshMarks = function () {
    var result = originalMarks.apply(this, arguments);
    if (custom()) items.forEach(function (item) {
      if (!item.card) return;
      item.card.find('.bwa-ep__prog>i').css('width', Math.max(0, Math.min(100, item.percent || 0)) + '%');
      item.card.find('.bwa-ep__mark').text(item.viewed || isSeen(item) ? '✓' : '');
    });
    return result;
  };
  function clearScope() { if (root) root.removeClass('nova-bwa-scope nova-bwa-fixed nova-bwa-credits nova-bwa-no-gap'); }
  var originalRecover = searchRecover;
  searchRecover = function () { clearScope(); return originalRecover.apply(this, arguments); };
  var originalForget = forget;
  forget = function () { if (!pendingLive()) clearScope(); return originalForget.apply(this, arguments); };
  var originalUp = novaUp, originalDown = novaDown, originalLeft = novaLeft, originalRight = novaRight;
  novaUp = function () { return navigate('up') || originalUp.apply(this, arguments); };
  novaDown = function () { return navigate('down') || originalDown.apply(this, arguments); };
  novaLeft = function () { return navigate('left') || originalLeft.apply(this, arguments); };
  novaRight = function () { return navigate('right') || originalRight.apply(this, arguments); };

  var originalHook = hookController;
  hookController = function () {
    originalHook.apply(this, arguments);
    var api = Lampa.Controller;
    if (!api || api.nova_appearance_back) return;
    api.nova_appearance_back = true;
    var add = api.add;
    api.add = function (name, object) {
      if (name === 'content' && object && typeof object.back === 'function' && !object.nova_appearance_back) {
        object.nova_appearance_back = true;
        var originalBack = object.back;
        object.back = function () { if (!back()) return originalBack.apply(this, arguments); };
      }
      return add.apply(this, arguments);
    };
  };

  if (css && !document.getElementById('nova-appearance-css')) {
    var style = document.createElement('style');
    style.id = 'nova-appearance-css';
    style.textContent = css;
    (document.head || document.body).appendChild(style);
  }
  if (typeof addCSS === 'function') {
    var originalCSS = addCSS;
    addCSS = function () {
      var result = originalCSS.apply(this, arguments);
      var style = document.getElementById('nova-appearance-css');
      if (style) (document.body || document.head).appendChild(style);
      return result;
    };
  }
  try { window.addEventListener('resize', size, false); } catch (ignore) {}

  installNovaAppearance.api = { current: current, setting: setting };
  return installNovaAppearance.api;
}
