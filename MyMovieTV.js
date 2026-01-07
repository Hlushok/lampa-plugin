(function () {
    'use strict';

    var PLUGIN_NAME = 'lampac_ua';
    var PLUGIN_TITLE = 'Lampac Ukraine';
    
    // Емуляція бази даних Lampac (можна замінити на Fetch запит до API)
    var UA_SOURCE = {
        categories: [
            { id: 'new', title: '🔥 Новинки в UA озвучці', type: 'movie' },
            { id: 'series', title: '📺 Українські серіали', type: 'tv' },
            { id: 'cartoons', title: '🧸 Мультфільми (UA)', type: 'movie' },
            { id: 'classic', title: '🎬 Золотий фонд кіно', type: 'movie' }
        ],
        // Дані, які зазвичай приходять з сервера Lampac-Ukraine
        items: {
            'new': [
                { title: 'Конотопська відьма', year: 2024, quality: '4K', tmdb: 1300609 },
                { title: 'Довбуш', year: 2023, quality: 'FHD', tmdb: 554313 },
                { title: 'Я, «Побєда» і Берлін', year: 2024, quality: 'FHD', tmdb: 745362 }
            ],
            'series': [
                { title: 'Спіймати Кайдаша', year: 2020, quality: 'HD', episodes: '12 серій' },
                { title: 'Перші дні', year: 2023, quality: 'FHD', episodes: '1 сезон' }
            ]
        }
    };

    function Component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var info;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            // Будуємо лінії контенту як у Lampac
            UA_SOURCE.categories.forEach(function (cat) {
                var line_data = {
                    title: cat.title,
                    results: (UA_SOURCE.items[cat.id] || []).map(function (item) {
                        return {
                            title: item.title,
                            original_title: item.title,
                            type: cat.type,
                            year: item.year,
                            release_quality: item.quality,
                            salo_description: item.episodes || 'Українська озвучка',
                            img: '', // Lampa сама підтягне постер за назвою
                            vote_average: 0
                        };
                    })
                };

                if (line_data.results.length > 0) {
                    var line = new Lampa.List(line_data, {
                        type: 'category',
                        scroll: scroll
                    });

                    line.onEnter = function (card) {
                        Lampa.Activity.push({
                            url: '',
                            title: card.title,
                            component: 'full',
                            id: card.tmdb || 0,
                            method: card.type,
                            card: card,
                            source: 'tmdb'
                        });
                    };

                    _this.build(line.render());
                }
            });

            this.activity.loader(false);
            return scroll.render();
        };

        this.build = function (line_html) {
            body.append(line_html);
        };

        this.render = function () {
            html.append(scroll.render());
            scroll.append(body);
            return html;
        };
    }

    function start() {
        // Додаємо компонент у Lampa
        Lampa.Component.add(PLUGIN_NAME, Component);

        // Додаємо власні стилі (як у Lampac-Ukraine)
        var style = document.createElement('style');
        style.textContent = `
            .menu__item[data-action="${PLUGIN_NAME}"] .menu__ico {
                color: #ffd700;
                background: linear-gradient(180deg, #0057b7 50%, #ffd700 50%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        `;
        document.head.appendChild(style);

        var addMenu = function () {
            var menu = $(`
                <li class="menu__item selector" data-action="${PLUGIN_NAME}">
                    <div class="menu__ico">
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 10C4 6.68629 6.68629 4 10 4H28C31.3137 4 34 6.68629 34 10V28C34 31.3137 31.3137 34 28 34H10C6.68629 34 4 31.3137 4 28V10Z" stroke="currentColor" stroke-width="3"/>
                            <path d="M10 19H28M19 10V28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="menu__text">${PLUGIN_TITLE}</div>
                </li>
            `);

            menu.on('hover:enter', function () {
                Lampa.Activity.push({
                    title: PLUGIN_TITLE,
                    component: PLUGIN_NAME,
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(menu);
        };

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenu(); });
    }

    start();
})();
