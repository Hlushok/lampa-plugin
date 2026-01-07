(function () {
    'use strict';

    var PLUGIN_NAME = 'movieTV_ua';
    var PLUGIN_TITLE = 'UA Новинки';

    // ВСІ ВАШІ ДАНІ ТУТ
    var data_content = [
        {
            title: "Українські Новинки",
            items: [
                { n: "Конотопська відьма", ti: "Konotopska Vidma", k: "7.5", q: "4K", s: "FILM.UA" },
                { n: "Довбуш", ti: "Dovbush", k: "8.1", q: "FHD", s: "Pronto Film" },
                { n: "Я, «Побєда» і Берлін", ti: "Ya, Pobeda i Berlin", k: "7.8", q: "FHD", s: "" }
            ]
        },
        {
            title: "Українські Серіали",
            items: [
                { n: "Спіймати Кайдаша", k: "9.1", q: "HD", s: "12 серій" },
                { n: "Перші дні", k: "8.5", q: "FHD", s: "1 сезон" }
            ]
        }
    ];

    // Функція мапінгу даних у формат Lampa
    var Api = {
        getLines: function () {
            return data_content.map(function (cat) {
                return {
                    title: cat.title,
                    results: cat.items.map(function (item) {
                        var is_tv = cat.title.toLowerCase().includes('серіал') || !!item.s.includes('серій');
                        return {
                            title: item.n,
                            original_title: item.ti || item.n,
                            type: is_tv ? 'tv' : 'movie',
                            img: '', // Можна додати посилання на фото пізніше
                            vote_average: parseFloat(item.k || 0),
                            release_quality: item.q,
                            // Додаткові дані для картки
                            salo_description: item.s || (is_tv ? 'UA Серіал' : 'UA Фільм'),
                            salo_release_date: 'UA'
                        };
                    }),
                    params: { source: PLUGIN_NAME }
                };
            });
        }
    };

    // Компонент інтерфейсу (аналог SaloPower)
    function component(object) {
        var comp = Lampa.Maker.make('Main', object);
        comp.use({
            onCreate: function onCreate() {
                var _this = this;
                this.activity.loader(true);
                
                // Оскільки дані в коді, завантаження миттєве
                try {
                    var lines = Api.getLines();
                    _this.build(lines);
                } catch (e) {
                    _this.empty();
                }
                
                this.activity.loader(false);
            },
            onInstance: function onInstance(line_item, line_data) {
                line_item.use({
                    onInstance: function onInstance(card_item, card_data) {
                        card_item.use({
                            onEnter: function onEnter() {
                                // Пошук контенту в Lampa через стандартну картку
                                Lampa.Activity.push({
                                    url: '',
                                    title: card_data.title,
                                    component: 'full',
                                    id: 0,
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
        // Реєстрація компонента
        Lampa.Component.add(PLUGIN_NAME, component);

        function addMenu() {
            var icon = '<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="19" r="17" stroke="currentColor" stroke-width="3"/><path d="M15 12L25 19L15 26V12Z" fill="currentColor"/></svg>';
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

    startPlugin();
})();
