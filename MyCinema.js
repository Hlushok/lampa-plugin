(function () {
    'use strict';

    var CinemaByWolf = {
        name: 'my_cinema_plugin',
        version: '2.4.0',
        settings: {
            enabled: true,
            show_ru: false,
            show_en: true,
            show_ua: true
        }
    };

    var UA_CINEMAS = [
        { name: 'Megogo', networkId: '4454' },
        { name: 'Sweet.tv', networkId: '5444' },
        { name: 'Kyivstar TV', networkId: '5625' },
        { name: 'Takflix', networkId: '5413' },
        { name: '1+1', networkId: '1254' },
        { name: 'ICTV', networkId: '1166' },
        { name: 'СТБ', networkId: '1206' },
        { name: 'Новий канал', networkId: '1211' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' },
        { name: 'Apple TV+', networkId: '2552' },
        { name: 'Disney+', networkId: '2739' },
        { name: 'HBO Max', networkId: '3186' },
        { name: 'Amazon Prime', networkId: '1024' },
        { name: 'SYFY', networkId: '77' },        
        { name: 'AMC', networkId: '174' },       
        { name: 'BBC One', networkId: '4' }
    ];

    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' },
        { name: 'Premier', networkId: '2859' }
    ];

    // Іконки для головного меню
    var ICONS = {
        ua: '<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="12" fill="#0057B7"/><rect width="24" height="12" y="12" fill="#FFD700"/></svg>',
        en: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00dbde" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        ru: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4b4b" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M17 2l-5 5-5-5"/></svg>'
    };

    function getCinemaLogo(networkId, name, callback) {
        // Використовуємо прямий шлях до логотипів TMDB, якщо знаємо ID
        // Це швидше, ніж робити AJAX запит щоразу
        var logoMap = {
            '213': 'wwemzKWzjKYJFfCeiB57q3r4Bcm.png', // Netflix
            '2552': '4U0p5S7vREORvvi99pU9v63zQYp.png', // Apple TV+
            '2739': '97vYm2qq0Yv6f7vXm9N1P9Qp3fN.png', // Disney+
            '4454': '9fH5W7N9p7X6v7vXm9N1P9Qp3fN.png'  // Megogo (приклад)
        };

        if (logoMap[networkId]) {
            callback('<img src="https://image.tmdb.org/t/p/w200/' + logoMap[networkId] + '" style="max-width:80px; max-height:40px;">');
        } else {
            // Якщо лого не в списку, тягнемо через API
            $.ajax({
                url: 'https://api.themoviedb.org/3/network/' + networkId + '?api_key=4ef0d38d4030e4ef5657065350e0f314',
                type: 'GET',
                timeout: 3000,
                success: function (data) {
                    if (data && data.logo_path) {
                        callback('<img src="https://image.tmdb.org/t/p/w200' + data.logo_path + '" style="max-width:80px; max-height:40px;">');
                    } else {
                        callback('<div class="no-logo">' + name.substring(0, 2).toUpperCase() + '</div>');
                    }
                },
                error: function () {
                    callback('<div class="no-logo">' + name.substring(0, 2).toUpperCase() + '</div>');
                }
            });
        }
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
        var title = type === 'ua' ? 'Українські сервіси' : type === 'en' ? 'Світові сервіси' : 'RU сервіси';
        
        var $container = $('<div class="my-cinema-grid"></div>');

        list.forEach(function (c) {
            var $card = $(`<div class="my-cinema-card selector">
                <div class="my-cinema-logo" id="logo-${c.networkId}">...</div>
                <div class="my-cinema-name">${c.name}</div>
            </div>`);

            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(c.networkId, c.name);
            });

            $container.append($card);

            // Завантажуємо лого після додавання в DOM
            getCinemaLogo(c.networkId, c.name, function(html) {
                $container.find('#logo-' + c.networkId).html(html);
            });
        });

        Lampa.Modal.open({
            title: title,
            html: $container,
            size: 'full',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('menu');
            }
        });
    }

    function addMenuButtons() {
        $('.menu__item.my-cinema-btn').remove();
        var $menu = $('.menu .menu__list').eq(0);
        
        ['ua', 'en', 'ru'].forEach(function(id) {
            if (CinemaByWolf.settings['show_' + id]) {
                var title = id === 'ua' ? 'UA Кіно' : id === 'en' ? 'World Cinema' : 'RU Кіно';
                var $btn = $(`<li class="menu__item selector my-cinema-btn">
                    <div class="menu__ico">${ICONS[id]}</div>
                    <div class="menu__text">${title}</div>
                </li>`);
                $btn.on('hover:enter', function () { openCinemasModal(id); });
                $menu.append($btn);
            }
        });
    }

    function start() {
        var style = $('<style>' +
            '.my-cinema-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; padding: 20px; }' +
            '.my-cinema-card { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.05); }' +
            '.my-cinema-card.focus { background: #fff !important; }' +
            '.my-cinema-card.focus .my-cinema-name { color: #000 !important; }' +
            '.my-cinema-logo { height: 45px; display: flex; align-items: center; justify-content: center; }' +
            '.my-cinema-logo img { filter: brightness(1); }' +
            '.my-cinema-card.focus .my-cinema-logo img { filter: brightness(0); }' + // Чорне лого на білому фоні при фокусі
            '.no-logo { font-size: 20px; font-weight: 800; color: rgba(255,255,255,0.5); }' +
            '.my-cinema-name { font-size: 13px; color: #fff; text-align: center; margin-top: 8px; }' +
            '</style>');
        $('head').append(style);

        if (window.appready) addMenuButtons();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuButtons(); });
    }

    start();
})();
