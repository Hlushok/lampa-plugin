(function() {
    'use strict';

    // Додаємо локалізацію
    Lampa.Lang.add({
        location_redirect_title: {
            ru: 'Смена сервера',
            uk: 'Зміна сервера',
            en: 'Change server'
        },
        location_redirect_current: {
            ru: 'Текущий',
            uk: 'Поточний',
            en: 'Current'
        },
        location_redirect_select_domain: {
            ru: 'Выберите домен Lampa',
            uk: 'Виберіть домен Lampa',
            en: 'Choose Lampa domain'
        }
    });

    var icon_server_redirect = `<svg height="36" viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 2L24 7L19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 24L24 29L19 34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 7H8C5.79086 7 4 8.79086 4 11V25C4 27.2091 5.79086 29 8 29H14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 7H30C32.2091 7 34 8.79086 34 11V25C34 27.2091 32.2091 29 30 29H24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="19" cy="18" r="3" stroke="white" stroke-width="2"/>
    </svg>`;

    function checkRedirect() {
        var target = Lampa.Storage.get('location_server');
        var current = window.location.hostname;

        // Якщо вибрано конкретний сервер (не "-") і ми не на ньому
        if (target && target !== '-' && target !== '' && current !== target) {
            // Використовуємо HTTPS, бо сервер на SSL
            window.location.href = 'https://' + target;
        }
    }

    function initPlugin() {
        // Додаємо компонент у налаштування
        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: Lampa.Lang.translate('location_redirect_title'),
            icon: icon_server_redirect
        });

        // Додаємо вибір домену
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'location_server',
                type: 'select',
                values: {
                    '-': Lampa.Lang.translate('location_redirect_current'),
                    'lampaua.mooo.com': 'lampaua.mooo.com', // Мій
                    'lampa.mx': 'lampa.mx'                  // Офіційний
                },
                default: '-'
            },
            field: {
                name: Lampa.Lang.translate('location_redirect_select_domain'),
                description: 'Автоматичний перехід на обраний домен'
            },
            onChange: function (value) {
                // Якщо користувач змінив налаштування - одразу перевіряємо, чи треба переходити
                if (value !== '-') {
                    Lampa.Storage.set('location_server', value); // Примусово зберігаємо перед переходом
                    checkRedirect();
                }
            }
        });
        
        // Запускаємо перевірку при старті плагіна
        checkRedirect();
    }

    if (window.appready) initPlugin();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') initPlugin();
        });
    }
})();
