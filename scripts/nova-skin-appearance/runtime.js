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
  function custom() { return enabled() && current() !== 'nova'; }
  function columns() { return current() === 'credits' || current() === 'credits_plus'; }
  function fixed() { return custom() && current() !== 'poster'; }

  function focusable(box) {
    return box && box.length ? box.find('.selector').filter(function () {
      return $(this).is(':visible') && !$(this).closest('.nova-layout__drawer--closed').length;
    }) : $();
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
    ui.appearanceDrawer.find('.selector').addClass('nova-layout__disabled-selector').removeClass('selector');
    if (ui.appearanceSettings) ui.appearanceSettings.attr('aria-expanded', 'false');
    refreshCollection();
    if (restore !== false) focus(listTarget());
    return true;
  }

  function size() {
    if (!custom() || !ui.root) return;
    var narrow = (ui.root[0].clientWidth || window.innerWidth) < 760;
    ui.root.toggleClass('nova-layout--narrow', narrow);
    if (!fixed() || narrow) { ui.root.css('height', ''); return; }
    var height = window.innerHeight || document.documentElement.clientHeight;
    var top = Math.max(0, ui.root[0].getBoundingClientRect().top);
    ui.root.css('height', Math.max(340, height - top - 16) + 'px');
  }

  function frame() {
    if (!custom() || !ui.root) return;
    var mode = current();
    ui.root.addClass('nova-layout nova-layout--' + mode);
    if (state.root !== ui.root[0]) {
      state.root = ui.root[0];
      state.drawer = false;
      state.details = false;
      state.lastList = '';
      state.lastControl = '';
      state.returnList = false;
      ui.appearanceBackdrop = $('<div class="nova-layout__backdrop" aria-hidden="true"><img alt=""></div>').prependTo(ui.root);
      if (columns()) {
        ui.appearanceAside = $('<div class="nova-layout__aside"></div>').appendTo(ui.root).append(ui.hero_box);
        ui.appearanceMain = $('<div class="nova-layout__main"></div>').appendTo(ui.root);
        if (mode === 'credits') ui.appearanceAside.append(ui.rows);
        else {
          ui.appearanceSettings = $('<div class="nova-layout__settings selector" data-nova-focus="appearance:settings" role="button" aria-expanded="false"><span></span><b>›</b></div>');
          ui.appearanceSettings.find('span').text(words().settingsHint);
          bind(ui.appearanceSettings, function () { drawer(!state.drawer); });
          ui.appearanceMain.append(ui.appearanceSettings);
          ui.appearanceDrawer = $('<div class="nova-layout__drawer nova-layout__drawer--closed" aria-hidden="true"><div class="nova-layout__drawer-head"><span></span></div></div>').appendTo(ui.root);
          ui.appearanceDrawer.find('.nova-layout__drawer-head > span').text(words().settings);
          var close = $('<div class="nova-layout__close selector" data-nova-focus="appearance:close" role="button"></div>').text('×').attr('aria-label', words().close);
          bind(close, function () { drawer(false); });
          ui.appearanceDrawer.find('.nova-layout__drawer-head').append(close);
          ui.appearanceDrawer.append(ui.rows);
        }
        ui.appearanceMain.append(ui.list);
      }
      ui.list.on('wheel.novaAppearance', function (event) {
        if (current() !== 'filmstrip') return;
        var wheel = event.originalEvent || event;
        if (Math.abs(wheel.deltaY || 0) > Math.abs(wheel.deltaX || 0)) {
          this.scrollLeft += wheel.deltaY;
          event.preventDefault();
        }
      });
    }
    size();
  }

  function creditsInfo() {
    var box = $('<div class="nova-layout__credits"></div>');
    var add = function (title, entries, limit) {
      if (Object.prototype.toString.call(entries) !== '[object Array]' || !entries.length) return;
      var names = entries.slice(0, limit || 4).map(function (entry) { return entry && (entry.name || entry.original_name) || ''; }).filter(function (name) { return !!name; });
      if (!names.length) return;
      var row = $('<div><b></b><span></span></div>');
      row.find('b').text(title);
      row.find('span').text(names.join(', '));
      box.append(row);
    };
    add(words().creators, movie.created_by);
    add(words().cast, movie.credits && movie.credits.cast);
    add(words().studio, movie.production_companies, 2);
    add(words().network, movie.networks, 2);
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
    var panel = $('<div class="nova-layout__details"><h2></h2><p></p></div>');
    panel.find('h2').text(movie.title || movie.name || '');
    panel.find('p').text(movie.overview || '');
    panel.append(creditsInfo());
    var close = $('<div class="nova-btn selector" data-nova-focus="appearance:details-close" role="button"></div>').text(words().close);
    bind(close, function () { details(false); });
    panel.append(close).appendTo(ui.root);
    ui.appearanceDetails = panel;
    refreshCollection();
    return focus(close);
  }

  function hero() {
    if (!custom() || !ui.hero || !movie) return;
    frame();
    var body = ui.hero.find('.nova-hero__body');
    if (!body.find('.nova-hero__title').length) {
      var mark = body.find('.nova-hero__mark');
      if (mark.length) mark.addClass('nova-hero__title').prependTo(body);
      else $('<div class="nova-hero__title"></div>').text(movie.title || movie.name || '').prependTo(body);
      $('<div class="nova-hero__meta"></div>').insertAfter(body.find('.nova-hero__title'));
    }
    if (!artEnabled()) {
      var meta = body.find('.nova-hero__meta').empty();
      if (movie.vote_average) $('<span></span>').text('★ ' + (+movie.vote_average).toFixed(1)).appendTo(meta);
      var year = String(movie.first_air_date || movie.release_date || '').slice(0, 4);
      if (year) $('<span></span>').text(year).appendTo(meta);
    }
    ui.hero.find('.nova-layout__genres,.nova-layout__credits').remove();
    var genres = $('<div class="nova-layout__genres"></div>');
    var genreList = Object.prototype.toString.call(movie.genres) === '[object Array]' ? movie.genres : [];
    genreList.slice(0, 4).forEach(function (genre) { if (genre) $('<span></span>').text(genre.name || genre).appendTo(genres); });
    if (genres.children().length) genres.insertAfter(body.find('.nova-hero__meta'));
    if (current() !== 'poster') creditsInfo().insertAfter(body.find('.nova-layout__genres,.nova-hero__meta').last());
    if (!ui.hero.find('[data-nova-focus="appearance:details"]').length) {
      var more = $('<div class="nova-btn nova-btn--ghost selector" data-nova-focus="appearance:details" role="button"><span class="nova-btn__label"></span></div>');
      more.find('span').text(words().details);
      bind(more, function () { details(true); });
      more.insertBefore(ui.hero.find('.nova-hero__hint'));
    }
    var picture = ui.hero.find('.nova-hero__bg img').attr('src') || '';
    if (ui.appearanceBackdrop) {
      ui.appearanceBackdrop.toggle(!!picture && artEnabled() && current() !== 'poster');
      if (picture && ui.appearanceBackdrop.find('img').attr('src') !== picture) ui.appearanceBackdrop.find('img').attr('src', picture);
    }
    size();
  }

  function rows() {
    if (!custom() || !ui.rows) return;
    frame();
    ui.rows.find('.nova-toolbar__label').each(function () {
      var label = $(this);
      var chip = label.next('.nova-chip');
      if (chip.length) $('<span class="nova-layout__field"></span>').text(label.text()).prependTo(chip);
      label.remove();
    });
    if (columns() && ui_open) {
      var owner = ui.rows.find('.nova-toolbar [data-nova-focus="' + ui_open + '"]').first();
      if (owner.length) ui.rows.find('.nova-drop').insertAfter(owner);
    }
    if (current() === 'credits_plus') {
      var summary = [];
      if (typeof sourceTitle === 'function') summary.push(sourceTitle());
      if (groups.season && groups.season.subtitle) summary.push(groups.season.subtitle);
      if (groups.voice && groups.voice.subtitle) summary.push(groups.voice.subtitle);
      if (ui.appearanceSettings) ui.appearanceSettings.find('span').text(summary.filter(function (entry) { return !!entry; }).join(' · ') || words().settingsHint);
      if (!state.drawer) drawer(false, false);
    }
    size();
  }

  function textCard(item) {
    var card = $('<div class="nova-card nova-card--credits selector"><div class="nova-card__num"><span></span></div><div class="nova-card__body"><div class="nova-card__title"></div><div class="nova-card__meta"></div><div class="nova-card__line nova-card__line--body"></div></div><div class="nova-card__side"><div class="nova-card__quality"></div><div class="nova-card__time"></div></div></div>');
    card.attr('data-nova-focus', 'item:' + item.index);
    card.find('.nova-card__num span').text(item.num || item.index + 1);
    card.find('.nova-card__title').text(item.title || movie.title || movie.name || '');
    card.find('.nova-card__quality').text(shortQuality(item.quality) || '');
    card.find('.nova-card__time').text(item.time || '');
    if (item.line && item.line.length) card.find('.nova-card__line').append(item.line.clone());
    if (item.viewed || isSeen(item)) card.find('.nova-card__side').append('<div class="nova-card__eye">' + ICON.eye + '</div>');
    if (item.soon) card.addClass('nova-card--soon').removeClass('selector');
    else bind(card, function () { play(item); }, function () { longPress(item); });
    item.card = card;
    return card;
  }

  function scroll(element) {
    if (!fixed() || !ui.root || ui.root.hasClass('nova-layout--narrow')) return false;
    var node = element instanceof jQuery ? element[0] : element;
    if (!node || !$.contains(ui.root[0], node)) return false;
    var panel = $(node).closest('.nova-layout__drawer,.nova-layout__aside,.nova__list,.nova__rows');
    if (!panel.length) return true;
    var target = node.getBoundingClientRect();
    var seat = panel[0].getBoundingClientRect();
    if (current() === 'filmstrip' && panel.is('.nova__list')) {
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
    if (state.details) return true;
    var box = $(last);
    var mode = current();
    var card = box.closest('.nova-card').length > 0;
    var inRows = $.contains(ui.rows[0], last);
    if (mode === 'credits_plus' && state.drawer) {
      if (direction === 'left') return drawer(false);
      if (direction === 'up' || direction === 'down') return step(focusable(ui.appearanceDrawer), direction === 'up' ? -1 : 1);
      return true;
    }
    if (mode === 'credits' || mode === 'credits_plus') {
      if (card) {
        state.lastList = ui_focus;
        if (direction === 'up' || direction === 'down') return step(focusable(ui.list), direction === 'up' ? -1 : 1);
        if (direction === 'right' && mode === 'credits_plus') return drawer(true);
        return focus(mode === 'credits' ? (controlTarget().length ? controlTarget() : ui.play) : ui.play);
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
      if (card) {
        state.lastList = ui_focus;
        if (direction === 'left' || direction === 'right') return step(focusable(ui.list), direction === 'left' ? -1 : 1);
        return direction === 'up' ? focus(controlTarget().length ? controlTarget() : ui.play) : true;
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
      if (direction === 'up' && inRows) return focus(ui.play && ui.play.length ? ui.play : focusable(ui.hero_box).first());
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
    if (columns() && last && $(last).closest('.nova-card').length && ui.play && ui.play.length) return focus(ui.play);
    return false;
  }

  var originalFrame = uiFrame;
  uiFrame = function () { var result = originalFrame.apply(this, arguments); frame(); return result; };
  var originalHero = buildHero;
  buildHero = function () { var result = originalHero.apply(this, arguments); hero(); return result; };
  var originalRows = buildRows;
  buildRows = function () { var result = originalRows.apply(this, arguments); rows(); return result; };
  var originalCard = buildCard;
  buildCard = function (item) {
    return custom() && current() === 'credits' && !item.folder ? textCard(item) : originalCard.apply(this, arguments);
  };
  var originalView = viewMode;
  viewMode = function () { return custom() ? (current() === 'filmstrip' ? 'grid' : 'list') : originalView.apply(this, arguments); };
  var originalStamp = stamp;
  stamp = function () { return originalStamp.apply(this, arguments) + '|' + current(); };
  var originalScroll = scrollTo;
  scrollTo = function (element) { if (!scroll(element)) return originalScroll.apply(this, arguments); };
  var originalFocus = focusNode;
  focusNode = function (target) {
    var result = originalFocus.apply(this, arguments);
    if (custom() && target && result) {
      var node = $(target);
      if (node.closest('.nova-card').length) state.lastList = ui_focus;
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
