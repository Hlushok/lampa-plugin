(function() {
    'use strict';

    // ⚙️ НАЛАШТУВАННЯ ПРЕСЕТІВ
    var all_presets = [
        { name: '🌍 JackettUa (Основний)', type: 'jackett', url: 'https://jackettua.mooo.com', key: 'ua' },
        { name: '🏠 JackettUa (Резерв)', type: 'jackett', url: 'https://lampaua.mooo.com', key: '1' },
        { name: '🔌 Jackett (Локально)', type: 'jackett', url: 'http://192.168.8.234:9117', key: 'ua' },
        { name: '👾 ProwlarrUa (Домен)', type: 'prowlarr', url: 'https://prowlarrua.mooo.com', key: 'ua' },
        { name: '🔌 Prowlarr (Локально)', type: 'prowlarr', url: 'http://192.168.8.234:9696', key: 'ua' }
    ];

    function applyPreset(preset) {
        var type = preset.type;

        // Зберігаємо у всі можливі змінні
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

        // Оновлюємо візуально (якщо поля видимі)
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            if (name && name.indexOf(type) > -1) {
                if (name.indexOf('url') > -1) {
                    el.val(preset.url);
                    el.find('.settings__value').text(preset.url);
                }
                if (name.indexOf('api') > -1 || name.indexOf('key') > -1) {
                    el.val(preset.key);
                    el.find('.settings__value').text(preset.key);
                }
            }
        });

        Lampa.Noty.show('✅ ' + preset.name + ' встановлено!');
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
                // Додаємо унікальний клас для пошуку
                item.addClass('smart-preset-btn');
                
                // Приховуємо кнопку одразу після створення (щоб вона не висіла де не треба)
                item.hide();

                item.on('click', function() {
                    // Визначаємо поточний тип
                    var current_type = Lampa.Storage.get('parser_torrent_type', 'jackett');
                    
                    var filtered_items = all_presets.filter(function(p) {
                        return p.type === current_type;
                    });

                    if (filtered_items.length === 0) {
                        Lampa.Noty.show('⚠️ Немає пресетів для ' + current_type);
                        return;
                    }

                    Lampa.Select.show({
                        title: 'Сервери: ' + (current_type === 'jackett' ? 'Jackett' : 'Prowlarr'),
                        items: filtered_items.map(function(p) {
                            return { title: p.name, preset: p };
                        }),
                        onSelect: function(itm) {
                            applyPreset(itm.preset);
                            Lampa.Controller.toggle('settings_component');
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // ФУНКЦІЯ ПЕРЕМІЩЕННЯ
                var placeButton = function() {
                    // 1. Перевіряємо, чи ми вже додали таку кнопку в DOM (захист від клонів)
                    if ($('.settings__content .smart-preset-btn').length > 0) {
                        // Якщо кнопка вже є, а ця - нова (дублікат), видаляємо нову
                        if (!item.parent().length) item.remove();
                        return; 
                    }

                    // 2. Шукаємо "Якір" - пункт "Використовувати парсер"
                    // Він є ТІЛЬКИ в меню парсера.
                    var anchor = $('div[data-name="parser_use"]');

                    if (anchor.length > 0) {
                        // Знайшли якір! Значить ми в меню Парсер
