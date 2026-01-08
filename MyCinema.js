(function () {
    'use strict';

    // Основний об'єкт плагіна
    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '1.0.0',
        debug: true,
        settings: {
            enabled: true,
            show_ru: false,
            show_en: false,
            show_ua: true
        }
    };

    // Список російських кінотеатрів
    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' },
        { name: 'Premier', networkId: '2859' },
        { name: 'KION', networkId: '4085' },
        { name: 'Okko', networkId: '3871' },
        { name: 'КиноПоиск', networkId: '3827' },
        { name: 'Wink', networkId: '5806' },
        { name: 'ИВИ', networkId: '3923' },
        { name: 'Смотрим', networkId: '5000' },
        { name: 'Первый', networkId: '558' },
        { name: 'СТС', networkId: '806' },
        { name: 'ТНТ', networkId: '1191' },
        { name: 'Пятница', networkId: '3031' },
        { name: 'Россия 1', networkId: '412' },
        { name: 'НТВ', networkId: '1199' }
    ];

    // Список іноземних кінотеатрів
    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' },
        { name: 'Apple TV+', networkId: '2552' },
        { name: 'Disney+', networkId: '2739' },
        { name: 'HBO Max', networkId: '3186' },
        { name: 'Amazon Prime', networkId: '1024' },
        { name: 'SYFY', networkId: '77' },
        { name: 'AMC', networkId: '174' },
        { name: 'Paramount+', networkId: '4330' },
        { name: 'Peacock', networkId: '3353' },
        { name: 'Hulu', networkId: '453' },
        { name: 'BBC One', networkId: '4' },
        { name: 'ITV1', networkId: '9' },
        { name: 'Channel 4', networkId: '45' },
        { name: 'Sky Sci-Fi', networkId: '5647' }
    ];

    // Список українських кінотеатрів
    var UA_CINEMAS = [
        { name: 'Megogo', networkId: '4454' },
        { name: 'Sweet.tv', networkId: '5444' },
        { name: 'Kyivstar TV', networkId: '5625' },
        { name: 'Takflix', networkId: '5413' },
        { name: '1+1', networkId: '1254' },
        { name: 'ICTV', networkId: '1166' },
        { name: 'СТБ', networkId: '1206' },
        { name: 'Новий канал', networkId: '1211' },
        { name: 'Інтер', networkId: '1157' },
        { name: '2+2', networkId: '1259' },
        { name: 'ТЕТ', networkId: '1215' },
        { name: 'НТН', networkId: '1161' },
        { name: 'UA: Перший', networkId: '1264' }
    ];

    // Локалізація для Lampa
    function addLocalization() {
        if (window.Lampa && Lampa.Lang) {
            Lampa.Lang.add({
                cinemabywolf_ru: {
                    ua: 'RU Кінотеатри',
                    ru: 'RU Кинотеатры',
                    en: 'RU Cinemas'
                },
                cinemabywolf_en: {
                    ua: 'EN Кінотеатри',
                    ru: 'EN Кинотеатры',
                    en: 'EN Cinemas'
                },
                cinemabywolf_ua: {
                    ua: 'UA Кінотеатри',
                    ru: 'UA Кинотеатры',
                    en: 'UA Cinemas'
                },
                cinemabywolf_title: {
                    ua: 'Онлайн Кінотеатри',
                    ru: 'Онлайн кинотеатры',
                    en: 'Online Cinemas'
                }
            });
        }
    }

    // SVG іконки кнопок
    function getSVGIcon(type) {
        var text = type.toUpperCase();
        return `<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 48 48">
            <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="currentColor" dominant-baseline="middle">${text}</text>
        </svg>`;
    }

    // Керування кнопками меню
    function removeMenuButtons() {
        $('.cinemabywolf-btn-ru, .cinemabywolf-btn-en, .cinemabywolf-btn-ua').remove();
    }

    function addMenuButtons() {
        removeMenuButtons();
        var $menu = $('.menu .menu__list').eq(0);
        if (!$menu.length) return;

        var items = [
            { id: 'ua', show: CinemaByWolf.settings.show_ua, label: 'UA Кінотеатри' },
            { id: 'en', show: CinemaByWolf.settings.show_en, label: 'EN Кінотеатри' },
            { id: 'ru', show: CinemaByWolf.settings.show_ru, label: 'RU Кінотеатри' }
        ];

        items.forEach(function (item) {
            if (String(item.show) !== 'false') {
                var $btn = $(`
                    <li class="menu__item selector cinemabywolf-btn-${item.id}">
                        <div class="menu__ico">${getSVGIcon(item.id)}</div>
                        <div class="menu__text">${item.label}</div>
                    </li>
                `);
                $btn.on('hover:enter', function () { openCinemasModal(item.id); });
                $menu.append($btn);
            }
        });
    }

    // Отримання логотипів TMDB
    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = 'https://api.themoviedb.org/3/network/' + networkId + '?api_key=' + Lampa.TMDB.key();
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    var imgUrl = 'https://image.tmdb.org/t/p/w300' + data.logo_path;
                    callback('<img src="' + imgUrl + '" alt="' + name + '" style="max-width:68px;max-height:68px;">');
                } else {
                    callback('<div class="logo-placeholder">' + name.charAt(0) + '</div>');
                }
            },
            error: function () {
                callback('<div class="logo-placeholder">' + name.charAt(0) + '</div>');
            }
        });
    }

    // Відкриття каталогу (серіали по мережі)
    function openCinemaCatalog(networkId, name) {
        var sort = CinemaByWolf.settings.sort_mode || 'popularity.desc';
        if (sort.indexOf('release_date') !== -1) sort = sort.replace('release_date', 'first_air_date');
        
        Lampa.Activity.push({
            url: 'discover/tv',
            title: name,
            networks: networkId,
            sort_by: sort,
            component: 'category_full',
            source: 'tmdb',
            card_type: true,
            page: 1
        });
    }

    // Контролер карток (навігація пультом)
    function activateCardsController($container) {
        var name = 'cinemabywolf-cards';
        Lampa.Controller.add(name, {
            toggle: function () {
                Lampa.Controller.collectionSet($container);
                $container.find('.selector.focus').focus() || $container.find('.selector').first().focus();
            },
            back: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });
        Lampa.Controller.toggle(name);
    }

    // Модальне вікно списку кінотеатрів
    function openCinemasModal(type) {
        var cinemas = type === 'ru' ? RU_CINEMAS : type === 'en' ? EN_CINEMAS : UA_CINEMAS;
        var titles = { ru: 'Російські', en: 'Іноземні', ua: 'Українські' };
        
        var $header = $(`<div class="cinemabywolf-modal-header">
            <span class="cinemabywolf-modal-title">${titles[type]} онлайн кінотеатри</span>
        </div>`);
        
        var $container = $('<div class="cinemabywolf-cards"></div>');

        cinemas.forEach(function (c) {
            var $card = $('<div class="cinemabywolf-card selector"></div>');
            var $logo = $('<div class="cinemabywolf-card__logo"></div>');
            
            getCinemaLogo(c.networkId, c.name, function(html) { $logo.html(html); });
            
            $card.append($logo).append('<div class="cinemabywolf-card__name">' + c.name + '</div>');
            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(c.networkId, c.name);
            });
            $container.append($card);
        });

        Lampa.Modal.open({
            title: '',
            html: $('<div></div>').append($header).append($container),
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            },
            size: 'full'
        });
        setTimeout(function() { activateCardsController($container); }, 100);
    }

    // Стилі
    function addStyles() {
        var style = `
            <style id="cinemabywolf-styles">
                .cinemabywolf-cards { display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }
                .cinemabywolf-card { width: 140px; height: 140px; background: rgba(255,255,255,0.05); margin: 10px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; }
                .cinemabywolf-card.focus { background: #fff; color: #000; transform: scale(1.1); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
                .cinemabywolf-card__logo { height: 70px; display: flex; align-items: center; }
                .logo-placeholder { font-size: 40px; font-weight: bold; color: #888; }
                .cinemabywolf-modal-title { font-size: 2em; text-align: center; display: block; margin: 20px 0; background: linear-gradient(90deg, #fc00ff, #00dbde); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            </style>`;
        if (!$('#cinemabywolf-styles').length) $('head').append(style);
    }

    // --- РОБОТА З НАЛАШТУВАННЯМИ ---
    var STORAGE_KEY = 'cinemabywolf_settings';

    function loadSettings() {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                var obj = JSON.parse(saved);
                Object.assign(CinemaByWolf.settings, obj);
            } catch (e) { console.error('Помилка завантаження налаштувань', e); }
        }
    }

    function saveSettings() {
        if (CinemaByWolf.debug) console.log('cinemabywolf: зберігаємо налаштування', CinemaByWolf.settings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(CinemaByWolf.settings));
    }

    // Функція "Про плагін" (Деобфускована та перекладена)
    function showAbout() {
        var html = $(`
            <div class="about-cinemabywolf">
                <h2 style="color: #00dbde">Cinema By Wolf</h2>
                <p>Версія: ${CinemaByWolf.version}</p>
                <hr>
                <p>Цей плагін додає швидкий доступ до популярних стрімінгових сервісів та телеканалів через TMDB Network ID.</p>
                <ul style="text-align: left">
                    <li>Сортування за популярністю та датою.</li>
                    <li>Підтримка UA, EN та RU сегментів.</li>
                    <li>Автоматичне завантаження логотипів.</li>
                </ul>
                <div style="background: #222; padding: 15px; border-radius: 10px; margin-top: 20px;">
                    <p>Підтримати автора:</p>
                    <p style="font-size: 1.2em; color: #fc00ff">Дякуємо за використання!</p>
                </div>
            </div>
        `);

        Lampa.Modal.open({
            title: 'Про плагін',
            html: html,
            size: 'medium',
            onBack: function() { Lampa.Modal.close(); }
        });
    }

    // Ініціалізація
    function init() {
        loadSettings();
        addLocalization();
        addStyles();
        
        // Чекаємо завантаження Lampa
        var readyInterval = setInterval(function () {
            if (typeof $ !== 'undefined' && $('.menu').length) {
                clearInterval(readyInterval);
                addMenuButtons();
            }
        }, 500);
    }

    // Запуск
    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
