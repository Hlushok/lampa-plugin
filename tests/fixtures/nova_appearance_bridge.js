// Injected into the real generated IIFE by the local browser verifier only.
window.novaFixture = {
  mount: function (mode, options, css) {
    options = options || {};
    this.options = options;
    save('nova_skin_appearance', mode);
    save('nova_skin_enabled', true);
    save('nova_skin_logo', false);
    if (options.logo) {
      save('nova_skin_logo', true);
      logoPeek = function () { return '/fixture-logo.svg'; };
      logoFetch = function (target, done) { done('/fixture-logo.svg'); };
      logoUrl = function () { return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="150"><text x="0" y="120" fill="white" font-size="140" font-family="serif">GRIMM</text></svg>'); };
      logoTone = function (src, path, done) { done('ok'); };
    }
    save('nova_skin_probe', false);
    save('nova_skin_hero_art', options.art !== false);
    if (options.language) save('language', options.language);
    root = $('.fixture').addClass('explorer');
    var activityRoot = root;
    host = root.find('.scroll__body')[0];
    movie = {
      id: 39351, name: options.film ? undefined : 'Грімм', title: options.film ? 'Тестовий фільм' : undefined,
      number_of_seasons: options.film ? 0 : 6, vote_average: 8.3,
      first_air_date: '2011-10-28', release_date: '2011-10-28', runtime: 98,
      episode_run_time: [41], backdrop_path: '/fixture-backdrop.jpg',
      overview: 'Детектив розслідує незвичайні події та відкриває таємниці міста. Опис допомагає перевірити пропорції та читабельність оформлення.',
      genres: [{ name: 'Драма' }, { name: 'Детектив' }],
      origin_country: ['US'], networks: [{ name: 'NBC' }],
      credits: { cast: [{ name: 'Девід Джинтолі' }, { name: 'Silas Weir Mitchell' }, { name: 'Russell Hornsby' }, { name: 'Sasha Roiz' }] },
      production_companies: [{ name: 'Universal Television' }],
      created_by: [{ name: 'David Greenwalt' }, { name: 'Джим Коуф' }]
    };
    if (options.longText) {
      movie.name = movie.name && 'Дуже довга назва серіалу: незвичайні пригоди та історії загадкового міста';
      movie.title = movie.title && 'Дуже довга назва фільму: незвичайні пригоди та історії загадкового міста';
      movie.overview = Array(8).join(movie.overview + ' ');
    }
    if (options.people) movie.credits.cast = Array.from({ length: options.people }, function (_, index) { return { id: index + 1, name: 'Актор ' + (index + 1), character: 'Персонаж ' + (index + 1) }; });
    if (options.metadata) {
      delete movie.credits;
      Lampa.Api = { sources: { tmdb: { get: function (url, params, done) {
        window.fixtureActions.push(['metadata', url]);
        // Lampa's actual URL builder ignores unknown params; append_to_response must be in the URL.
        var answer = { id: movie.id };
        if (url.indexOf('?append_to_response=credits') !== -1) answer.credits = { cast: [{ id: 1, name: 'Отриманий актор' }] };
        setTimeout(function () { done(answer); }, 0);
      } } } };
    }
    window.fixtureActivity = { component: 'lampac', movie: movie, activity: { render: function () { return activityRoot; } } };
    groups = {
      sort: [{ title: 'HDVB', source: 'hdvb', selected: true }, { title: 'Другий', source: 'second' }],
      season: { stype: 'season', title: 'Сезон', subtitle: '1 із 6', items: [{ title: '1', selected: true }, { title: '2' }] },
      voice: { stype: 'voice', title: 'Озвучення', subtitle: 'Українська', items: [{ title: 'Українська', selected: true }, { title: 'Original' }] }
    };
    if (options.seasons) {
      groups.season.items = [];
      for (var season = 0; season < options.seasons; season++) groups.season.items.push({ title: String(season + 1), selected: season === 0 });
    }
    if (options.sources) {
      groups.sort = [];
      for (var source = 0; source < options.sources; source++) groups.sort.push({ title: 'Джерело ' + source, source: 'source' + source, selected: source === 0 });
    }
    if (options.voices) {
      groups.voice.items = [];
      for (var voice = 0; voice < options.voices; voice++) groups.voice.items.push({ title: 'Доріжка ' + voice, selected: voice === 0 });
    }
    filter = { onSelect: function (type, choice, value) {
      window.fixtureActions.push(['filter', type]);
      if (type === 'sort') groups.sort.forEach(function (entry) { entry.selected = entry === choice; });
      else {
        var selected = groups[choice.stype];
        selected.items.forEach(function (entry, index) { entry.selected = index === value.index; });
        selected.subtitle = selected.items[value.index].title;
      }
      setTimeout(function () { switchDone(); window.novaFixture.render(); }, 0);
    } };
    filter.nova_sets = { sort: groups.sort, filter: [groups.season, groups.voice] };
    filter.render = function () { return activityRoot.find('.native-results'); };
    filters.unshift(filter);
    if (window.fixtureScroll && scrolls.indexOf(window.fixtureScroll) < 0) scrolls.unshift(window.fixtureScroll);
    extras = [];
    ui = {};
    ui_open = '';
    ui_focus = '';
    ui_page = 0;
    ui_page_focus = -1;
    ui_lock = '';
    serial = !options.film;
    nav = !!options.folders;
    var count = options.count || 12;
    var nativeList = $('.native-results').empty();
    $('<div class="filter--search selector"></div>').on('hover:enter', function () { window.fixtureActions.push(['native-search']); }).appendTo(nativeList);
    for (var i = 0; i < count; i++) {
      var original = $('<div class="online-prestige selector ' + (options.folders ? 'online-prestige--folder' : 'online-prestige--full') + '">' +
        '<div class="online-prestige__img"><img alt=""></div><div class="online-prestige__title"></div>' +
        '<div class="online-prestige__episode-number"></div><div class="online-prestige__info"><span>28 жовтня 2011</span></div>' +
        '<div class="online-prestige__quality">1080p</div><div class="online-prestige__time">41 хв</div>' +
        '<div class="time-line"><div></div></div></div>');
      original.find('img').attr('src', window.fixtureArtwork(i));
      original.find('.online-prestige__title').text((options.film ? 'Озвучення ' : 'Серія ') + (i + 1));
      original.find('.online-prestige__episode-number').text(i + 1);
      original.find('.time-line').attr('data-hash', 'fixture:' + i);
      original.find('.time-line > div').css('width', i === 0 ? '35%' : '0%');
      original.attr('data-index', i).on('hover:enter', function () { window.fixtureActions.push(['play', +$(this).attr('data-index')]); })
        .on('hover:long', function () { window.fixtureActions.push(['long', +$(this).attr('data-index')]); });
      nativeList.append(original);
    }
    installNovaAppearance(css);
    redraw = function () { window.novaFixture.render(); };
    addCSS();
    hookController();
    Lampa.Controller.add('content', {
      name: 'content',
      up: function () { if (window.Navigator && Navigator.canmove('up')) Navigator.move('up'); else if (Lampa.Controller.toggle) Lampa.Controller.toggle('head'); },
      down: function () { if (window.Navigator && Navigator.canmove('down')) Navigator.move('down'); },
      left: function () { if (window.Navigator && Navigator.canmove('left')) Navigator.move('left'); else if (Lampa.Controller.toggle) Lampa.Controller.toggle('menu'); },
      right: function () { if (window.Navigator && Navigator.canmove('right')) Navigator.move('right'); },
      back: function () { window.fixtureActions.push(['back']); }, toggle: function () {}
    });
    ['head','menu'].forEach(function (name) { Lampa.Controller.add(name, { name:name, toggle:function () { window.fixtureActions.push(['controller',name]); }, back:function () { Lampa.Controller.toggle('content'); } }); });
    if (enabled()) this.render();
    else refreshCollection();
    if (options.error) this.showError();
    if (options.loading) this.showLoading();
    if (options.lifecycle) this.listen();
  },
  render: function () {
    if (!enabled()) return;
    items = collect();
    root.addClass('nova-skin-scope nova-skin-chips');
    uiFrame();
    hideHost();
    var grid = viewMode() === 'grid';
    ui.list.toggleClass('nova__list--grid', grid).empty();
    var begin = Math.max(0, ui_page);
    var limit = Math.min(items.length, begin + JUMP_FROM);
    items.forEach(function (item) { item.card = null; item.origin.removeClass('selector'); });
    for (var i = begin; i < limit; i++) ui.list.append(buildCard(items[i], false, grid));
    buildHero();
    buildRows();
    var wanted = ui_page_focus >= 0 && items[ui_page_focus] ? items[ui_page_focus].card : null;
    ui_page_focus = -1;
    restoreFocus(wanted || ui.play || ui.list.children().first());
  },
  showError: function () {
    save('nova_skin_auto_switch', false);
    items = [];
    ui_focus = '';
    var search = $('<div class="filter--search selector"></div>').appendTo(root);
    search.on('hover:enter', function () { window.fixtureActions.push(['clarify']); });
    var native = $('<div class="online-empty"><div class="online-empty__title">Нічого не знайдено</div><div class="online-empty__time">Спробуйте інше джерело</div></div>');
    $('.native-results').empty().append(native);
    notePanel({ node: native });
  },
  showLoading: function () {
    items = [];
    ui_focus = '';
    ui.hero_box.empty();
    ui.hero = null;
    loadingPanel();
  },
  finishLoading: function () { loadingStop(); this.render(); },
  actorRoundTrip: function () {
    var online = window.fixtureActivity;
    var actorRoot = $('<div class="fixture-actor"></div>').appendTo(document.body);
    var actor = { component: 'actor', activity: { render: function () { return actorRoot; } } };
    window.fixtureActivity = actor;
    Lampa.Listener.send('activity', { type: 'start', object: actor });
    window.fixtureActivity = online;
    Lampa.Listener.send('activity', { type: 'start', object: online });
    Lampa.Listener.send('activity', { type: 'archive', object: online });
    setTimeout(function () {
      actorRoot.remove();
      Lampa.Listener.send('activity', { type: 'destroy', object: actor });
    }, 200);
  },
  focus: function (key) { return focusNode(seek(key), true); },
  key: function (direction) { return window.fixtureControllers.content[direction](); },
  enter: function (key, long) { var node = seek(key); if (node) node.trigger(long ? 'hover:long' : 'hover:enter'); },
  currentFocus: function () { return ui_focus; },
  current: function () { return installNovaAppearance.api.current(); },
  choose: function (mode) { installNovaAppearance.api.setting().onChange(mode); },
  apply: function (mode) { this.choose(mode); if (enabled()) this.render(); else refreshCollection(); },
  refreshProgress: function (index, percent) { window.fixtureProgress[index] = percent; refreshMarks(); },
  restoreHiddenControl: function () { lockFocus('source', 1000); ui_focus = 'source'; restoreFocus(ui.play); },
  state: function () { return { mode: this.current(), focus: ui_focus, open: ui_open }; }
};
