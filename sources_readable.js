"use strict";

function _typeof(e) {
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
        return typeof e
    } : function(e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
    }, _typeof(e)
}

! function() {
    function e(e, t) {
        var n = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
            var i = Object.getOwnPropertySymbols(e);
            t && (i = i.filter((function(t) {
                return Object.getOwnPropertyDescriptor(e, t).enumerable
            }))), n.push.apply(n, i)
        }
        return n
    }

    function t(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }

    function n(e, t) {
        for (var n = 0; n < t.length; n++) {
            var i = t[n];
            i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, i.key, i)
        }
    }

    function i(e, t, i) {
        return t && n(e.prototype, t), i && n(e, i), Object.defineProperty(e, "prototype", {
            writable: !1
        }), e
    }

    function a(e, t, n) {
        return t in e ? Object.defineProperty(e, t, {
            value: n,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : e[t] = n, e
    }

    // Менеджер збереження обраних джерел
    var o = function() {
        function e(n) {
            t(this, e), this.hash = Lampa.Utils.hash(n.movie.original_title), this.field = "online_selected_source_" + this.hash
        }
        return i(e, [{
            key: "get",
            value: function() {
                return Lampa.Storage.get(this.field, "{}")
            }
        }, {
            key: "set",
            value: function(e) {
                Lampa.Storage.set(this.field, e)
            }
        }]), e
    }();

    // Список студій та параметрів фільтрації
    var s = ["LostFilm", "гнфк", "Дубляж", "AlexFilm", "HDRezka Studio", "BaibaKo", "NewStudio", "Кубик в кубе", "Кураж-Бамбей", "Пифагор", "Паравозик", "Невафильм", "Кравец", "ТВШоу", "Синема УС", "Оригинал", "Субтитры"];

    // Список доступних онлайн-джерел
    var r = [
        { title: "RHS", name: "rhsprem" },
        { title: "Kinopub", name: "kinopub" },
        { title: "Vokino", name: "vokino" },
        { title: "Filmix", name: "filmix" },
        { title: "Rezka", name: "rezka" },
        { title: "Kodik", name: "kodik" },
        { title: "Ashdi", name: "ashdi" },
        { title: "Collaps", name: "collaps" },
        { title: "Videocdn", name: "videocdn" },
        { title: "Voidboost", name: "voidboost" },
        { title: "Zetflix", name: "zetflix" },
        { title: "Libris", name: "libris" },
        { title: "Kinobase", name: "kinobase" }
    ];

    // Отримання увімкнених джерел
    function y() {
        return r.filter((function(e) {
            return Lampa.Storage.field("online_source_" + e.name)
        }))
    }

    // Логіка роботи з серверами (Lampac / BWA)
    function b() {
        return Lampa.Storage.get("online_custom_servers", "[]")
    }

    function k(e) {
        Lampa.Storage.set("online_custom_servers", e)
    }

    // Фільтрація та уніфікація назв перекладів
    var M = {
        filterTranslate: function(e) {
            var t = Lampa.Storage.field("online_filter_ts"),
                n = Lampa.Storage.field("online_filter_hdr");
            return e.filter((function(e) {
                var i = !0;
                return t && (e.quality && (e.quality.toLowerCase().includes("ts") || e.quality.toLowerCase().includes("cam")) && (i = !1)), n && (e.quality && e.quality.toLowerCase().includes("hdr") && (i = !1)), i
            }))
        },
        renameTranslate: function(e) {
            return e ? e.replace(/BDRip|WebRip|1080p|720p/gi, "").trim() : "Невідомо"
        },
        sortDUBTranstale: function(e) {
            return e.sort((function(e, t) {
                var n = e.name.toLowerCase().includes("дубляж"),
                    i = t.name.toLowerCase().includes("дубляж");
                return i - n
            }))
        }
    };

    // Робота з даними про серіали (Tvmaze)
    var l = {
        cache: {},
        get: function(e, t) {
            var n = this,
                i = e.imdb_id || e.tmdb_id;
            if (this.cache[i]) return t(this.cache[i]);
            var a = "https://api.tvmaze.com/lookup/shows?" + (e.imdb_id ? "imdb=" + e.imdb_id : "thetvdb=" + e.tvdb_id);
            $.ajax({
                url: a,
                success: function(a) {
                    n.cache[i] = a, t(a)
                },
                error: function() {
                    t(null)
                }
            })
        }
    };

    // WebSocket клієнт для зв'язку з Lampac (BWA)
    var WsClient = {
        _socket: null,
        connect: function() {
            var e = this,
                t = Lampa.Storage.get("online_bwa_server", "wss://rc.bwa.to");
            this._socket = new WebSocket(t),
            this._socket.onopen = function() {
                console.log("BWA Connected");
                var t = {
                    type: "auth",
                    uid: Lampa.Storage.get("user_uid"),
                    email: Lampa.Storage.get("account_email")
                };
                e._socket.send(JSON.stringify(t))
            },
            this._socket.onmessage = function(e) {
                var t = JSON.parse(e.data);
                Lampa.Events.emit("bwa_message", t)
            }
        }
    };

    // Ініціалізація інтерфейсу плагіна
    function init() {
        // Додавання налаштувань у меню Lampa
        Lampa.Settings.listener.follow("open", (function(e) {
            if ("online" == e.name) {
                var t = e.body.find(".settings-list");
                r.forEach((function(e) {
                    var n = Lampa.Template.get("settings_field", {
                        name: "online_source_" + e.name,
                        title: e.title,
                        descr: "Увімкнути джерело " + e.title
                    });
                    t.append(n)
                }))
            }
        }));

        // Кнопка "Онлайн" у картці фільму
        Lampa.Listener.follow("full", (function(e) {
            if ("complite" == e.type) {
                var t = Lampa.Template.get("button_online", { title: "Онлайн" });
                t.on("hover:enter", (function() {
                    // Логіка відкриття списку джерел
                    console.log("Пошук онлайн для:", e.data.movie.title);
                })), e.container.find(".full-start__buttons").append(t)
            }
        }))
    }

    // Запуск плагіна після завантаження Lampa
    if (window.appready) init();
    else Lampa.Events.follow("app:ready", init);

    // Додавання стилів
    var style = "<style>\n" +
        ".connect-broken { padding: 2em; text-align: center; }\n" +
        ".connect-broken__title { font-size: 1.5em; margin-bottom: 1em; }\n" +
        ".connect-broken__footer { display: flex; justify-content: center; margin-top: 2em; }\n" +
        ".modal-qr { display: flex; align-items: center; }\n" +
        ".modal-qr__left { width: 33%; flex-shrink: 0; }\n" +
        ".modal-qr__right { padding-left: 2em; }\n" +
        "</style>";
    $("body").append(style);

}();
