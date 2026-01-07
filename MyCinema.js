(function () {
    'use strict';

    // Основний об'єкт плагіна
    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '2.1.1',
        debug: true,
        settings: {
            enabled: true,
            show_ru: true, // Можна змінити на false, щоб приховати за замовчуванням
            show_en: true,
            show_ua: true
        }
    };

    // Список сервісів
    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' },
        { name: 'Premier', networkId: '2859' },
        { name: 'KION', networkId: '4085' },
        { name: 'Okko', networkId: '3871' },
        { name: 'КиноПоиск', networkId: '3827' },
        { name: 'Wink', networkId: '5806' },
        { name: 'ИВИ', networkId: '3923' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' },
        { name: 'Apple TV+', networkId: '2552' },
        { name: 'HBO', networkId: '49' },
        { name: 'Disney+', networkId: '2739' },
        { name: 'Amazon Prime', networkId: '1024' }
    ];

    var UA_CINEMAS = [
        { name: 'Megogo', networkId: '4454' },
        { name: 'Sweet.tv', networkId: '5444' },
        { name: 'Kyivstar TV', networkId: '5625' },
        { name: '1+1', networkId: '1254' },
        { name: 'ICTV', networkId: '1166' },
        { name: 'СТБ', networkId: '1206' }
    ];

    // Функція збереження налаштувань (замість обфускованого коду)
    function saveSettings() {
        if (CinemaByWolf.debug) console.log('MyCinema: saving settings', CinemaByWolf.settings);
        localStorage.setItem('cinemabywolf_settings', JSON.stringify(CinemaByWolf.settings));
    }

    // Завантаження налаштувань
    function loadSettings() {
        var saved = localStorage.getItem('cinemabywolf_settings');
        if (saved) {
            try {
                var obj = JSON.parse(saved);
                for (var k in obj) CinemaByWolf.settings[k] = obj[k];
            } catch (e) {
                console.error('MyCinema: error loading settings', e);
            }
        }
        
        // Ініціалізація вимкнених/увімкнених каналів
        ['ru', 'en', 'ua'].forEach(function(type) {
            var key = type + '_cinemas';
            if (!CinemaByWolf.settings[key]) {
                CinemaByWolf.settings[key] = {};
                var list = type === 'ua' ? UA_CINEMAS : type === 'en' ? EN_CINEMAS : RU_CINEMAS;
                list.forEach(function(c) { CinemaByWolf.settings[key][c.networkId] = true; });
            }
        });

        if (!CinemaByWolf.settings.sort_mode) CinemaByWolf.settings.sort_mode = 'popularity.desc';
    }

    // Локалізація
    function addLocalization() {
        if (window.Lampa && Lampa.Lang) {
            Lampa.Lang.add({
                cinemabywolf_title: { ru: 'Кинотеатры', uk: 'Кінотеатри' }
            });
        }
    }

    // Додавання кнопок в меню
    function addMenuButtons() {
        $('.menu__item.cinemabywolf-btn').remove();
        var $menu = $('.menu .menu__list').eq(0);
        if (!$menu.length) return;

        var types = [
            { id: 'ua', title: 'UA Кіно', color: '#ffd700' },
            { id: 'en', title: 'World Cinema', color: '#00dbde' },
            { id: 'ru', title: 'RU Кино', color: '#ff4b4b' }
        ];

        types.forEach(function(type) {
            if (CinemaByWolf.settings['show_' + type.id]) {
                var ico = `<svg width="24" height="24" viewBox="0 0 48 48"><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="${type.color}" dominant-baseline="middle">${type.id.toUpperCase()}</text></svg>`;
                var $btn = $(`<li class="menu__item selector cinemabywolf-btn">
                    <div class="menu__ico">${ico}</div>
                    <div class="menu__text">${type.title}</div>
                </li>`);
                
                $btn.on('hover:enter', function () { openCinemasModal(type.id); });
                $menu.append($btn);
            }
        });
    }

    // Отримання логотипу через TMDB
    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = 'https://api.themoviedb.org/3/network/' + networkId + '?api_key=4ef0d38d4030e4ef5657065350e0f314';
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    callback('<img src="https://image.tmdb.org/t/p/w300' + data.logo_path + '" style="max-width:60px;max-height:60px;">');
                } else {
                    callback('<div style="font-size:20px;font-weight:bold;">' + name.charAt(0) + '</div>');
                }
            },
            error: function () {
                callback('<div style="font-size:20px;font-weight:bold;">' + name.charAt(0) + '</div>');
            }
        });
    }

    function openCinemaCatalog(networkId, name) {
        Lampa.Select.show({
            title: name,
            items: [{ title: 'Фільми', type: 'movie' }, { title: 'Серіали', type: 'tv' }],
            onSelect: function (item) {
                Lampa.Activity.push({
                    url: 'discover/' + item.type,
                    title: name,
                    networks: networkId,
                    component: 'category_full',
                    source: 'tmdb',
                    card_type: true,
                    page: 1
                });
            }
        });
    }

    function openCinemasModal(type) {
        var list = type === 'ua' ? UA_CINEMAS : type === 'en' ? EN_CINEMAS : RU_CINEMAS;
        var $container = $('<div class="cinemabywolf-cards" style="display:flex; flex-wrap:wrap; justify-content:center; padding:20px;"></div>');

        list.forEach(function (c) {
            var $card = $(`<div class="cinemabywolf-card selector" style="width:120px; height:120px; margin:10px; background:rgba(255,255,255,0.05); border-radius:15px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div class="logo-place">...</div>
                <div style="margin-top:10px; font-size:14px;">${c.name}</div>
            </div>`);

            getCinemaLogo(c.networkId, c.name, function(html) {
                $card.find('.logo-place').html(html);
            });

            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(c.networkId, c.name);
            });
            $container.append($card);
        });

        Lampa.Modal.open({
            title: 'Виберіть кінотеатр',
            html: $container,
            size: 'full',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function start() {
        addLocalization();
        loadSettings();
        
        var style = $('<style>' +
            '.cinemabywolf-card.focus { background:#fff !important; color:#000 !important; transform:scale(1.1); transition:0.2s; }' +
            '</style>');
        $('head').append(style);

        if (window.appready) addMenuButtons();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuButtons(); });
    }

    start();
})();
