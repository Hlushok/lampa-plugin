(function () {
    'use strict';

    // Основний об'єкт плагіна
    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '1.0.1',
        debug: true,
        settings: {
            enabled: true,
            show_ru: false,
            show_en: true,
            show_ua: true,
            sort_mode: 'popularity.desc'
        }
    };

    // Списки кінотеатрів
    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' }, { name: 'Premier', networkId: '2859' },
        { name: 'KION', networkId: '4085' }, { name: 'Okko', networkId: '3871' },
        { name: 'КиноПоиск', networkId: '3827' }, { name: 'Wink', networkId: '5806' },
        { name: 'ИВИ', networkId: '3923' }, { name: 'Смотрим', networkId: '5000' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' }, { name: 'Apple TV+', networkId: '2552' },
        { name: 'Disney+', networkId: '2739' }, { name: 'HBO Max', networkId: '3186' },
        { name: 'Amazon Prime', networkId: '1024' }, { name: 'Paramount+', networkId: '4330' },
        { name: 'Hulu', networkId: '453' }, { name: 'Sky Sci-Fi', networkId: '5647' }
    ];

    var UA_CINEMAS = [
        { name: 'Megogo', networkId: '4454' }, { name: 'Sweet.tv', networkId: '5444' },
        { name: 'Kyivstar TV', networkId: '5625' }, { name: 'Takflix', networkId: '5413' },
        { name: '1+1', networkId: '1254' }, { name: 'ICTV', networkId: '1166' },
        { name: 'СТБ', networkId: '1206' }, { name: 'Новий канал', networkId: '1211' }
    ];

    // Локалізація
    function addLocalization() {
        if (window.Lampa && Lampa.Lang) {
            Lampa.Lang.add({
                cinemabywolf_title: { ua: 'Cinema By Wolf', en: 'Cinema By Wolf' },
                cinemabywolf_show_ua: { ua: 'Показувати UA кінотеатри', en: 'Show UA Cinemas' },
                cinemabywolf_show_en: { ua: 'Показувати EN кінотеатри', en: 'Show EN Cinemas' },
                cinemabywolf_show_ru: { ua: 'Показувати RU кінотеатри', en: 'Show RU Cinemas' },
                cinemabywolf_sort: { ua: 'Режим сортування', en: 'Sort Mode' }
            });
        }
    }

    // Збереження та завантаження налаштувань
    function saveSettings() {
        localStorage.setItem('cinemabywolf_settings', JSON.stringify(CinemaByWolf.settings));
    }

    function loadSettings() {
        var saved = localStorage.getItem('cinemabywolf_settings');
        if (saved) {
            try {
                var obj = JSON.parse(saved);
                CinemaByWolf.settings = Object.assign(CinemaByWolf.settings, obj);
            } catch (e) {}
        }
    }

    // Створення меню налаштувань у Lampa
    function addSettingsMenu() {
        Lampa.Settings.add({
            title: 'Cinema By Wolf',
            type: 'book',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><polygon points="10,9 16,12 10,15" fill="currentColor"/></svg>`,
            name: 'cinemabywolf_section'
        });

        Lampa.Settings.bind('cinemabywolf_section', function (item) {
            item.add({
                name: 'show_ua',
                type: 'trigger',
                default: CinemaByWolf.settings.show_ua,
                title: 'Українські кінотеатри',
                description: 'Відображати кнопку UA у головному меню'
            });
            item.add({
                name: 'show_en',
                type: 'trigger',
                default: CinemaByWolf.settings.show_en,
                title: 'Іноземні кінотеатри',
                description: 'Відображати кнопку EN у головному меню'
            });
            item.add({
                name: 'show_ru',
                type: 'trigger',
                default: CinemaByWolf.settings.show_ru,
                title: 'Російські кінотеатри',
                description: 'Відображати кнопку RU у головному меню'
            });
            item.add({
                name: 'sort_mode',
                type: 'select',
                default: CinemaByWolf.settings.sort_mode,
                title: 'Сортування',
                values: {
                    'popularity.desc': 'За популярністю',
                    'first_air_date.desc': 'Спочатку нові',
                    'vote_average.desc': 'За рейтингом'
                }
            });
            
            // Кнопка "Про плагін"
            item.add({
                name: 'about_plugin',
                type: 'button',
                title: 'Про плагін',
                description: 'Інформація про розробника та версію'
            });
        });

        // Слухаємо зміни налаштувань
        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name === 'show_ua' || e.name === 'show_en' || e.name === 'show_ru' || e.name === 'sort_mode') {
                CinemaByWolf.settings[e.name] = e.value;
                saveSettings();
                addMenuButtons(); // Оновлюємо меню без перезавантаження
            }
            if (e.name === 'about_plugin') showAbout();
        });
    }

    // Керування кнопками меню
    function addMenuButtons() {
        $('.cinemabywolf-btn-ua, .cinemabywolf-btn-en, .cinemabywolf-btn-ru').remove();
        var $menu = $('.menu .menu__list').eq(0);
        if (!$menu.length) return;

        var items = [
            { id: 'ua', show: CinemaByWolf.settings.show_ua, label: 'UA Кінотеатри' },
            { id: 'en', show: CinemaByWolf.settings.show_en, label: 'EN Кінотеатри' },
            { id: 'ru', show: CinemaByWolf.settings.show_ru, label: 'RU Кінотеатри' }
        ];

        items.forEach(function (item) {
            if (item.show) {
                var $btn = $(`
                    <li class="menu__item selector cinemabywolf-btn-${item.id}">
                        <div class="menu__ico">
                            <svg viewBox="0 0 48 48" width="1.2em" height="1.2em"><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="currentColor" dominant-baseline="middle">${item.id.toUpperCase()}</text></svg>
                        </div>
                        <div class="menu__text">${item.label}</div>
                    </li>
                `);
                $btn.on('hover:enter', function () { openCinemasModal(item.id); });
                $menu.append($btn);
            }
        });
    }

    // Модальне вікно (список карток)
    function openCinemasModal(type) {
        var cinemas = type === 'ru' ? RU_CINEMAS : type === 'en' ? EN_CINEMAS : UA_CINEMAS;
        var titles = { ua: 'Українські', en: 'Іноземні', ru: 'Російські' };
        
        var $container = $('<div class="cinemabywolf-cards"></div>');

        cinemas.forEach(function (c) {
            var $card = $('<div class="cinemabywolf-card selector"><div class="cinemabywolf-card__logo"></div><div class="cinemabywolf-card__name">'+c.name+'</div></div>');
            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                Lampa.Activity.push({
                    url: 'discover/tv',
                    title: c.name,
                    networks: c.networkId,
                    sort_by: CinemaByWolf.settings.sort_mode,
                    component: 'category_full',
                    source: 'tmdb',
                    card_type: true,
                    page: 1
                });
            });
            $container.append($card);
        });

        Lampa.Modal.open({
            title: titles[type] + ' онлайн кінотеатри',
            html: $container,
            size: 'full',
            onBack: function() { Lampa.Modal.close(); Lampa.Controller.toggle('menu'); }
        });

        Lampa.Controller.add('cinemabywolf_cards', {
            toggle: function() { Lampa.Controller.collectionSet($container); $container.find('.selector').first().focus(); },
            back: function() { Lampa.Modal.close(); Lampa.Controller.toggle('menu'); }
        });
        Lampa.Controller.toggle('cinemabywolf_cards');
    }

    function showAbout() {
        Lampa.Modal.open({
            title: 'Про плагін',
            html: `<div style="padding: 20px; text-align: center;">
                <h2 style="color: #00dbde;">Cinema By Wolf</h2>
                <p>Версія: ${CinemaByWolf.version}</p>
                <p>Швидкий доступ до медіа-мереж через TMDB.</p>
                <p style="color: #fc00ff;">Дякуємо за використання!</p>
            </div>`,
            size: 'medium'
        });
    }

    function addStyles() {
        var style = `
            <style id="cinemabywolf-styles">
                .cinemabywolf-cards { display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }
                .cinemabywolf-card { width: 140px; height: 120px; background: rgba(255,255,255,0.05); margin: 10px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .cinemabywolf-card.focus { background: #fff; color: #000; transform: scale(1.1); }
                .cinemabywolf-card__name { margin-top: 10px; font-size: 14px; font-weight: bold; }
            </style>`;
        if (!$('#cinemabywolf-styles').length) $('head').append(style);
    }

    // Ініціалізація
    function init() {
        loadSettings();
        addLocalization();
        addStyles();
        addSettingsMenu();
        
        var checkMenu = setInterval(function () {
            if ($('.menu').length) {
                clearInterval(checkMenu);
                addMenuButtons();
            }
        }, 500);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') init(); });

})();
