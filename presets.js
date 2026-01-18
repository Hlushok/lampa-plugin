(function () {
    'use strict';

    // ⚙️ НАЛАШТУВАННЯ
    var my_presets = [
        {
            name: '🏠 Дім (Локально)',
            url: 'http://192.168.8.234:9117', 
            key: 'ua'
        },
        {
            name: '🌍 Ззовні (Домен)',
            url: 'https://lampaua.mooo.com/jackett',
            key: 'ua'
        }
    ];

    function ParserSwitcher() {
        Lampa.Settings.listener.follow('open', function (e) {
            // Перевіряємо, чи ми в меню "Парсер"
            if (e.name == 'parser') {
                
                // 🕒 ЗА ТРИМКА: Чекаємо 200мс, поки меню намалюється
                setTimeout(function(){
                    
                    // Перевіряємо, чи кнопка вже є (щоб не дублювати)
                    if($('.switcher-button').length) return;

                    var selector = {
                        title: '⚡ Змінити Jackett',
                        type: 'static',
                        value: 'Натисніть для вибору',
                        component: 'button',
                        onSelect: function () {
                            Lampa.Select.show({
                                title: 'Виберіть пресет',
                                items: my_presets,
                                onSelect: function (item) {
                                    // Пишемо в усі можливі варіанти змінних
                                    Lampa.Storage.set('jackett_url', item.url);
                                    Lampa.Storage.set('jackett_api', item.key);
                                    Lampa.Storage.set('parser_jackett_url', item.url);
                                    Lampa.Storage.set('parser_jackett_api', item.key);

                                    Lampa.Noty.show('✅ ' + item.name);
                                    
                                    // Оновлюємо візуально
                                    updateUIFields(item.url, item.key);
                                    
                                    // Повертаємося назад
                                    Lampa.Controller.toggle('settings_component');
                                },
                                onBack: function () {
                                    Lampa.Controller.toggle('settings_component');
                                }
                            });
                        }
                    };

                    // Рендеримо кнопку через API Lampa
                    var item_rendered = Lampa.SettingsApi.createRender(selector);
                    
                    // Додаємо клас, щоб потім перевіряти на дублікати
                    item_rendered.addClass('switcher-button');
                    
                    // 🔨 ВСТАВКА: Просто кидаємо на самий верх скрол-меню
                    // Знаходимо контент налаштувань
                    var content = $('.settings__content');
                    
                    if (content.length) {
                        content.prepend(item_rendered);
                    } else {
                        console.log('Помилка: Не знайдено .settings__content');
                    }
                    
                }, 300); // 300 мілісекунд затримки
            }
        });
    }

    function updateUIFields(url, key) {
        // Оновлюємо будь-яке поле, що схоже на URL або API
        $('.settings__input').each(function() {
            var name = $(this).data('name');
            if (name && (name.indexOf('jackett_url') > -1 || name.indexOf('parser_url') > -1)) {
                $(this).val(url);
                $(this).find('.settings__value').text(url);
            }
            if (name && (name.indexOf('jackett_api') > -1 || name.indexOf('parser_api') > -1)) {
                $(this).val(key);
                $(this).find('.settings__value').text(key);
            }
        });
    }

    if (window.Lampa) {
        ParserSwitcher();
        console.log('Presets Plugin Loaded');
    }

})();
