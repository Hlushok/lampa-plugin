(function () {
    'use strict';

    // ⚙️ НАЛАШТУВАННЯ (Тут впиши свої дані)
    var my_presets = [
        {
            name: '🏠 Дім (Локально)',
            url: 'http://192.168.8.234:9117', 
            key: 'ua'
        },
        {
            name: '🌍 Ззовні (Домен)',
            url: 'https://lampaua.mooo.com/jackett', // Перевір, щоб це посилання працювало
            key: 'ua'
        }
    ];

    function ParserSwitcher() {
        Lampa.Settings.listener.follow('open', function (e) {
            // Перевіряємо, чи відкрилося меню "Парсер"
            if (e.name == 'parser') {
                
                // Створюємо кнопку
                var selector = {
                    title: '⚡ Вибрати парсер',
                    type: 'static',
                    value: 'Натисніть для вибору',
                    component: 'button',
                    onSelect: function () {
                        Lampa.Select.show({
                            title: 'Виберіть джерело',
                            items: my_presets,
                            onSelect: function (item) {
                                // Зберігаємо налаштування
                                Lampa.Storage.set('jackett_url', item.url);
                                Lampa.Storage.set('jackett_api', item.key);
                                Lampa.Storage.set('parser_jackett_url', item.url);
                                Lampa.Storage.set('parser_jackett_api', item.key);

                                Lampa.Noty.show('✅ Встановлено: ' + item.name);
                                
                                // Оновлюємо поля на екрані
                                updateUIFields(item.url, item.key);
                                Lampa.Controller.toggle('settings_component');
                            },
                            onBack: function () {
                                Lampa.Controller.toggle('settings_component');
                            }
                        });
                    }
                };

                var item_rendered = Lampa.SettingsApi.createRender(selector);

                // 🔧 НОВА ЛОГІКА ВСТАВКИ
                // Шукаємо поле введення URL Jackett
                var target_field = e.body.find('[data-name="jackett_url"]').closest('.settings__param');
                
                if (target_field.length) {
                    // Якщо знайшли поле - вставляємо кнопку ПЕРЕД ним
                    target_field.before(item_rendered);
                } else {
                    // Якщо поле не знайшли (раптом назва інша), вставляємо на початок списку
                    e.body.find('.settings__content').prepend(item_rendered);
                }
            }
        });
    }

    function updateUIFields(url, key) {
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

    if (window.Lampa) {
        ParserSwitcher();
         Lampa.Noty.show('Плагін пресетів завантажено'); // Розкоментуй для перевірки старту
    }

})();
