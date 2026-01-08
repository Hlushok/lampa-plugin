(function () {
    'use strict';

    // Основний об'єкт плагіна
    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '2.0.0',
        debug: true,
        settings: {
            enabled: true,
            show_ru: false,
            show_en: false,
            show_ua: false,
            sort_mode: 'popularity.desc'
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

    // Локалізація (додавання українських назв)
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

    // Завантаження налаштувань
    function loadSettings() {
        var saved = localStorage.getItem('cinemabywolf_settings');
        if (saved) {
            try {
                var obj = JSON.parse(saved);
                CinemaByWolf.settings = Object.assign(CinemaByWolf.settings, obj);
            } catch (e) {
                console.error('cinemabywolf: помилка завантаження налаштувань', e);
            }
        }
    }

    // Збереження налаштувань
    function saveSettings() {
        localStorage.setItem('cinemabywolf_settings', JSON.stringify(CinemaByWolf.settings));
    }

    // Створення кнопок у меню
    function addMenuButtons() {
        var $menu = $('.menu .menu__list').eq(0);
        if (!$menu.length) return;

        // UA
        if (String(CinemaByWolf.settings.show_ua) === 'true') {
            if (!$('.cinemabywolf-btn-ua').length) {
                var $ua_btn = $(`
                    <li class="menu__item selector cinemabywolf-btn-ua">
                        <div class="menu__ico"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; width: 1.2em; height: 1.2em;"><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" dominant-baseline="middle">UA</text></svg></div>
                        <div class="menu__text">UA Кінотеатри</div>
                    </li>
                `);
                $ua_btn.on('hover:enter', function () {
                    openCinemasModal('ua');
                });
                $menu.append($ua_btn);
            }
        }

        // EN
        if (String(CinemaByWolf.settings.show_en) === 'true') {
            if (!$('.cinemabywolf-btn-en').length) {
                var $en_btn = $(`
                    <li class="menu__item selector cinemabywolf-btn-en">
                        <div class="menu__ico"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; width: 1.2em; height: 1.2em;"><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" dominant-baseline="middle">EN</text></svg></div>
                        <div class="menu__text">EN Кінотеатри</div>
                    </li>
                `);
                $en_btn.on('hover:enter', function () {
                    openCinemasModal('en');
                });
                $menu.append($en_btn);
            }
        }

        // RU
        if (String(CinemaByWolf.settings.show_ru) === 'true') {
            if (!$('.cinemabywolf-btn-ru').length) {
                var $ru_btn = $(`
                    <li class="menu__item selector cinemabywolf-btn-ru">
                        <div class="menu__ico"><svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="fill: currentColor; width: 1.2em; height: 1.2em;"><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="34" font-weight="bold" dominant-baseline="middle">RU</text></svg></div>
                        <div class="menu__text">RU Кінотеатри</div>
                    </li>
                `);
                $ru_btn.on('hover:enter', function () {
                    openCinemasModal('ru');
                });
                $menu.append($ru_btn);
            }
        }
    }

    // Стилі
    function addStyles() {
        var style = `
            <style id="cinemabywolf-styles">
                .cinemabywolf-cards { display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }
                .cinemabywolf-card { width: 140px; height: 140px; background: rgba(255,255,255,0.05); margin: 10px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer; border: 2px solid transparent; }
                .cinemabywolf-card.focus { background: #fff; color: #000; transform: scale(1.1); box-shadow: 0 10px 20px rgba(0,0,0,0.5); border-color: #fc00ff; }
                .cinemabywolf-card__logo { height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
                .cinemabywolf-card__logo img { max-width: 80px; max-height: 60px; object-fit: contain; }
                .cinemabywolf-card__name { font-size: 14px; font-weight: bold; text-align: center; padding: 0 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
                .cinemabywolf-modal-header { width: 100%; padding: 10px 20px; text-align: center; }
                .cinemabywolf-modal-title { font-size: 24px; font-weight: bold; background: linear-gradient(90deg, #fc00ff, #00dbde); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .logo-placeholder { font-size: 40px; font-weight: bold; color: #888; }
            </style>`;
        if (!$('#cinemabywolf-styles').length) $('head').append(style);
    }

    // TMDB Логотипи
    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = 'https://api.themoviedb.org/3/network/' + networkId + '?api_key=' + Lampa.TMDB.key();
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    var imgUrl = 'https://image.tmdb.org/t/p/w300' + data.logo_path;
                    callback('<img src="' + imgUrl + '" alt="' + name + '">');
                } else {
                    callback('<div class="logo-placeholder">' + name.charAt(0) + '</div>');
                }
            },
            error: function () {
                callback('<div class="logo-placeholder">' + name.charAt(0) + '</div>');
            }
        });
    }

    // Каталог
    function openCinemaCatalog(networkId, name) {
        var sort = CinemaByWolf.settings.sort_mode || 'popularity.desc';
        if (sort.indexOf('release_date') !== -1) {
            sort = sort.replace('release_date', 'first_air_date');
        }
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

    // Модальне вікно
    function openCinemasModal(type) {
        var cinemas = type === 'ru' ? RU_CINEMAS : type === 'en' ? EN_CINEMAS : UA_CINEMAS;
        var titles = {
            ru: 'Російські',
            en: 'Іноземні',
            ua: 'Українські'
        };

        var $container = $('<div class="cinemabywolf-cards"></div>');
        var $modalHtml = $('<div></div>');
        var $header = $(`<div class="cinemabywolf-modal-header"><div class="cinemabywolf-modal-title">${titles[type]} онлайн кінотеатри</div></div>`);
        
        $modalHtml.append($header).append($container);

        cinemas.forEach(function (cinema) {
            var $card = $('<div class="cinemabywolf-card selector"><div class="cinemabywolf-card__logo"></div><div class="cinemabywolf-card__name">' + cinema.name + '</div></div>');
            
            getCinemaLogo(cinema.networkId, cinema.name, function (logoHtml) {
                $card.find('.cinemabywolf-card__logo').html(logoHtml);
            });

            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(cinema.networkId, cinema.name);
            });

            $container.append($card);
        });

        Lampa.Modal.open({
            title: '',
            html: $modalHtml,
            size: 'full',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });

        Lampa.Controller.add('cinemabywolf_modal', {
            toggle: function () {
                Lampa.Controller.collectionSet($container);
                $container.find('.selector.focus').focus() || $container.find('.selector').first().focus();
            },
            back: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });
        Lampa.Controller.toggle('cinemabywolf_modal');
    }

    // Налаштування в меню Lampa
    function addSettingsComponent() {
        Lampa.Settings.add({
            title: 'Cinema By Wolf',
            type: 'book',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
            name: 'cinemabywolf_settings_menu'
        });

        Lampa.Settings.bind('cinemabywolf_settings_menu', function (item) {
            item.add({
                name: 'show_ua',
                type: 'trigger',
                default: CinemaByWolf.settings.show_ua,
                title: 'Українські кінотеатри',
                description: 'Показувати кнопку UA у головному меню'
            });
            item.add({
                name: 'show_en',
                type: 'trigger',
                default: CinemaByWolf.settings.show_en,
                title: 'Іноземні кінотеатри',
                description: 'Показувати кнопку EN у головному меню'
            });
            item.add({
                name: 'show_ru',
                type: 'trigger',
                default: CinemaByWolf.settings.show_ru,
                title: 'Російські кінотеатри',
                description: 'Показувати кнопку RU у головному меню'
            });
            item.add({
                name: 'sort_mode',
                type: 'select',
                default: CinemaByWolf.settings.sort_mode,
                title: 'Сортування',
                description: 'Тип сортування контенту',
                values: {
                    'popularity.desc': 'За популярністю',
                    'first_air_date.desc': 'За датою виходу',
                    'vote_average.desc': 'За рейтингом'
                }
            });
            item.add({
                name: 'about',
                type: 'button',
                title: 'Про плагін',
                description: 'Інформація про розробника'
            });
        });

        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name === 'show_ua' || e.name === 'show_en' || e.name === 'show_ru' || e.name === 'sort_mode') {
                CinemaByWolf.settings[e.name] = e.value;
                saveSettings();
                refreshMenuButtons();
            }
            if (e.name === 'about') {
                Lampa.Modal.open({
                    title: 'Про плагін',
                    html: `<div style="padding: 20px; text-align: center;">
                        <h2 style="color: #00dbde">Cinema By Wolf</h2>
                        <p>Версія: ${CinemaByWolf.version}</p>
                        <hr style="margin: 15px 0; border: 0; border-top: 1px solid rgba(255,255,255,0.1)">
                        <p>Додає швидкий доступ до популярних стрімінгових мереж.</p>
                        <p style="color: #fc00ff">Дякуємо за використання!</p>
                    </div>`,
                    size: 'medium',
                    onBack: function() { Lampa.Modal.close(); }
                });
            }
        });
    }

    // Оновлення кнопок меню
    function refreshMenuButtons() {
        $('.cinemabywolf-btn-ru, .cinemabywolf-btn-en, .cinemabywolf-btn-ua').remove();
        addMenuButtons();
    }

    // Ініціалізація
    function startPlugin() {
        loadSettings();
        addLocalization();
        addStyles();
        addSettingsComponent();
        
        if (CinemaByWolf.debug) {
            console.log('cinemabywolf: налаштування завантажені', CinemaByWolf.settings);
        }

        // Чекаємо готовності меню
        var interval = setInterval(function () {
            if ($('.menu').length) {
                clearInterval(interval);
                addMenuButtons();
            }
        }, 500);

        // Слухаємо події для оновлення
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                setTimeout(refreshMenuButtons, 1000);
            }
        });

        Lampa.Listener.follow('menu', function(e) {
            if (e.type === 'open') {
                refreshMenuButtons();
            }
        });
    }

    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }
})();
