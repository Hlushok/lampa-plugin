(function() {
    'use strict';

    // ⚙️ПРЕСЕТИ
    var my_presets = {
        local: { 
            name: '🌍 JackettUa (Основний)',
            url: 'https://jackettua.mooo.com',
            key: 'ua'
        },
        domain: {
            name: '🏠 JackettUa (Резерв)',
            url: 'https://lampaua.mooo.com',
            key: '1'
        },
        prowlarr: {
            name: '👾 ProwlarrUa',
            url: 'https://prowlarrua.mooo.com',
            key: 'ua'
        }
    };

    function updateUIFields(url, key) {
        // 1. Зберігаємо в пам'ять (пишемо у всі можливі варіанти, щоб точно спрацювало)
        Lampa.Storage.set('jackett_url', url);
        Lampa.Storage.set('parser_jackett_url', url);
        
        Lampa.Storage.set('jackett_api', key); 
        Lampa.Storage.set('jackett_key', key); // Деякі моди використовують 'key'
        Lampa.Storage.set('parser_jackett_api', key);
        Lampa.Storage.set('parser_jackett_key', key);

        // 2. Оновлюємо вигляд полів на екрані
        var inputs = $('.settings__input');
        
        inputs.each(function() {
            var el = $(this);
            var name = el.data('name');
            
            // Логіка для URL
            if (name == 'jackett_url' || name == 'parser_jackett_url') {
                el.val(url);
                el.find('.settings__value').text(url);
            }

            // Логіка для API (шукаємо все, що схоже на api або key)
            if (name == 'jackett_api' || name == 'jackett_key' || name == 'parser_jackett_api' || name == 'parser_jackett_key') {
                el.val(key);
                el.find('.settings__value').text(key);
            }
        });

        Lampa.Noty.show('✅ ' + url + ' встановлено!');
    }

    function initPlugin() {
        var select_values = {};
        select_values['none'] = '--- Виберіть пресет ---';
        
        for (var k in my_presets) {
            select_values[k] = my_presets[k].name;
        }

        Lampa.SettingsApi.addParam({
            component: 'parser',
            param: {
                name: 'parser_preset_selector',
                type: 'select',
                values: select_values,
                default: 'none'
            },
            field: {
                name: '⚡ Швидкий вибір Парсера',
                description: 'Jackett або Prowlarr'
            },
            onChange: function(value) {
                if (my_presets[value]) {
                    // Передаємо URL та KEY
                    updateUIFields(my_presets[value].url, my_presets[value].key);
                }
            },
            onRender: function(item) {
                setTimeout(function() {
                    var my_item = $('div[data-name="parser_preset_selector"]');
                    // Спробуємо вставити перед полем URL Jackett
                    var target = $('div[data-name="jackett_url"]');
                    if (target.length == 0) target = $('div[data-name="parser_jackett_url"]');
                    
                    if (target.length > 0) {
                        my_item.insertBefore(target);
                    } else {
                        $('.settings__content').prepend(my_item);
                    }
                }, 100);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
