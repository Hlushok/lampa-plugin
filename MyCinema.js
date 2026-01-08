(function () {
    'use strict';

    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '2.3.0',
        settings: {
            enabled: true,
            show_ru: false,
            show_en: true,
            show_ua: true,
            sort_mode: 'popularity.desc'
        }
    };

    // --- ВАШІ ПОВНІ СПИСКИ ДЖЕРЕЛ ---
    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' }, { name: 'Premier', networkId: '2859' },
        { name: 'KION', networkId: '4085' }, { name: 'Okko', networkId: '3871' },
        { name: 'КиноПоиск', networkId: '3827' }, { name: 'Wink', networkId: '5806' },
        { name: 'ИВИ', networkId: '3923' }, { name: 'Смотрим', networkId: '5000' },
        { name: 'Первый', networkId: '558' }, { name: 'СТС', networkId: '806' },
        { name: 'ТНТ', networkId: '1191' }, { name: 'Пятница', networkId: '3031' },
        { name: 'Россия 1', networkId: '412' }, { name: 'НТВ', networkId: '1199' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' }, { name: 'Apple TV+', networkId: '2552' },
        { name: 'Disney+', networkId: '2739' }, { name: 'HBO Max', networkId: '3186' },
        { name: 'Amazon Prime', networkId: '1024' }, { name: 'SYFY', networkId: '77' },
        { name: 'AMC', networkId: '174' }, { name: 'Paramount+', networkId: '4330' },
        { name: 'Peacock', networkId: '3353' }, { name: 'Hulu', networkId: '453' },
        { name: 'BBC One', networkId: '4' }, { name: 'ITV1', networkId: '9' },
        { name: 'Channel 4', networkId: '45' }, { name: 'Sky Sci-Fi', networkId: '5647' }
    ];

    var UA_CINEMAS = [
        { name: 'Megogo', networkId: '4454' }, { name: 'Sweet.tv', networkId: '5444' },
        { name: 'Kyivstar TV', networkId: '5625' }, { name: 'Takflix', networkId: '5413' },
        { name: '1+1', networkId: '1254' }, { name: 'ICTV', networkId: '1166' },
        { name: 'СТБ', networkId: '1206' }, { name: 'Новий канал', networkId: '1211' },
        { name: 'Інтер', networkId: '1157' }, { name: '2+2', networkId: '1259' },
        { name: 'ТЕТ', networkId: '1215' }, { name: 'НТН', networkId: '1161' },
        { name: 'UA: Перший', networkId: '1264' }
    ];

    // --- ЛОГІКА КАТАЛОГУ (ФІЛЬМИ + СЕРІАЛИ) ---
    function openCinemaCatalog(networkId, name) {
        Lampa.Select.show({
            title: name,
            items: [
                { title: 'Фільми', type: 'movie' },
                { title: 'Серіали', type: 'tv' }
            ],
            onSelect: function (item) {
                var sort = CinemaByWolf.settings.sort_mode;
                // Корекція сортування для ТБ
                if (item.type === 'tv') {
                    if (sort === 'release_date.desc') sort = 'first_air_date.desc';
                }

                Lampa.Activity.push({
                    url: 'discover/' + item.type,
                    title: name + ' (' + (item.type === 'movie' ? 'Фільми' : 'Серіали') + ')',
                    component: 'category_full',
                    source: 'tmdb',
                    // Важливо: для фільмів використовуємо with_companies, для тб - networks
                    networks: item.type === 'tv' ? networkId : '',
                    with_companies: item.type === 'movie' ? networkId : '',
                    sort_by: sort,
                    card_type: true,
                    page: 1
                });
            }
        });
    }

    // --- ВІЗУАЛЬНА ЧАСТИНА (МОДАЛКА ТА ЛОГО) ---
    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = Lampa.TMDB.api('network/' + networkId + '?api_key=' + Lampa.TMDB.key());
        $.ajax({
            url: apiUrl, type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    var url = 'https://image.tmdb.org/t/p/w300' + data.logo_path;
                    callback('<img src="' + url + '" style="max-width:70px;max-height:40px;">');
                } else callback('<div style="font-size:22px;color:#fff;font-weight:bold;">' + name.charAt(0) + '</div>');
            },
            error: function () { callback('<div style="font-size:22px;color:#fff;font-weight:bold;">' + name.charAt(0) + '</div>'); }
        });
    }

    function openCinemasModal(type) {
        var list = type === 'ru' ? RU_CINEMAS : type === 'en' ? EN_CINEMAS : UA_CINEMAS;
        var title = type === 'ru' ? 'RU Кінотеатри' : type === 'en' ? 'World Cinemas' : 'UA Кінотеатри';
        
        var $container = $('<div class="wolf-grid"></div>');
        list.forEach(function (c) {
            var $card = $('<div class="wolf-card selector"><div class="wolf-logo">...</div><div class="wolf-name">' + c.name + '</div></div>');
            getCinemaLogo(c.networkId, c.name, function(html) { $card.find('.wolf-logo').html(html); });
            $card.on('hover:enter', function () { Lampa.Modal.close(); openCinemaCatalog(c.networkId, c.name); });
            $container.append($card);
        });

        Lampa.Modal.open({ title: title, html: $container, size: 'full', onBack: function () { Lampa.Modal.close(); Lampa.Controller.toggle('menu'); } });
    }

    // --- МЕНЮ ТА НАЛАШТУВАННЯ ---
    function addMenuButtons() {
        $('.wolf-btn').remove();
        var $menu = $('.menu .menu__list').eq(0);
        var cats = [
            { id: 'ua', title: 'UA Кіно', show: CinemaByWolf.settings.show_ua, color: '#FFD700' },
            { id: 'en', title: 'World Cinema', show: CinemaByWolf.settings.show_en, color: '#00dbde' },
            { id: 'ru', title: 'RU Кіно', show: CinemaByWolf.settings.show_ru, color: '#ff4b4b' }
        ];
        cats.forEach(function(cat) {
            if (cat.show) {
                var $btn = $(`<li class="menu__item selector wolf-btn"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="${cat.color}"><circle cx="12" cy="12" r="10"/></svg></div><div class="menu__text">${cat.title}</div></li>`);
                $btn.on('hover:enter', function () { openCinemasModal(cat.id); });
                $menu.append($btn);
            }
        });
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({ component: 'wolf_cin', name: 'Онлайн Кінотеатри', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>' });
        Lampa.SettingsApi.addParam({ component: 'wolf_cin', name: 'show_ua', type: 'bool', default: true, name: 'Показувати UA' });
        Lampa.SettingsApi.addParam({ component: 'wolf_cin', name: 'show_en', type: 'bool', default: true, name: 'Показувати EN' });
        Lampa.SettingsApi.addParam({ component: 'wolf_cin', name: 'show_ru', type: 'bool', default: false, name: 'Показувати RU' });
    }

    function start() {
        var style = `<style>
            .wolf-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; padding: 20px; }
            .wolf-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); }
            .wolf-card.focus { background: #fff !important; transform: scale(1.05); }
            .wolf-card.focus .wolf-name { color: #000; font-weight: bold; }
            .wolf-card.focus .wolf-logo img { filter: brightness(0); }
            .wolf-logo { height: 45px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
            .wolf-name { color: #fff; font-size: 14px; text-align: center; }
        </style>`;
        $('head').append(style);
        
        var saved = localStorage.getItem('wolf_settings');
        if (saved) CinemaByWolf.settings = JSON.parse(saved);

        addSettings();
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addMenuButtons(); });
        Lampa.Listener.follow('settings', function(e) { 
            if (e.type === 'update') {
                localStorage.setItem('wolf_settings', JSON.stringify(CinemaByWolf.settings));
                addMenuButtons();
            }
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') start(); });
})();
