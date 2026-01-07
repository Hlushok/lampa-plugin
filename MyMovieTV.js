!function() { 
    "use strict"; 
    var PLUGIN_NAME = "movieTV"; 
    var JSON_URL = "https://raw.githubusercontent.com/Hlushok/lampa-plugin/main/base.json"; 
    var CACHE_TIME = 1000 * 60 * 60 * 22; 
    
    var CARD_RATING_DISPLAY_SETTING = PLUGIN_NAME + "_card_rating_display"; 
    var UK_CATEGORY_IDS = { ukrainian_content: true, ua_movies: true, ua_series: true };

    // --- СТИЛІ ---
    var style = document.createElement('style');
    style.innerHTML = `
        .card__series { position: absolute; top: 0.3em; right: 0.3em; font-size: 1em; font-weight: 700; color: #fff; background: rgba(0, 0, 0, 0.6); border-radius: 0.4em; padding: 0.2em 0.5em; z-index: 2; }
        .card__type { position: absolute; top: 0.3em; left: 0.3em; color: #fff; background: #ff4242; z-index: 2; border-radius: 0.3em; padding: 0.1em 0.4em; font-size: 0.9em; }
        .card__type--ua { background: #0057b7 !important; border-left: 3px solid #ffd700; }
        .card__quality { position: absolute; bottom: 0.3em; right: 0.3em; background: #4caf50; color: #fff; padding: 0.1em 0.4em; border-radius: 0.3em; z-index: 2; font-size: 0.8em; }
    `;
    document.head.appendChild(style);

    // --- ЛОКАЛІЗАЦІЯ ---
    Lampa.Lang.add({
        movie_title: { ru: "Новинки", uk: "Новинки та UA" },
        movie_cache: { ru: "Очистить кэш", uk: "Очистити кеш" },
        movie_cleared: { ru: "Кэш очищен", uk: "Кеш успішно очищено" }
    });

    var ICON_SVG = '<svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.85742" y="1.70898" width="35.501" height="35.501" rx="4.5" stroke="currentColor" stroke-width="3"/><rect x="9.11133" y="12.77" width="2.96094" height="14.2765" rx="1" fill="currentColor"/><rect x="15.7627" y="12.77" width="3.01162" height="14.2765" rx="1" fill="currentColor"/><rect x="10.6455" y="18.0308" width="6.98432" height="3.07105" fill="currentColor"/><path d="M25.5996 14.27C27.5326 14.27 29.0996 15.837 29.0996 17.77V22.0464C29.0996 23.9794 27.5326 25.5464 25.5996 25.5464H22.4365V14.27H25.5996Z" stroke="currentColor" stroke-width="3"/></svg>';

    // --- ОБРОБКА КАРТОК (ПЛАШКИ) ---
    function addSeriesIndicator(card) {
        if (card.getAttribute('data-series-added')) return;
        var data = card.card_data;
        if (!data) return;

        var viewContainer = card.querySelector('.card__view');
        if (!viewContainer) return;

        var isUA = UK_CATEGORY_IDS[data.category_id] || (data.country && data.country.toLowerCase() === 'ua');
        var typeText = data.type === 'tv' ? (isUA ? 'UA Серіал' : 'Серіал') : (isUA ? 'UA Фільм' : 'Фільм');

        var typeEl = $('<div class="card__type"></div>').text(typeText);
        if (isUA) typeEl.addClass('card__type--ua');
        $(viewContainer).append(typeEl);

        if (data.series || data.country) {
            $(viewContainer).append($('<div class="card__series"></div>').text(data.series || data.country));
        }
        if (data.release_quality) {
            $(viewContainer).append($('<div class="card__quality"></div>').text(data.release_quality));
        }
        card.setAttribute('data-series-added', 'true');
    }

    // --- СЕРВІС ДАНИХ (ТУТ БУЛА ПОМИЛКА) ---
    function CategorizedService() {
        var self = this;
        var network = new Lampa.Reguest();

        // Додаємо метод, який Lampa викликає при відкритті розділу
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

    // --- ІНІЦІАЛІЗАЦІЯ ---
    function startPlugin() {
        Lampa.Api.sources[PLUGIN_NAME] = new CategorizedService();

        var menuItem = $(`
            <li class="menu__item selector" data-action="${PLUGIN_NAME}">
                <div class="menu__ico">${ICON_SVG}</div>
                <div class="menu__text">${Lampa.Lang.translate('movie_title')}</div>
            </li>
        `);

        menuItem.on("hover:enter", function() {
            Lampa.Activity.push({
                title: Lampa.Lang.translate('movie_title'),
                component: "category",
                source: PLUGIN_NAME,
                page: 1
            });
        });

        $(".menu .menu__list").eq(0).append(menuItem);

        // Додаємо плашки на картки
        Lampa.Listener.follow('layout', function(e) {
            if (e.type === 'complete') {
                $('.card').each(function() { addSeriesIndicator(this); });
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') startPlugin(); });
}();
