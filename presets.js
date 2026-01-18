(function() {
    'use strict';

    // ⚙️ ТВОЇ ПРЕСЕТИ
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
            name: '👾 ProwlarrUa (Домен)',
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
        
        // 1. Зберігаємо дані у ВСІ можливі комірки пам'яті
        // Для Jackett
        if (type === 'jackett') {
            Lampa.Storage.set('jackett_url', preset.url);
            Lampa.Storage.set('parser_jackett_url', preset.url);
            Lampa.Storage.set('jackett_api', preset.key);
            Lampa.Storage.set('jackett_key', preset.key);
            Lampa.Storage.set('parser_jackett_api', preset.key);
            Lampa.Storage.set('parser_jackett_key', preset.key);
        }
        
        // Для Prowlarr
        if (type === 'prowlarr') {
            Lampa.Storage.set('prowlarr_url', preset.url);
            Lampa.Storage.set('parser_prowlarr_url', preset.url);
            Lampa.Storage.set('prowlarr_api', preset.key);
            Lampa.Storage.set('prowlarr_key', preset.key);
            Lampa.Storage.set('parser_prowlarr_api', preset.key);
            Lampa.Storage.set('parser_prowlarr_key', preset.key);
        }

        // 2. Перемикаємо тип парсера в налаштуваннях
        Lampa.Storage.set('parser_torrent_type', type);

        // 3. Сповіщення
        Lampa.Noty.show('✅ ' + preset.name + ' збережено! Перезайдіть у меню.');

        // 4. Оновлення полів (якщо вони видимі)
        updateVisualFields(type, preset.url, preset.key);
        
        // 5. Оновлення тексту типу парсера
        var typeSelector = $('div[data-name="parser_torrent_type"] .settings__value');
        if (typeSelector.length) typeSelector.text(type === 'jackett' ? 'Jackett' : 'Prowlarr');
    }

    function updateVisualFields(type, url, key) {
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            
            // Якщо поле стосується вибраного типу
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
                description: 'Виберіть сервер зі списку'
            },
            onRender: function(item) {
                // Додаємо унікальний клас, щоб знаходити кнопку
                item.addClass('my-unique-preset-button');

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
                            // Закриваємо меню вибору, повертаємось у налаштування
                            Lampa.Controller.toggle('settings_component');
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // 🔥 ЗАХИСТ ВІД ДУБЛЮВАННЯ + ВСТАВКА
                var insertPlugin = function() {
                    // Якщо кнопка вже є - СТОП, нічого не робимо
                    if ($('.my-unique-preset-button').length > 0) return;

                    var content = $('.settings__content');
                    if (content.length > 0) {
                        content.prepend(item);
                    }
                };

                setTimeout(insertPlugin, 100);
                setTimeout(insertPlugin, 500); // Контрольний постріл
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
