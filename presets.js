(function() {
    'use strict';

    // СЕРВЕРИ
    var all_presets = [
        { name: '🌍 JackettUa (Основний)', type: 'jackett', url: 'https://jackettua.mooo.com', key: 'ua' },
        { name: '🏠 JackettUa (Резерв)', type: 'jackett', url: 'https://lampaua.mooo.com', key: '1' },
        { name: '👾 ProwlarrUa (Домен)', type: 'prowlarr', url: 'https://prowlarrua.mooo.com', key: 'ua' }
    ];

    function applyPreset(preset) {
        var type = preset.type;

        // Зберігаємо (безшумно)
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

        // Оновлюємо поля на екрані
        $('.settings__input').each(function() {
            var name = $(this).data('name');
            if (name && name.indexOf(type) > -1) {
                if (name.indexOf('url') > -1) {
                    $(this).val(preset.url).find('.settings__value').text(preset.url);
                }
                if (name.indexOf('api') > -1 || name.indexOf('key') > -1) {
                    $(this).val(preset.key).find('.settings__value').text(preset.key);
                }
            }
        });

        Lampa.Noty.show('✅ ' + preset.name + ' обрано!');
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
                description: 'Швидка зміна Jackett / Prowlarr'
            },
            onRender: function(item) {
                // Ховаємо кнопку одразу, щоб вона не блимала де не треба
                item.hide(); 
                item.addClass('my-super-button'); // Мітка для пошуку

                item.on('click', function() {
                    var current_type = Lampa.Storage.get('parser_torrent_type', 'jackett');
                    
                    // Фільтруємо список під поточний тип
                    var list = all_presets.filter(function(p) { return p.type === current_type; });

                    if (!list.length) return Lampa.Noty.show('⚠️ Немає пресетів для ' + current_type);

                    Lampa.Select.show({
                        title: 'Сервери: ' + (current_type === 'jackett' ? 'Jackett' : 'Prowlarr'),
                        items: list.map(function(p){ return {title: p.name, preset: p} }),
                        onSelect: function(itm) {
                            applyPreset(itm.preset);
                            Lampa.Controller.toggle('settings_component'); // Закрити список
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                // РОЗУМНА ВСТАВКА (Smart Insert)
                var tryToPlace = function() {
                    // Шукаємо "Якір" (елемент, який є ТІЛЬКИ в меню парсера)
                    // Зазвичай це галочка "Використовувати парсер" або поле URL
                    var anchor = $('div[data-name="parser_use"]');
                    if (!anchor.length) anchor = $('div[data-name="jackett_url"]');
                    if (!anchor.length) anchor = $('div[data-name="prowlarr_url"]');

                    if (anchor.length > 0) {
                        // УРА! Ми точно в меню Парсера.
                        
                        // Чистимо дублікати (якщо раптом старі кнопки лишилися)
                        $('.my-super-button').not(item).remove();

                        // Ставимо кнопку перед якорем і показуємо її
                        item.insertBefore(anchor);
                        item.show();
                    } else {
                        // Якоря немає? Значить ми в Головному меню.
                        // Кнопка сидить тихо і не висовується (hide).
                    }
                };

                // Пробуємо знайти місце кілька разів
                setTimeout(tryToPlace, 50);
                setTimeout(tryToPlace, 300);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
