(function () {
    'use strict';

    var PLUGIN_NAME = 'movieTV_ua';
    var PLUGIN_TITLE = 'UA Новинки';
    // Посилання на ваш JSON
    var JSON_URL = 'https://raw.githubusercontent.com/Hlushok/lampa-plugin/main/base.json';

    var Api = {
        load: function (oncomplete, onerror) {
            Lampa.Network.silent(JSON_URL + '?v=' + Math.random(), function (json) {
                if (json && json.categories) {
                    var lines = json.categories.map(function (cat) {
                        return {
                            title: cat.title,
                            results: cat.items.map(function (item) {
                                return {
                                    title: item.n,
                                    original_title: item.ti || item.n,
                                    // Визначаємо тип для Lampa
                                    type: (cat.id.includes('series') || item.series) ? 'tv' : 'movie',
                                    img: item.img || '',
                                    vote_average: parseFloat(item.k || 0),
                                    release_quality: item.release_quality,
                                    category_id: cat.id,
                                    // Дані для відображення в картці
                                    salo_description: item.studio || (item.series ? 'Серіал' : 'Фільм'),
                                    salo_release_date: item.country || 'UA'
                                };
                            }),
                            // Параметри для Maker
                            params: {
                                source: PLUGIN_NAME
                            }
                        };
                    });
                    oncomplete(lines);
                } else {
                    onerror();
                }
            }, onerror);
        }
    };

    // Створюємо компонент на основі Maker (як у SaloPower)
    function component(object) {
        var comp = Lampa.Maker.make('Main', object);
        comp.use({
            onCreate: function onCreate() {
                var _this = this;
                this.activity.loader(true);

                Api.load(function (lines) {
                    _this.build(lines);
                    _this.activity.loader(false);
                }, function () {
                    _this.empty();
                    _this.activity.loader(false);
                });
            },
            onInstance: function onInstance(line_item, line_data) {
                line_item.use({
                    onInstance: function onInstance(card_item, card_data) {
                        card_item.use({
                            onEnter: function onEnter() {
                                // При натисканні відкриваємо стандартну картку TMDB
                                Lampa.Activity.push({
                                    url: '',
                                    title: card_data.title,
                                    component: 'full',
                                    id: card_data.id, // Якщо в JSON буде tmdb_id
                                    method: card_data.type,
                                    card: card_data,
                                    source: 'tmdb'
                                });
                            }
                        });
                    }
                });
            }
        });
        return comp;
    }

    function startPlugin() {
        // Реєструємо компонент у системі Lampa
        Lampa.Component.add(PLUGIN_NAME, component);

        function addMenu() {
            var icon = '<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="19" r="17" stroke="currentColor" stroke-width="3"/><path d="M19 10V28M10 19H28" stroke="currentColor" stroke-width="3"/></svg>';
            var button = $(`
                <li class="menu__item selector">
                    <div class="menu__ico">${icon}</div>
                    <div class="menu__text">${PLUGIN_TITLE}</div>
                </li>
            `);

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: PLUGIN_TITLE,
                    component: PLUGIN_NAME,
                    page: 1
                });
            });

            $('.menu .menu__list').eq(0).append(button);
        }

        if (window.appready) addMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addMenu(); });
    }

    // Запуск
    startPlugin();
})();
