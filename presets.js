(function() {
    'use strict';

    // ⚙️ ПРЕСЕТИ
    var all_presets = [
        {
            name: '🌍 JackettUa (Основний)',
            type: 'jackett',
            url: 'https://jackettua.mooo.com',
            key: 'ua'
        },
        {
            name: '🏠 JackettUa (Резерв)',
            type: 'jackett',
            url: 'https://lampaua.mooo.com',
            key: '1'
        },
        {
            name: '👾 ProwlarrUa (Основний)',
            type: 'prowlarr',
            url: 'https://prowlarrua.mooo.com',
            key: 'ua'
        },
        {
            name: '🔌 Prowlarr (Локально)',
            type: 'prowlarr',
            url: 'http://192.168.8.234:9696',
            key: 'ua'
        }
    ];

    function applyPreset(preset) {
        var type = preset.type; // 'jackett' або 'prowlarr'
        
        // 1. Зберігаємо дані (URL та API)
        Lampa.Storage.set(type + '_url', preset.url);
        Lampa.Storage.set('parser_' + type + '_url', preset.url);
        
        Lampa.Storage.set(type + '_api', preset.key); 
        Lampa.Storage.set(type + '_key', preset.key);
        Lampa.Storage.set('parser_' + type + '_api', preset.key);
        Lampa.Storage.set('parser_' + type + '_key', preset.key);

        // 2. Зберігаємо ТИП парсера (важливо!)
        Lampa.Storage.set('parser_torrent_type', type);

        // 3. Оновлюємо візуально поля на екрані
        updateVisualFields(type, preset.url, preset.key);
        
        // 4. Оновлюємо перемикач типу парсера
        var type_selector = $('div[data-name="parser_torrent_type"]').find('.settings__value');
        if (type_selector.length) {
            type_selector.text(type === 'jackett' ? 'Jackett' : 'Prowlarr');
        }

        Lampa.Noty.show('✅ ' + preset.name + ' застосовано! (Перезайдіть в меню)');
    }

    function updateVisualFields(type, url, key) {
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            
            // Шукаємо поля, що відповідають вибраному типу
            if (name && name.indexOf(type) > -1) {
                if (name.indexOf('url') > -1) {
                    el.val(url);
                    el.find('.settings__value').text(url);
                }
                if (name.indexOf('api') > -1 || name.indexOf('key') > -1) {
                    el.val(key);
                    el.find('.settings__value').text(key);
                }
            }
        });
    }

    function initPlugin() {
        Lampa.SettingsApi.addParam({
            component: 'parser',
            param: {
                name: 'universal_preset_selector',
                type: 'static',
                default: 'Натисніть для вибору'
            },
            field: {
                name: '⚡ ПРЕСЕТИ (Jackett / Prowlarr)',
                description: 'Натисніть тут, щоб вибрати сервер'
            },
            onRender: function(item) {
                item.on('click', function() {
                    var menu_items = [];
                    all_presets.forEach(function(preset) {
                        menu_items.push({
                            title: preset.name,
                            preset_data: preset
                        });
                    });

                    Lampa.Select.show({
                        title: 'Виберіть сервер',
                        items: menu_items,
                        onSelect: function(item) {
                            applyPreset(item.preset_data);
                            // Закриваємо селект, повертаємось в налаштування
                            Lampa.Controller.toggle('settings_component');
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // 🔥 АГРЕСИВНА ВСТАВКА НА САМИЙ ВЕРХ
                var insertPlugin = function() {
                    var content = $('.settings__content');
                    if (content.length > 0) {
                        // Якщо кнопка ще не там - вставляємо на початок
                        if (content.find('div[data-name="universal_preset_selector"]').length === 0) {
                            content.prepend(item);
                        }
                    }
                };

                // Робимо це з затримкою, щоб меню точно відкрилося
                setTimeout(insertPlugin, 100);
                setTimeout(insertPlugin, 500); // Повторна перевірка
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
