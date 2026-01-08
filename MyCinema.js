(function () {
    'use strict';

    var CinemaByWolf = {
        name: 'cinemabywolf',
        version: '1.0.2',
        settings: {
            show_ua: true,
            show_en: true,
            show_ru: false,
            sort_mode: 'popularity.desc'
        }
    };

    var UA_CINEMAS = [
        { name: 'Megogo', id: '4454' }, { name: 'Sweet.tv', id: '5444' },
        { name: 'Kyivstar TV', id: '5625' }, { name: 'Takflix', id: '5413' },
        { name: '1+1', id: '1254' }, { name: 'ICTV', id: '1166' },
        { name: 'СТБ', id: '1206' }, { name: 'Новий канал', id: '1211' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', id: '213' }, { name: 'Apple TV+', id: '2552' },
        { name: 'Disney+', id: '2739' }, { name: 'HBO Max', id: '3186' },
        { name: 'Amazon Prime', id: '1024' }, { name: 'Hulu', id: '453' }
    ];

    var RU_CINEMAS = [
        { name: 'Start', id: '2493' }, { name: 'Premier', id: '2859' },
        { name: 'КиноПоиск', id: '3827' }, { name: 'ИВИ', id: '3923' }
    ];

    // Завантаження логотипів з TMDB
    function getLogo(id, callback) {
        var url = 'https://api.themoviedb.org/3/network/' + id + '?api_key=' + Lampa.TMDB.key();
        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                if (data.logo_path) callback('https://image.tmdb.org/t/p/w300' + data.logo_path);
                else callback(false);
            },
            error: function() { callback(false); }
        });
    }

    // Додавання кнопок у меню
    function addButtons() {
        $('.cinemabywolf-item').remove();
        var menu = $('.menu .menu__list').eq(0);
        if (!menu.length) return;

        var items = [
            { id: 'ua', show: CinemaByWolf.settings.show_ua, label: 'UA Кінотеатри' },
            { id: 'en', show: CinemaByWolf.settings.show_en, label: 'EN Кінотеатри' },
            { id: 'ru', show: CinemaByWolf.settings.show_ru, label: 'RU Кінотеатри' }
        ];

        items.forEach(function (item) {
            if (item.show) {
                var btn = $(`
                    <li class="menu__item selector cinemabywolf-item">
                        <div class="menu__ico">
                            <svg viewBox="0 0 48 48" width="1.2em" height="1.2em" style="fill: currentColor">
                                <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="30" font-weight="bold" dominant-baseline="middle">${item.id.toUpperCase()}</text>
                            </svg>
                        </div>
                        <div class="menu__text">${item.label}</div>
                    </li>
                `);
                btn.on('hover:enter', function () { openModal(item.id); });
                menu.append(btn);
            }
        });
    }

    // Модальне вікно з картками
    function openModal(type) {
        var list = type === 'ua' ? UA_CINEMAS : type === 'en' ? EN_CINEMAS : RU_CINEMAS;
        var titles = { ua: 'Українські', en: 'Іноземні', ru: 'Російські' };
        var body = $('<div class="cinemabywolf-list"></div>');

        list.forEach(function (c) {
            var card = $(`
                <div class="cinemabywolf-card selector">
                    <div class="cinemabywolf-card__img"></div>
                    <div class="cinemabywolf-card__title">${c.name}</div>
                </div>
            `);

            getLogo(c.id, function(url) {
                if (url) card.find('.cinemabywolf-card__img').html('<img src="'+url+'" style="max-width:100%; max-height:60px">');
                else card.find('.cinemabywolf-card__img').text(c.name[0]);
            });

            card.on('hover:enter', function () {
                Lampa.Modal.close();
                Lampa.Activity.push({
                    url: 'discover/tv',
                    title: c.name,
                    networks: c.id,
                    sort_by: CinemaByWolf.settings.sort_mode,
                    component: 'category_full',
                    source: 'tmdb',
                    card_type: true,
                    page: 1
                });
            });
            body.append(card);
        });

        Lampa.Modal.open({
            title: titles[type] + ' кінотеатри',
            html: body,
            size: 'full',
            onBack: function() {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });

        Lampa.Controller.add('cbw_modal', {
            toggle: function() { Lampa.Controller.collectionSet(body); body.find('.selector').first().focus(); },
            back: function() { Lampa.Modal.close(); Lampa.Controller.toggle('menu'); }
        });
        Lampa.Controller.toggle('cbw_modal');
    }

    // Налаштування Lampa
    function initSettings() {
        Lampa.Settings.add({
            title: 'Cinema By Wolf',
            type: 'book',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 9l5 3-5 3V9z"/></svg>',
            name: 'cbw_settings'
        });

        Lampa.Settings.bind('cbw_settings', function (item) {
            item.add({
                name: 'cbw_show_ua',
                type: 'trigger',
                default: true,
                title: 'Українські кінотеатри'
            });
            item.add({
                name: 'cbw_show_en',
                type: 'trigger',
                default: true,
                title: 'Іноземні кінотеатри'
            });
            item.add({
                name: 'cbw_show_ru',
                type: 'trigger',
                default: false,
                title: 'Російські кінотеатри'
            });
            item.add({
                name: 'cbw_sort',
                type: 'select',
                default: 'popularity.desc',
                title: 'Сортування',
                values: {
                    'popularity.desc': 'За популярністю',
                    'first_air_date.desc': 'Новинки',
                    'vote_average.desc': 'Рейтинг'
                }
            });
        });

        Lampa.Storage.listener.follow('change', function (e) {
            if (e.name.indexOf('cbw_') === 0) {
                CinemaByWolf.settings.show_ua = Lampa.Storage.get('cbw_show_ua', 'true');
                CinemaByWolf.settings.show_en = Lampa.Storage.get('cbw_show_en', 'true');
                CinemaByWolf.settings.show_ru = Lampa.Storage.get('cbw_show_ru', 'false');
                CinemaByWolf.settings.sort_mode = Lampa.Storage.get('cbw_sort', 'popularity.desc');
                addButtons();
            }
        });
        
        // Початкове завантаження значень
        CinemaByWolf.settings.show_ua = Lampa.Storage.get('cbw_show_ua', 'true');
        CinemaByWolf.settings.show_en = Lampa.Storage.get('cbw_show_en', 'true');
        CinemaByWolf.settings.show_ru = Lampa.Storage.get('cbw_show_ru', 'false');
        CinemaByWolf.settings.sort_mode = Lampa.Storage.get('cbw_sort', 'popularity.desc');
    }

    function addStyles() {
        var css = `
            <style id="cbw-style">
                .cinemabywolf-list { display: flex; flex-wrap: wrap; justify-content: center; padding: 20px; }
                .cinemabywolf-card { width: 150px; height: 130px; margin: 10px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
                .cinemabywolf-card.focus { background: #fff; color: #000; transform: scale(1.05); }
                .cinemabywolf-card__img { height: 60px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: bold; }
                .cinemabywolf-card__title { margin-top: 10px; font-size: 14px; padding: 0 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
            </style>`;
        if (!$('#cbw-style').length) $('head').append(css);
    }

    function start() {
        try {
            addStyles();
            initSettings();
            
            var waitMenu = setInterval(function () {
                if ($('.menu').length) {
                    clearInterval(waitMenu);
                    addButtons();
                }
            }, 500);
        } catch (e) {
            console.error('CinemaByWolf Error:', e);
        }
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });

})();
