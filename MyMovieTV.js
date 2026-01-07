!function() { 
    "use strict"; 
    var PLUGIN_NAME = "movieTV"; 
    // Пряме посилання на ваш JSON
    var JSON_URL = "https://raw.githubusercontent.com/Hlushok/lampa-plugin/main/base.json"; 
    
    var UK_CATEGORY_IDS = { ukrainian_content: true, ua_movies: true, ua_series: true };

    // Стилі для карток
    var style = document.createElement('style');
    style.innerHTML = `
        .card__type { position: absolute; top: 0.3em; left: 0.3em; color: #fff; background: #ff4242; z-index: 2; border-radius: 0.3em; padding: 0.1em 0.4em; font-size: 0.8em; }
        .card__type--ua { background: #0057b7 !important; border-left: 3px solid #ffd700; }
        .card__quality { position: absolute; bottom: 0.3em; right: 0.3em; background: #4caf50; color: #fff; padding: 0.1em 0.4em; border-radius: 0.3em; z-index: 2; font-size: 0.7em; }
    `;
    document.head.appendChild(style);

    function CategorizedService() {
        var self = this;
        var network = new Lampa.Reguest();

        // ГОЛОВНИЙ МЕТОД, ЯКОГО НЕ ВИСТАЧАЛО
        self.category = function(params, onSuccess, onError) {
            network.silent(JSON_URL + '?v=' + Math.random(), function(json) {
                var results = [];
                if (json && json.categories) {
                    json.categories.forEach(function(cat) {
                        results.push({
                            title: cat.title,
                            items: cat.items.map(function(item) {
                                item.category_id = cat.id;
                                item.type = item.ti ? 'movie' : 'tv';
                                item.title = item.ti || item.n;
                                return item;
                            })
                        });
                    });
                }
                onSuccess(results);
            }, onError);
        };

        self.full = function(params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };
    }

    function startPlugin() {
        Lampa.Api.sources[PLUGIN_NAME] = new CategorizedService();

        var ICON_SVG = '<svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.85742" y="1.70898" width="35.501" height="35.501" rx="4.5" stroke="currentColor" stroke-width="3"/><path d="M25.5996 14.27C27.5326 14.27 29.0996 15.837 29.0996 17.77V22.0464C29.0996 23.9794 27.5326 25.5464 25.5996 25.5464H22.4365V14.27H25.5996Z" stroke="currentColor" stroke-width="3"/></svg>';

        var menuItem = $(`
            <li class="menu__item selector" data-action="${PLUGIN_NAME}">
                <div class="menu__ico">${ICON_SVG}</div>
                <div class="menu__text">Новинки та UA</div>
            </li>
        `);

        menuItem.on("hover:enter", function() {
            Lampa.Activity.push({
                title: 'Новинки та UA',
                component: "category",
                source: PLUGIN_NAME,
                page: 1
            });
        });

        $(".menu .menu__list").eq(0).append(menuItem);

        // Обробка карток (плашки)
        Lampa.Listener.follow('layout', function(e) {
            if (e.type === 'complete') {
                $('.card').each(function() {
                    var card = this;
                    if (card.getAttribute('data-mtv-added')) return;
                    var data = card.card_data;
                    if (data && data.category_id) {
                        var isUA = UK_CATEGORY_IDS[data.category_id];
                        var typeEl = $('<div class="card__type"></div>').text(data.type === 'tv' ? 'Серіал' : 'Фільм');
                        if (isUA) typeEl.addClass('card__type--ua').text('UA ' + (data.type === 'tv' ? 'Серіал' : 'Фільм'));
                        $(card).find('.card__view').append(typeEl);
                        if (data.release_quality) $(card).find('.card__view').append($('<div class="card__quality"></div>').text(data.release_quality));
                        card.setAttribute('data-mtv-added', 'true');
                    }
                });
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') startPlugin(); });
}();
