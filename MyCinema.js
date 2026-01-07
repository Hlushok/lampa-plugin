(function () {
    'use strict';

    var CinemaByWolf = {
        name: 'my_cinema_plugin',
        version: '2.3.0',
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
        { name: 'Новий канал', networkId: '1211' },
        { name: '2+2', networkId: '1259' },
        { name: 'ТЕТ', networkId: '1215' }
    ];

    var EN_CINEMAS = [
        { name: 'Netflix', networkId: '213' },
        { name: 'Apple TV+', networkId: '2552' },
        { name: 'Disney+', networkId: '2739' },
        { name: 'HBO Max', networkId: '3186' },
        { name: 'Amazon Prime', networkId: '1024' },
        { name: 'SYFY', networkId: '77' },        
        { name: 'AMC', networkId: '174' },       
        { name: 'BBC One', networkId: '4' },      
        { name: 'Sky Sci-Fi', networkId: '5647' }
    ];

    var RU_CINEMAS = [
        { name: 'Start', networkId: '2493' },
        { name: 'Premier', networkId: '2859' },
        { name: 'КиноПоиск', networkId: '3827' }
    ];

    // SVG Іконки для меню
    var ICONS = {
        ua: '<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="12" fill="#0057B7"/><rect width="24" height="12" y="12" fill="#FFD700"/></svg>',
        en: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00dbde" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        ru: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4b4b" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>'
    };

    function getCinemaLogo(networkId, name, callback) {
        var apiUrl = 'https://api.themoviedb.org/3/network/' + networkId + '?api_key=4ef0d38d4030e4ef5657065350e0f314';
        $.ajax({
            url: apiUrl,
            type: 'GET',
            success: function (data) {
                if (data && data.logo_path) {
                    callback('<img src="https://image.tmdb.org/t/p/w300' + data.logo_path + '" style="max-width:80px; max-height:40px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));">');
                } else {
                    callback('<div style="font-size:16px; font-weight:bold; color:#fff;">' + name + '</div>');
                }
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
        var title = type === 'ua' ? 'Українські сервіси' : type === 'en' ? 'Світові сервіси' : 'RU сервіси';
        
        var $container = $('<div class="my-cinema-grid"></div>');

        list.forEach(function (c) {
            var $card = $(`<div class="my-cinema-card selector">
                <div class="my-cinema-logo">...</div>
                <div class="my-cinema-name">${c.name}</div>
            </div>`);

            getCinemaLogo(c.networkId, c.name, function(html) {
                $card.find('.my-cinema-logo').html(html);
            });

            $card.on('hover:enter', function () {
                Lampa.Modal.close();
                openCinemaCatalog(c.networkId, c.name);
            });
            $container.append($card);
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
            '.my-cinema-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; padding: 20px; }' +
            '.my-cinema-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.2s; border: 1px solid rgba(255,255,255,0.1); }' +
            '.my-cinema-card.focus { background: #fff !important; transform: scale(1.05); border-color: #fff; }' +
            '.my-cinema-card.focus .my-cinema-name { color: #000 !important; }' +
            '.my-cinema-logo { height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }' +
            '.my-cinema-name { font-size: 14px; color: #fff; text-align: center; font-weight: 500; }' +
            '</style>');
        $('head').append(style);

        if (window.appready) addMenuButtons();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenuButtons(); });
    }

    start();
})();
