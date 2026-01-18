(function() {
    'use strict';

    // ⚙️ ВСІ ТВОЇ ПРЕСЕТИ (В одному місці)
    // type: 'jackett' або 'prowlarr' - це вказує куди зберігати
    var all_presets = [
        {
            name: '🌍 Jackett (Основний/Домен)',
            type: 'jackett',
            url: 'https://jackettua.mooo.com',
            key: 'ua'
        },
        {
            name: '🏠 Jackett (Резерв/LampaUA)',
            type: 'jackett',
            url: 'https://lampaua.mooo.com',
            key: '1'
        },
        {
            name: '🔌 Jackett (Локально)',
            type: 'jackett',
            url: 'http://192.168.8.234:9117',
            key: 'ua'
        },
        {
            name: '👾 Prowlarr (UA/Домен)',
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

    // Функція, яка розуміє куди писати (в Jackett чи в Prowlarr)
    function applyPreset(preset) {
        var prefix = preset.type; // 'jackett' або 'prowlarr'
        
        // 1. Зберігаємо в пам'ять (Storage)
        Lampa.Storage.set(prefix + '_url', preset.url);
        Lampa.Storage.set('parser_' + prefix + '_url', preset.url);
        
        Lampa.Storage.set(prefix + '_api', preset.key); 
        Lampa.Storage.set(prefix + '_key', preset.key);
        Lampa.Storage.set('parser_' + prefix + '_api', preset.key);
        Lampa.Storage.set('parser_' + prefix + '_key', preset.key);

        // 2. Оновлюємо візуально поля на екрані
        updateVisualFields(prefix, preset.url, preset.key);

        Lampa.Noty.show('✅ ' + preset.name + ' встановлено!');
    }

    function updateVisualFields(type, url, key) {
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            
            // Якщо поле містить тип (наприклад prowlarr_url)
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
                type: 'static', // Просто кнопка, не select
                default: 'Натисніть для вибору'
            },
            field: {
                name: '⚡ Пресети (Jackett / Prowlarr)',
                description: 'Виберіть потрібний сервіс зі списку'
            },
            // Обробка натискання на саму кнопку (замість onChange)
            onRender: function(item) {
                item.on('click', function() {
                    var menu_items = [];
                    
                    // Формуємо меню для Lampa Select
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
                            Lampa.Controller.toggle('settings_component'); // Повернути фокус
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // Вставляємо кнопку на самий верх списку
                setTimeout(function() {
                    // Пробуємо вставити перед будь-яким полем URL (Jackett або Prowlarr)
                    var target = $('div[data-name="jackett_url"]');
                    if (target.length == 0) target = $('div[data-name="prowlarr_url"]');
                    if (target.length == 0) target = $('div[data-name="parser_jackett_url"]');
                    
                    if (target.length > 0) {
                        item.insertBefore(target);
                    } else {
                        // Якщо полів ще немає, кидаємо нагору
                        $('.settings__content').prepend(item);
                    }
                }, 200);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
