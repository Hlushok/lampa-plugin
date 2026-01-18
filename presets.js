(function() {
    'use strict';

    // ⚙️ НАЛАШТУВАННЯ ПРЕСЕТІВ
    // Тут твої реальні дані. Можеш змінювати URL та API.
    var my_presets = {
        local: {
            name: '🏠 Дім (Локально)',
            url: 'http://192.168.8.234:9117',
            api: 'ua'
        },
        domain: {
            name: '🌍 Ззовні (Домен)',
            url: 'https://lampaua.mooo.com/jackett',
            api: 'ua'
        }
    };

    // Допоміжна функція для оновлення полів на екрані без перезавантаження
    function updateUIFields(url, api) {
        // Оновлюємо значення в пам'яті (Storage)
        Lampa.Storage.set('jackett_url', url);
        Lampa.Storage.set('jackett_api', api);
        Lampa.Storage.set('parser_jackett_url', url);
        Lampa.Storage.set('parser_jackett_api', api);

        // Шукаємо поля на екрані і змінюємо їх візуально
        $('.settings__input').each(function() {
            var name = $(this).data('name');
            if (name == 'jackett_url' || name == 'parser_jackett_url') {
                $(this).val(url);
                $(this).find('.settings__value').text(url);
            }
            if (name == 'jackett_api' || name == 'parser_jackett_api') {
                $(this).val(api);
                $(this).find('.settings__value').text(api);
            }
        });
        
        // Показуємо повідомлення
        Lampa.Noty.show('✅ Налаштування застосовано!');
    }

    function initPlugin() {
        // Формуємо список для випадаючого меню (select)
        var select_values = {};
        // Додаємо пункт "Виберіть..." як стартовий, якщо нічого не вибрано
        select_values['none'] = '--- Виберіть пресет ---';
        
        for (var key in my_presets) {
            select_values[key] = my_presets[key].name;
        }

        // Додаємо параметр через офіційний API
        Lampa.SettingsApi.addParam({
            component: 'parser', // Вказуємо, що це для меню "Парсер"
            param: {
                name: 'parser_preset_selector',
                type: 'select',
                values: select_values,
                default: 'none'
            },
            field: {
                name: '⚡ Швидкий вибір Jackett',
                description: 'Автоматично прописати URL та API'
            },
            onChange: function(value) {
                if (my_presets[value]) {
                    // Якщо вибрали реальний пресет - застосовуємо
                    updateUIFields(my_presets[value].url, my_presets[value].api);
                }
            },
            onRender: function(item) {
                // Магія переміщення пункту нагору
                setTimeout(function() {
                    // Шукаємо наш створений елемент
                    var my_item = $('div[data-name="parser_preset_selector"]');
                    
                    // Шукаємо, куди вставити (спробуємо перед галочкою "Використовувати парсер")
                    var target = $('div[data-name="parser_use"]');
                    
                    // Якщо галочки немає, спробуємо перед полем URL
                    if (target.length == 0) target = $('div[data-name="jackett_url"]');
                    
                    // Якщо знайшли куди - переміщуємо
                    if (target.length > 0 && my_item.length > 0) {
                        my_item.insertBefore(target);
                    } else {
                        // Якщо нічого не знайшли, вставляємо на початок списку
                        $('.settings__content').prepend(my_item);
                    }
                }, 0);
            }
        });
    }

    // Стандартна перевірка готовності Lampa (як у зразку)
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }
})();
