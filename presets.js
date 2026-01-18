(function() {
    'use strict';

    // ⚙️ ПРЕСЕТИ (Всі разом, скрипт сам розбереться)
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
            name: '🔌 Jackett (Локально)',
            type: 'jackett',
            url: 'http://192.168.8.234:9117',
            key: 'ua'
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
        var type = preset.type;

        // Зберігаємо дані
        if (type === 'jackett') {
            Lampa.Storage.set('jackett_url', preset.url);
            Lampa.Storage.set('parser_jackett_url', preset.url);
            Lampa.Storage.set('jackett_api', preset.key);
            Lampa.Storage.set('jackett_key', preset.key);
            Lampa.Storage.set('parser_jackett_api', preset.key);
            Lampa.Storage.set('parser_jackett_key', preset.key);
        } else {
            Lampa.Storage.set('prowlarr_url', preset.url);
            Lampa.Storage.set('parser_prowlarr_url', preset.url);
            Lampa.Storage.set('prowlarr_api', preset.key);
            Lampa.Storage.set('prowlarr_key', preset.key);
            Lampa.Storage.set('parser_prowlarr_api', preset.key);
            Lampa.Storage.set('parser_prowlarr_key', preset.key);
        }

        // Оновлюємо поля візуально
        updateVisualFields(type, preset.url, preset.key);
        
        Lampa.Noty.show('✅ ' + preset.name + ' встановлено!');
    }

    function updateVisualFields(type, url, key) {
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            
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
                name: 'smart_preset_selector',
                type: 'static',
                default: 'Натисніть для вибору'
            },
            field: {
                name: '⚡ Вибрати сервер',
                description: 'Список серверів для поточного парсера'
            },
            onRender: function(item) {
                // Додаємо клас для пошуку
                item.addClass('smart-preset-btn');

                item.on('click', function() {
                    // 1. ДІЗНАЄМОСЯ, ЩО ЗАРАЗ ВКЛЮЧЕНО (Jackett чи Prowlarr)
                    var current_type = Lampa.Storage.get('parser_torrent_type', 'jackett');
                    
                    // 2. ФІЛЬТРУЄМО СПИСОК
                    var filtered_items = [];
                    all_presets.forEach(function(preset) {
                        if (preset.type === current_type) {
                            filtered_items.push({
                                title: preset.name,
                                preset_data: preset
                            });
                        }
                    });

                    // Якщо список порожній (наприклад, вибрано TorLook)
                    if (filtered_items.length === 0) {
                        Lampa.Noty.show('⚠️ Для цього типу парсера немає пресетів');
                        return;
                    }

                    // 3. ПОКАЗУЄМО ТІЛЬКИ ПОТРІБНЕ
                    Lampa.Select.show({
                        title: 'Сервери для ' + (current_type === 'jackett' ? 'Jackett' : 'Prowlarr'),
                        items: filtered_items,
                        onSelect: function(item) {
                            applyPreset(item.preset_data);
                            Lampa.Controller.toggle('settings_component');
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // 🔥 ЖОРСТКА ВСТАВКА НА САМИЙ ВЕРХ
                var moveTop = function() {
                    // Шукаємо найперший елемент (зазвичай це галочка "Використовувати парсер")
                    var topElement = $('div[data-name="parser_use"]');
                    
                    // Якщо знайшли верхній елемент і наша кнопка ще
