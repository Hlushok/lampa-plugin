(function() {   
    'use strict';   
    Lampa.Platform.tv();   
      
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
      
    function startMe() {   
        if (window.location.search!='?redirect=1') {   
            if(window.location.hostname!=Lampa.Storage.get('location_server')) {   
                if (Lampa.Storage.get('location_server')!='-' && Lampa.Storage.get('location_server')!='')   
                    window.location.href = 'http://'+Lampa.Storage.get('location_server')+'?redirect=1';   
            }   
        } else {   
            Lampa.Storage.set('location_server','-');   
        }   
          
        Lampa.SettingsApi.addComponent({   
            component: 'location_redirect',   
            name: Lampa.Lang.translate('location_redirect_title'),   
            icon: icon_server_redirect   
        });   
          
        Lampa.SettingsApi.addParam({   
            component: 'location_redirect',   
            param: {   
                name: 'location_server',   
                type: 'select',   
                values: {   
                    '-': Lampa.Lang.translate('location_redirect_current'),   
                    'lampaua.mooo.com': 'lampaua.mooo.com',   
                    'lampa.mx': 'lampa.mx'   
                },   
                default: '-'   
            },   
            field: {   
                name: Lampa.Lang.translate('location_redirect_select_domain')   
            },   
            onChange: function (value) {   
                startMe();   
            }   
        });   
    }   
      
    if(window.appready) startMe();   
    else {   
        Lampa.Listener.follow('app', function(e) {   
            if(e.type == 'ready') {   
                startMe();   
            }   
        });   
    }   
})();

