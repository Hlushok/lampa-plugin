(function () {
    'use strict';

    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '2.6.0',
        debug: false,
        settings: {
            enabled: true,
            show_ru: false,
            show_en: true,
            show_ua: true,
            sort_mode: 'popularity.desc'
        }
    };

    // --- ПОВНІ СПИСКИ КІНОТЕАТРІВ ---
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

    // --- ФУНКЦІЯ ВІДКРИТТЯ КАТАЛОГУ (ФІЛЬМИ/СЕРІАЛИ) ---
    function openCinemaCatalog(networkId, name) {
        Lampa.Select.show({
            title: name,
            items: [
                { title: 'Фільми', type: 'movie' },
                { title: 'Серіали', type: 'tv' }
            ],
            onSelect: function (item) {
                var sort = CinemaByWolf.settings.sort_mode || 'popularity.desc';
                if (item.type === 'tv') {
                    sort = sort.replace('release_date', 'first_air_date');
                }

                Lampa.Activity.push({
                    url: 'discover/' + item.type,
                    title: name + ' (' + (item.type === 'tv' ? 'Серіали' : 'Фільми') + ')',
                    component: 'category_full',
                    source: 'tmdb',
                    // Важливо: фільми через companies, серіали через networks
                    networks: item.type === 'tv' ? networkId : '',
                    with_companies: item.type === 'movie' ? networkId : '',
                    sort_by: sort,
                    card_type: true,
                    page: 1
                });
            }
        });
    }

    // --- ВІЗУАЛЬНА ЧАСТИНА ТА ЛОГО ---
    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = Lampa.TMDB.api('network/' + networkId + '?api_key=' + Lampa.TMDB.key());
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    var imgUrl = 'https://image.tmdb.org/t/p/w300' + data.logo_path;
                    callback('<img src="' + imgUrl + '" style="max-width:68px;max-height:68px;">');
                } else {
                    callback('<div style="font-size:22px;line-height:68px;color:#fff;font-weight:bold;">' + name.charAt(0) + '</div>');
                }
            },
            error: function () {
                callback('<div style="font-size:22px;line-height:68px;color:#fff;font-weight:bold;">' + name.charAt(0) + '</div>');
            }
        });
    }

    function openCinemasModal(type) {
        var cinemas = type === 'ru' ? RU_CINEMAS : type === 'en' ? EN_CINEMAS : UA_CINEMAS;
        var titleText = type === 'ru' ? 'RU Кінотеатри' : type === 'en' ? 'EN Кінотеатри' : 'UA Кінотеатри';
        
        var $container = $('<div class="cinemabywolf-cards"></div>');

        cinemas.forEach(function (c) {
            var $card = $('<div class="cinemabywolf-card selector"><div class="cinemabywolf-card__logo">...</div><div class="cinemabywolf-card__name">' + c.name + '</div></div>');
            
            getCinemaLogo(c.networkId, c.name, function(logoHtml) {
                $card.find('.cinemabywolf-card__logo').html(logoHtml);
            });

            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(c.networkId, c.name);
            });
            $container.append($card);
        });

        Lampa.Modal.open({
            title: titleText,
            html: $container,
            size: 'full',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function addMenuButtons() {
        $('.menu__item.cinemabywolf-btn').remove();
        var $menu = $('.menu .menu__list').eq(0);

        if (CinemaByWolf.settings.show_ua) {
            var $btnUA = $('<li class="menu__item selector cinemabywolf-btn"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#FFD700"/></svg></div><div class="menu__text">UA Кіно</div></li>');
            $btnUA.on('hover:enter', function () { openCinemasModal('ua'); });
            $menu.append($btnUA);
        }
        if (CinemaByWolf.settings.show_en) {
            var $btnEN = $('<li class="menu__item selector cinemabywolf-btn"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00dbde"/></svg></div><div class="menu__text">World Кіно</div></li>');
            $btnEN.on('hover:enter', function () { openCinemasModal('en'); });
            $menu.append($btnEN);
        }
        if (CinemaByWolf.settings.show_ru) {
            var $btnRU = $('<li class="menu__item selector cinemabywolf-btn"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ff4b4b"/></svg></div><div class="menu__text">RU Кіно</div></li>');
            $btnRU.on('hover:enter', function () { openCinemasModal('ru'); });
            $menu.append($btnRU);
        }
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'cinemabywolf_set',
            name: 'Онлайн Кінотеатри',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'cinemabywolf_set',
            name: 'show_ua',
            type: 'bool',
            default: true,
            name: 'Показувати UA Кіно'
        });

        Lampa.SettingsApi.addParam({
            component: 'cinemabywolf_set',
            name: 'show_en',
            type: 'bool',
            default: true,
            name: 'Показувати World Кіно'
        });

        Lampa.SettingsApi.addParam({
            component: 'cinemabywolf_set',
            name: 'show_ru',
            type: 'bool',
            default: false,
            name: 'Показувати RU Кіно'
        });
    }

    function startPlugin() {
        var saved = localStorage.getItem('cinemabywolf_settings');
        if (saved) {
            try { CinemaByWolf.settings = JSON.parse(saved); } catch(e) {}
        }

        var style = '<style>' +
            '.cinemabywolf-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 15px; padding: 20px; }' +
            '.cinemabywolf-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255,255,255,0.1); }' +
            '.cinemabywolf-card.focus { background: #fff !important; transform: scale(1.05); color: #000 !important; }' +
            '.cinemabywolf-card.focus .cinemabywolf-card__name { color: #000; }' +
            '.cinemabywolf-card__logo { height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }' +
            '.cinemabywolf-card__name { color: #fff; font-size: 14px; text-align: center; }' +
            '</style>';
        $('head').append(style);

        addSettings();

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') addMenuButtons();
        });

        Lampa.Listener.follow('settings', function(e) {
            if (e.type === 'update') {
                localStorage.setItem('cinemabywolf_settings', JSON.stringify(CinemaByWolf.settings));
                addMenuButtons();
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') startPlugin(); });
})();
