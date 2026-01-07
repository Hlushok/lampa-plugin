!function() { 
    "use strict"; 
    var PLUGIN_NAME = "movieTV"; 
    // Пряме посилання на ваш JSON
    var JSON_URL = "https://cdn.jsdelivr.net/gh/Hlushok/lampa-plugin@main/base.json"; 
    
    function CategorizedService() {
        var self = this;
        var network = new Lampa.Reguest();

        // ЦЕЙ МЕТОД ВИПРАВЛЯЄ ПОМИЛКУ "source(...).category is not a function"
        self.category = function(params, onSuccess, onError) {
            network.silent(JSON_URL, function(json) {
                var items = [];
                if (json && json.categories) {
                    json.categories.forEach(function(cat) {
                        var category_item = {
                            title: cat.title,
                            items: cat.items.map(function(item) {
                                // Визначаємо тип: якщо є 'ti' (title) - це фільм, інакше серіал
                                item.type = item.ti ? 'movie' : 'tv';
                                item.title = item.ti || item.n;
                                // Додаємо дані для пошуку
                                item.category_id = cat.id;
                                return item;
                            })
                        };
                        items.push(category_item);
                    });
                }
                onSuccess(items);
            }, onError);
        };

        // Метод для відкриття картки фільму через TMDB
        self.full = function(params, onSuccess, onError) {
            Lampa.Api.sources.tmdb.full(params, onSuccess, onError);
        };
    }

    function startPlugin() {
        var service = new CategorizedService();
        Lampa.Api.sources[PLUGIN_NAME] = service;

        // Іконка для меню
        var ICON_SVG = '<svg viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.85742" y="1.70898" width="35.501" height="35.501" rx="4.5" stroke="currentColor" stroke-width="3"/><path d="M25.5996 14.27C27.5326 14.27 29.0996 15.837 29.0996 17.77V22.0464C29.0996 23.9794 27.5326 25.5464 25.5996 25.5464H22.4365V14.27H25.5996Z" fill="currentColor"/></svg>';

        // Створення пункту в бічному меню
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

        // Додаємо в початок списку меню
        $(".menu .menu__list").eq(0).append(menuItem);
    }

    // Очікування готовності додатка
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') startPlugin(); });
}();
