(function() {
    'use strict';

    /*
      📌 PLUGIN: LampaUA Parser Switcher
      📝 DESC: Швидкий вибір URL парсера Jackett/Prowlarr.
    */

    // СЕРВЕРИ
    var all_presets = [
        { name: '🌍 JackettUa (Основний)', type: 'jackett', url: 'https://jackettua.mooo.com', key: 'ua' },
        { name: '🏠 JackettUa (Резерв)', type: 'jackett', url: 'http://lampaua.mooo.com', key: '1' }
    ];

    function applyPreset(preset) {
        var type = preset.type;

        //Зберігаємо
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

        //Оновлюємо поля
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

        Lampa.Noty.show('✅ ' + preset.name + ' активовано!');
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
                //НАЗВА
                name: '⚡ Менеджер Парсерів',
                description: 'Швидкий вибір URL парсера Jackett'
            },
            onRender: function(item) {
                item.hide(); 
                item.addClass('my-super-button');

                item.on('click', function() {
                    var current_type = Lampa.Storage.get('parser_torrent_type', 'jackett');
                    var list = all_presets.filter(function(p) { return p.type === current_type; });

                    if (!list.length) return Lampa.Noty.show('⚠️ Немає налаштувань для ' + current_type);

                    Lampa.Select.show({
                        title: 'Оберіть джерело (' + (current_type === 'jackett' ? 'Jackett' : 'Prowlarr') + ')',
                        items: list.map(function(p){ return {title: p.name, preset: p} }),
                        onSelect: function(itm) {
                            applyPreset(itm.preset);
                            Lampa.Controller.toggle('settings_component');
                        },
                        onBack: function() {
                            Lampa.Controller.toggle('settings_component');
                        }
                    });
                });

                var tryToPlace = function() {
                    var anchor = $('div[data-name="parser_use"]');
                    if (!anchor.length) anchor = $('div[data-name="jackett_url"]');
                    if (!anchor.length) anchor = $('div[data-name="prowlarr_url"]');

                    if (anchor.length > 0) {
                        $('.my-super-button').not(item).remove();
                        item.insertBefore(anchor);
                        item.show();
                    }
                };

                setTimeout(tryToPlace, 50);
                setTimeout(tryToPlace, 300);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
