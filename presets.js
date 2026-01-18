(function() {
    'use strict';

    // 1️⃣ ПРЕСЕТИ ДЛЯ JACKETT
    var jackett_presets = {
        main: { 
            name: '🌍 JackettUa (Основний)',
            url: 'https://jackettua.mooo.com',
            key: 'ua'
        },
        backup: {
            name: '🏠 JackettUa (Резерв/Домен)',
            url: 'https://lampaua.mooo.com',
            key: '1'
        },
        local: {
            name: '🔌 Локальний (192.168...)',
            url: 'http://192.168.8.234:9117',
            key: 'ua'
        }
    };

    // 2️⃣ ПРЕСЕТИ ДЛЯ PROWLARR
    var prowlarr_presets = {
        main: {
            name: '👾 ProwlarrUa',
            url: 'https://prowlarrua.mooo.com',
            key: 'ua'
        },
        local: {
            name: '🔌 Локальний Prowlarr',
            url: 'http://192.168.8.234:9696',
            key: 'ua'
        }
    };

    // Функція оновлення полів JACKETT
    function updateJackettFields(url, key) {
        Lampa.Storage.set('jackett_url', url);
        Lampa.Storage.set('parser_jackett_url', url);
        Lampa.Storage.set('jackett_api', key); 
        Lampa.Storage.set('jackett_key', key);
        
        // Оновлюємо візуально
        updateUI('jackett', url, key);
        Lampa.Noty.show('✅ Jackett налаштовано: ' + url);
    }

    // Функція оновлення полів PROWLARR
    function updateProwlarrFields(url, key) {
        Lampa.Storage.set('prowlarr_url', url);
        Lampa.Storage.set('parser_prowlarr_url', url);
        Lampa.Storage.set('prowlarr_api', key); 
        Lampa.Storage.set('prowlarr_key', key);
        
        // Оновлюємо візуально
        updateUI('prowlarr', url, key);
        Lampa.Noty.show('✅ Prowlarr налаштовано: ' + url);
    }

    // Загальна функція оновлення полів на екрані
    function updateUI(type, url, key) {
        $('.settings__input').each(function() {
            var el = $(this);
            var name = el.data('name');
            
            // Перевіряємо, чи це поле відноситься до вибраного типу
            if (name.indexOf(type + '_url') > -1) {
                el.val(url);
                el.find('.settings__value').text(url);
            }
            if (name.indexOf(type + '_api') > -1 || name.indexOf(type + '_key') > -1) {
                el.val(key);
                el.find('.settings__value').text(key);
            }
        });
    }

    function initPlugin() {
        
        // --- ЛОГІКА ДЛЯ JACKETT ---
        var jackett_values = { 'none': '--- Виберіть Jackett ---' };
        for (var j in jackett_presets) jackett_values[j] = jackett_presets[j].name;

        Lampa.SettingsApi.addParam({
            component: 'parser',
            param: {
                name: 'jackett_preset_selector',
                type: 'select',
                values: jackett_values,
                default: 'none'
            },
            field: {
                name: '⚡ Вибір Jackett',
                description: 'Швидкі налаштування для Jackett'
            },
            onChange: function(value) {
                if (jackett_presets[value]) updateJackettFields(jackett_presets[value].url, jackett_presets[value].key);
            },
            onRender: function(item) {
                // Показувати ТІЛЬКИ якщо вибрано тип Jackett
                if (Lampa.Storage.get('parser_torrent_type') !== 'jackett') {
                    item.hide();
                    return;
                }
                setTimeout(function() {
                    var target = $('div[data-name="jackett_url"]');
                    if (target.length) item.insertBefore(target);
                    else $('.settings__content').prepend(item);
                }, 100);
            }
        });

        // --- ЛОГІКА ДЛЯ PROWLARR ---
        var prowlarr_values = { 'none': '--- Виберіть Prowlarr ---' };
        for (var p in prowlarr_presets) prowlarr_values[p] = prowlarr_presets[p].name;

        Lampa.SettingsApi.addParam({
            component: 'parser',
            param: {
                name: 'prowlarr_preset_selector',
                type: 'select',
                values: prowlarr_values,
                default: 'none'
            },
            field: {
                name: '⚡ Вибір Prowlarr',
                description: 'Швидкі налаштування для Prowlarr'
            },
            onChange: function(value) {
                if (prowlarr_presets[value]) updateProwlarrFields(prowlarr_presets[value].url, prowlarr_presets[value].key);
            },
            onRender: function(item) {
                // Показувати ТІЛЬКИ якщо вибрано тип Prowlarr
                if (Lampa.Storage.get('parser_torrent_type') !== 'prowlarr') {
                    item.hide();
                    return;
                }
                setTimeout(function() {
                    var target = $('div[data-name="prowlarr_url"]');
                    // Якщо поле Prowlarr ще не намалювалось, спробуємо знайти Jackett і встати замість нього
                    if (target.length == 0) target = $('div[data-name="jackett_url"]');
                    
                    if (target.length) item.insertBefore(target);
                    else $('.settings__content').prepend(item);
                }, 100);
            }
        });
    }

    if (window.appready) initPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type === 'ready') initPlugin(); });
})();
