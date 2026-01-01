!function() { 
    "use strict"; 
    var PLUGIN_NAME = "movieTV"; 
    var START_PAGE_VALUE = "movieTV"; 
    var JSON_URL = "https://Rugaroo888.github.io/movietv-plugin/base.json"; 
    var CACHE_SIZE = 100; 
    var CACHE_TIME = 1000 * 60 * 60 * 22; 
    
    var SETTINGS_CATEGORIES_COMPONENT = PLUGIN_NAME + "_categories"; 
    var CATEGORY_SETTING_PREFIX = PLUGIN_NAME + "_cat_"; 
    var NAV_SETTING_MAIN_FAVORITE = PLUGIN_NAME + "_nav_main_favorite"; 
    var NAV_SETTING_SETTINGS_RANDOM = PLUGIN_NAME + "_nav_settings_random"; 
    var NAV_SETTING_ADD_NOVINKI = PLUGIN_NAME + "_nav_add_novinki"; 
    var CARD_RATING_DISPLAY_SETTING = PLUGIN_NAME + "_card_rating_display"; 

    // Налаштування фільтрації
    var FILTER_SETTING_MIN_RATING_MOVIE = PLUGIN_NAME + "_filter_min_rating_movie";
    var FILTER_SETTING_MIN_VOTES_MOVIE = PLUGIN_NAME + "_filter_min_votes_movie";
    var FILTER_SETTING_MIN_RATING_TV = PLUGIN_NAME + "_filter_min_rating_tv";
    var FILTER_SETTING_MIN_VOTES_TV = PLUGIN_NAME + "_filter_min_votes_tv";

    // Ідентифікатори для UA контенту
    var UK_CATEGORY_IDS = { ukrainian_content: true, ua_movies: true, ua_series: true };

    // --- СТИЛІ ---
    var style = document.createElement('style');
    style.innerHTML = `
        .card__series { position: absolute; top: 0.3em; right: 0.3em; font-size: 1em; font-weight: 700; color: #fff; background: rgba(0, 0, 0, 0.6); border-radius: 0.4em; padding: 0.2em 0.5em; z-index: 2; }
        .card__type { color: #fff; background: #ff4242; z-index: 2; border-radius: 0.3em; padding: 0.1em 0.4em; margin-bottom: 0.2em; }
        .card__type--ua { background: #0057b7 !important; border-left: 4px solid #ffd700; }
        .card__quality { background: #4caf50; color: #fff; padding: 0.1em 0.4em; border-radius: 0.3em; }
        .mtv-random-icon { width:100%; height:100%; display:block; transform:scale(1.1); }
    `;
    document.head.appendChild(style);

    // --- ЛОКАЛІЗАЦІЯ ---
    Lampa.Lang.add({
        movie_title: { ru: "Новинки", uk: "Новинки та UA" },
        movie_cache: { ru: "Очистить кэш", uk: "Очистити кеш" },
        movie_cleared: { ru: "Кэш очищен", uk: "Кеш успішно очищено" },
        random_card_title: { ru: "Случайное", uk: "Випадковий вибір" },
        random_card_no_data: { ru: "Нет данных для подбора", uk: "Немає підходящих фільмів" },
        mtv_cat_popular: { ru: "Популярное", uk: "Популярне" },
        mtv_cat_filter: { ru: "Фильтрация", uk: "Фільтрація" },
        mtv_rating_conf: { ru: "Рейтинг на карточках", uk: "Рейтинг на картках" },
        mtv_ui_buttons: { ru: "Кнопки интерфейса", uk: "Кнопки інтерфейсу" },
        mtv_replace_main: { ru: "Заменить Главную на Избранное", uk: "Замінити Головну на Обране" },
        mtv_replace_sett: { ru: "Заменить Настройки на Случайное", uk: "Замінити Налаштування на Випадкове" }
    });

    var ICON_SVG = '<svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.85742" y="1.70898" width="35.501" height="35.501" rx="4.5" stroke="currentColor" stroke-width="3"/><rect x="9.11133" y="12.77" width="2.96094" height="14.2765" rx="1" fill="currentColor"/><rect x="15.7627" y="12.77" width="3.01162" height="14.2765" rx="1" fill="currentColor"/><rect x="10.6455" y="18.0308" width="6.98432" height="3.07105" fill="currentColor"/><path d="M25.5996 14.27C27.5326 14.27 29.0996 15.837 29.0996 17.77V22.0464C29.0996 23.9794 27.5326 25.5464 25.5996 25.5464H22.4365V14.27H25.5996Z" stroke="currentColor" stroke-width="3"/></svg>';
    var RANDOM_ICON_SVG = '<svg class="mtv-random-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="7" cy="7" r="1.4" fill="currentColor"/><circle cx="17" cy="7" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="7" cy="17" r="1.4" fill="currentColor"/><circle cx="17" cy="17" r="1.4" fill="currentColor"/></svg>';

    // --- КЕШУВАННЯ ТА ДОПОМІЖНІ ФУНКЦІЇ ---
    var cache = {};
    function setCache(key, value) { cache[key] = { timestamp: Date.now(), value: value }; }
    function getCache(key) {
        var res = cache[key];
        if (res && (Date.now() - res.timestamp < CACHE_TIME)) return res.value;
        return null;
    }

    // --- ОБРОБКА КАРТОК ---
    function addSeriesIndicator(card) {
        if (card.getAttribute('data-series-added')) return;
        var data = card.card_data;
        if (!data) return;

        var viewContainer = card.querySelector('.card__view');
        if (!viewContainer) return;

        // Очищення старих елементів
        $(viewContainer).find('.card__series, .card__quality, .card__type').remove();

        var isUA = UK_CATEGORY_IDS[data.category_id] || (data.country && data.country.toLowerCase() === 'ua');
        var typeText = data.type === 'tv' ? (isUA ? 'UA Серіал' : 'Серіал') : (isUA ? 'UA Фільм' : 'Фільм');

        // Плашка типу
        var typeEl = $('<div class="card__type"></div>').text(typeText);
        if (isUA) typeEl.addClass('card__type--ua');
        $(viewContainer).append(typeEl);

        // Країна/Студія або серія
        var topText = data.series || data.country || data.studio || "";
        if (topText) {
            var seriesEl = $('<div class="card__series"></div>').text(topText);
            $(viewContainer).append(seriesEl);
        }

        // Якість
        if (data.release_quality) {
            var qualityEl = $('<div class="card__quality"></div>').text(data.release_quality);
            $(viewContainer).append(qualityEl);
        }

        applyCardRating(card, data);
        card.setAttribute('data-series-added', 'true');
    }

    function applyCardRating(card, data) {
        var view = card.querySelector('.card__view');
        var pref = Lampa.Storage.get(CARD_RATING_DISPLAY_SETTING, 'votes');
        var val = 0, label = '';

        if (pref === 'kp' && data.kp_rating) { val = data.kp_rating; label = 'КП'; }
        else if (pref === 'imdb' && data.imdb_rating) { val = data.imdb_rating; label = 'IMDB'; }
        else { val = data.card_rating || data.tmdb_rating; label = data.card_rating_source || 'TMDB'; }

        if (val > 0) {
            var voteEl = $(view).find('.card__vote');
            if (!voteEl.length) {
                voteEl = $('<div class="card__vote"></div>');
                $(view).append(voteEl);
            }
            voteEl.text(label + ' ' + parseFloat(val).toFixed(1));
        }
    }

    // --- СЕРВІС ДАНИХ ---
    function CategorizedService() {
        var self = this;
        var network = new Lampa.Reguest();
        self.categoriesData = {};

        self.loadData = function(onComplete, onError) {
            var cached = getCache(JSON_URL);
            if (cached) { self.categoriesData = cached; onComplete(); return; }

            network.silent(JSON_URL, function(json) {
                var normalized = {};
                json.categories.forEach(function(cat) {
                    normalized[cat.id] = {
                        title: cat.title,
                        items: cat.items.map(function(item) {
                            // Проста нормалізація
                            item.category_id = cat.id;
                            item.type = item.ti ? 'movie' : 'tv';
                            item.title = item.ti || item.n;
                            item.kp_rating = parseFloat(item.k) || 0;
                            item.imdb_rating = parseFloat(item.i) || 0;
                            return item;
                        })
                    };
                });
                self.categoriesData = normalized;
                setCache(JSON_URL, normalized);
                ensureCategorySettings(normalized);
                onComplete();
            }, onError);
        };

        self.full = function(params, onSuccess, onError) {
            var method = params.card.type === "tv" ? "tv" : "movie";
            Lampa.Api.sources.tmdb.full(params, function(data) {
                onSuccess(data);
                // Тут можна додати логіку відображення розширеного рейтингу
            }, onError);
        };
    }

    // --- НАЛАШТУВАННЯ ---
    function ensureCategorySettings(data) {
        if (window.Lampa && Lampa.SettingsApi) {
            Lampa.SettingsApi.addComponent({ component: SETTINGS_CATEGORIES_COMPONENT, name: "MovieTV UA", icon: ICON_SVG });
            
            Lampa.SettingsApi.addParam({
                component: SETTINGS_CATEGORIES_COMPONENT,
                param: { type: 'title' },
                field: { name: Lampa.Lang.translate('mtv_cat_filter') }
            });

            Lampa.SettingsApi.addParam({
                component: SETTINGS_CATEGORIES_COMPONENT,
                param: { 
                    name: CARD_RATING_DISPLAY_SETTING, 
                    type: 'select', 
                    values: { kp: 'Кинопоиск', imdb: 'IMDB', votes: 'За голосами' }, 
                    "default": 'votes' 
                },
                field: { name: Lampa.Lang.translate('mtv_rating_conf') }
            });
        }
    }

    // --- ІНІЦІАЛІЗАЦІЯ ---
    function startPlugin() {
        var service = new CategorizedService();
        Lampa.Api.sources[PLUGIN_NAME] = service;

        // Додавання пункту в меню
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

        // Слухач для нових карток
        Lampa.Listener.follow('layout', function(e) {
            if (e.type === 'complete') {
                $('.card').each(function() { addSeriesIndicator(this); });
            }
        });

        // Очищення кешу в системних налаштуваннях
        Lampa.SettingsApi.addParam({
            component: "main",
            param: { name: "mtv_clear", type: "trigger" },
            field: { name: Lampa.Lang.translate('movie_cache') },
            onChange: function() { cache = {}; Lampa.Noty.show(Lampa.Lang.translate('movie_cleared')); }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') startPlugin(); });
}();
