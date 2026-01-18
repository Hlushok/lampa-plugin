(function () {
    'use strict';

    // ⚙️ НАЛАШТУВАННЯ ТВОЇХ ПАРСЕРІВ
    // Тут пропиши свої варіанти. Можна додавати скільки завгодно.
    var my_presets = [
        {
            name: '🏠 Дім (Локально)',
            url: 'https://jackettua.mooo.com', // Твоя локальна адреса Jackett
            key: 'ua'                        // Твій API ключ
        },
        {
            name: '🌍 Ззовні (Домен)',
            url: 'https://prowlarrua.mooo.com', // Адреса через твій домен (якщо налаштовано проксі)
            key: 'ua'                                // Або 'http://192.168.8.234:9117' якщо через VPN
        }
    ];

    function ParserSwitcher() {
        // Слідкуємо за відкриттям налаштувань
        Lampa.Settings.listener.follow('open', function (e) {
            // Коли відкривається розділ "Парсер"
            if (e.name == 'parser') {
                var body = e.body; // Це тіло меню налаштувань

                // Створюємо елемент вибору
                var selector = {
                    title: '⚡ Швидкий вибір парсера',
                    type: 'static', // Використовуємо static для відображення
                    value: 'Натисніть для вибору',
                    component: 'button',
                    onSelect: function () {
                        // Відкриваємо меню вибору пресетів
                        Lampa.Select.show({
                            title: 'Виберіть джерело',
                            items: my_presets,
                            onSelect: function (item) {
                                // 💾 ГОЛОВНА МАГІЯ: ЗАПИСУЄМО ДАНІ
                                // Змінюємо налаштування Jackett в сховищі Lampa
                                Lampa.Storage.set('jackett_url', item.url);
                                Lampa.Storage.set('jackett_api', item.key);
                                Lampa.Storage.set('parser_jackett_url', item.url); // Для сумісності з різними плагінами
                                Lampa.Storage.set('parser_jackett_api', item.key);

                                // Оновлюємо інтерфейс, щоб показати, що вибрано
                                Lampa.Noty.show('Налаштування застосовано: ' + item.name);
                                
                                // Примусово оновлюємо поля в поточному меню (візуально)
                                updateUIFields(item.url, item.key);
                                
                                Lampa.Controller.toggle('settings_component'); // Повертаємо фокус
                            },
                            onBack: function () {
                                Lampa.Controller.toggle('settings_component');
                            }
                        });
                    }
                };

                // Додаємо наш пункт на самий верх списку налаштувань парсера
                var item_rendered = Lampa.SettingsApi.createRender(selector);
                body.find('.settings__content').prepend(item_rendered);
            }
        });
    }

    // Функція для візуального оновлення полів без перезавантаження
    function updateUIFields(url, key) {
        // Шукаємо поля вводу на екрані і міняємо їх значення
        var inputs = $('.settings__input');
        inputs.each(function() {
            var name = $(this).data('name');
            if (name === 'jackett_url' || name === 'parser_jackett_url') {
                $(this).val(url);
                $(this).find('.settings__value').text(url);
            }
            if (name === 'jackett_api' || name === 'parser_jackett_api') {
                $(this).val(key);
                $(this).find('.settings__value').text(key);
            }
        });
    }

    // Запуск плагіна
    if (window.Lampa) {
        ParserSwitcher();
        console.log('🔌 Parser Switcher завантажено');
    }

})();
