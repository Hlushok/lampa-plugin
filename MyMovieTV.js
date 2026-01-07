(function () {
    'use strict';

    var PLUGIN_NAME = 'MymovieTV';
    var JSON_URL = 'https://raw.githubusercontent.com/Hlushok/lampa-plugin/main/base.json';

    function CategorizedService() {
        var network = new Lampa.Reguest();

        this.category = function (params, onSuccess, onError) {
            // Додаємо випадкове число до URL, щоб обійти кеш самого файлу base.json
            var url = JSON_URL + '?v=' + Math.random();
            
            network.silent(url, function (json) {
                var results = [];
                if (json && json.categories) {
                    json.categories.forEach(function (cat) {
                        results.push({
                            title: cat.title,
                            items: cat.items.map(function (item) {
                                return {
                                    title: item.n || item.ti,
                                    original_title: item.ti || item.n,
                                    type: item.id && item.id.includes('series') ? 'tv' : (item.series ? 'tv' : 'movie'),
                                    img: item.img || '', // Якщо картинок немає, буде порожньо
                                    vote_average: parseFloat(item.k || item.i || 0),
                                    release_quality: item.release_quality,
                                    category_id: cat.id
                                };
                            })
                        });
                    });
                    onSuccess(results);
                } else {
                    onError();
                }
            }, onError);
        };

        this.full = function (params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };
    }

    function start() {
        Lampa.Api.sources[PLUGIN_NAME] = new CategorizedService();

        var menu_item = $(`
            <li class="menu__item selector" data-action="${PLUGIN_NAME}">
                <div class="menu__ico"><svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.85742" y="1.70898" width="35.501" height="35.501" rx="4.5" stroke="currentColor" stroke-width="3"/><path d="M25.5996 14.27C27.5326 14.27 29.0996 15.837 29.0996 17.77V22.0464C29.0996 23.9794 27.5326 25.5464 25.5996 25.5464H22.4365V14.27H25.5996Z" fill="currentColor"/></svg></div>
                <div class="menu__text">Новинки та UA</div>
            </li>
        `);

        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({
                title: 'Новинки та UA',
                component: 'category',
                source: PLUGIN_NAME,
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(menu_item);
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') start(); });

})();
