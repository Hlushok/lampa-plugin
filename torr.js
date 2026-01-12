!(function () {
  "use strict";
  const e = "EasyTorrent",
    t = "1.1.0 Beta",
    n =
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>',
    r = "https://wozuelafumpzgvllcjne.supabase.co",
    o =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvenVlbGFmdW1wemd2bGxjam5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjg1MDgsImV4cCI6MjA4MjUwNDUwOH0.ODnHlq_P-1wr_D6Jwaba1mLXIVuGBnnUZsrHI8Twdug",
    s = "https://darkestclouds.github.io/plugins/easytorrent/";
  let a = [],
    i = null;

  // Оновлена конфігурація з вашими значеннями
  const l = {
    version: "2.0",
    generated: "2026-01-01T21:21:24.718Z",
    device: {
      type: "tv_4k",
      supported_hdr: ["hdr10", "hdr10plus", "dolby_vision"],
      supported_audio: ["stereo"],
    },
    network: { speed: "very_fast", stability: "stable" },
    parameter_priority: [
      "audio_track",
      "resolution",
      "availability",
      "bitrate",
      "hdr",
      "audio_quality",
    ],
    audio_track_priority: [
      "Дубляж UKR",
      "UKR НеЗупиняйПродакшн",
      "Дубляж LeDoyen"
    ],
    preferences: { min_seeds: 2, recommendation_count: 3 },
    scoring_rules: {
      weights: {
        audio_track: 100,
        resolution: 85,
        availability: 70,
        bitrate: 55,
        hdr: 40,
        audio_quality: 25,
      },
      resolution: { 480: -60, 720: -30, 1080: 17, 1440: 42.5, 2160: 85 },
      hdr: { dolby_vision: 40, hdr10plus: 32, hdr10: 32, sdr: -16 },
      bitrate_bonus: {
        thresholds: [
          { min: 0, max: 15, bonus: 0 },
          { min: 15, max: 30, bonus: 15 },
          { min: 30, max: 60, bonus: 30 },
          { min: 60, max: 999, bonus: 35 },
        ],
        weight: 0.55,
      },
      availability: { weight: 0.7, min_seeds: 2 },
      audio_quality: { weight: 0.25 },
      audio_track: { weight: 1 },
    },
  };

  let d = l;
  
  // Додана українська локалізація
  const c = {
    easytorrent_title: {
      ru: "Рекомендации торрентов",
      uk: "Рекомендації торрентів",
      en: "Torrent Recommendations",
    },
    easytorrent_desc: {
      ru: "Показывать рекомендуемые торренты на основе качества, HDR и озвучки",
      uk: "Показувати рекомендовані торренти на основі якості, HDR та озвучки",
      en: "Show recommended torrents based on quality, HDR and audio",
    },
    recommended_section_title: { ru: "Рекомендуемые", uk: "Рекомендовані", en: "Recommended" },
    show_scores: { ru: "Показывать оценки", uk: "Показувати бали", en: "Show scores" },
    show_scores_desc: {
      ru: "Отображать оценку качества торрента",
      uk: "Відображати оцінку якості торрента",
      en: "Display torrent quality score",
    },
    ideal_badge: { ru: "Идеальный", uk: "Ідеально", en: "Ideal" },
    recommended_badge: { ru: "Рекомендуется", uk: "Рекомендовано", en: "Recommended" },
    config_json: { ru: "Конфигурация (JSON)", uk: "Конфігурація (JSON)", en: "Configuration (JSON)" },
    config_json_desc: {
      ru: "Нажмите для просмотра или изменения настроек",
      uk: "Натисніть для перегляду або зміни налаштувань",
      en: "Click to view or change settings",
    },
    config_view: { ru: "Просмотреть параметры", uk: "Переглянути параметри", en: "View parameters" },
    config_edit: { ru: "Вставить JSON", uk: "Вставити JSON", en: "Paste JSON" },
    config_reset: { ru: "Сбросить к заводским", uk: "Скинути до заводських", en: "Reset to defaults" },
    config_error: {
      ru: "Ошибка: Неверный формат JSON",
      uk: "Помилка: Невірний формат JSON",
      en: "Error: Invalid JSON format",
    },
  };

  function p(e) {
    const t = Lampa.Storage.get("language", "ru");
    return (c[e] && (c[e][t] || c[e].uk || c[e].ru)) || e;
  }

  function u(e) {
    const t = "string" == typeof e ? e : JSON.stringify(e);
    Lampa.Storage.set("easytorrent_config_json", t);
    try {
      d = JSON.parse(t);
    } catch (e) {
      d = l;
    }
  }

  function m() {
    const e = d,
      t = [
        { title: "Версія конфігу", subtitle: e.version, noselect: !0 },
        {
          title: "Тип пристрою",
          subtitle: e.device.type.toUpperCase(),
          noselect: !0,
        },
        {
          title: "Підтримка HDR",
          subtitle: e.device.supported_hdr.join(", ") || "немає",
          noselect: !0,
        },
        {
          title: "Підтримка звуку",
          subtitle: e.device.supported_audio.join(", ") || "стерео",
          noselect: !0,
        },
        {
          title: "Пріоритет параметрів",
          subtitle: e.parameter_priority.join(" > "),
          noselect: !0,
        },
        {
          title: "Пріоритет озвучок",
          subtitle: `${e.audio_track_priority.length} шт. • Натисніть для перегляду`,
          action: "show_voices",
        },
        {
          title: "Мінімально сидів",
          subtitle: e.preferences.min_seeds,
          noselect: !0,
        },
        {
          title: "Кількість рекомендацій",
          subtitle: e.preferences.recommendation_count,
          noselect: !0,
        },
      ];
    Lampa.Select.show({
      title: "Поточна конфігурація",
      items: t,
      onSelect: (e) => {
        "show_voices" === e.action &&
          (function () {
            const e = d,
              t = e.audio_track_priority.map((e, t) => ({
                title: `${t + 1}. ${e}`,
                noselect: !0,
              }));
            Lampa.Select.show({
              title: "Пріоритет озвучок",
              items: t,
              onBack: () => {
                m();
              },
            });
          })();
      },
      onBack: () => {
        Lampa.Controller.toggle("settings");
      },
    });
  }

  function g(e) {
    const t = (e.Title || e.title || "").toLowerCase();
    if (e.ffprobe && Array.isArray(e.ffprobe)) {
      const t = e.ffprobe.find((e) => "video" === e.codec_type);
      if (t && t.height)
        return t.height >= 2160 || (t.width && t.width >= 3800)
          ? 2160
          : t.height >= 1440 || (t.width && t.width >= 2500)
            ? 1440
            : t.height >= 1080 || (t.width && t.width >= 1900)
              ? 1080
              : t.height >= 720 || (t.width && t.width >= 1260)
                ? 720
                : 480;
    }
    return /\b2160p\b/.test(t) || /\b4k\b/.test(t)
      ? 2160
      : /\b1440p\b/.test(t) || /\b2k\b/.test(t)
        ? 1440
        : /\b1080p\b/.test(t)
          ? 1080
          : /\b720p\b/.test(t)
            ? 720
            : null;
  }

  function f(e) {
    const t = (e.Title || e.title || "").toLowerCase(),
      n = [];
    if (e.ffprobe && Array.isArray(e.ffprobe)) {
      const t = e.ffprobe.find((e) => "video" === e.codec_type);
      if (t && t.side_data_list) {
        t.side_data_list.some(
          (e) =>
            "DOVI configuration record" === e.side_data_type ||
            "Dolby Vision RPU" === e.side_data_type,
        ) && n.push("dolby_vision");
      }
    }
    if (
      ((t.includes("hdr10+") ||
        t.includes("hdr10plus") ||
        t.includes("hdr10 plus")) &&
        (n.includes("hdr10plus") || n.push("hdr10plus")),
      (t.includes("hdr10") || /hdr-?10/.test(t)) &&
        (n.includes("hdr10") || n.push("hdr10")),
      (t.includes("dolby vision") ||
        t.includes("dovi") ||
        /\sp8\s/.test(t) ||
        /\(dv\)/.test(t) ||
        /\[dv\]/.test(t) ||
        /\sdv\s/.test(t) ||
        /,\s*dv\s/.test(t)) &&
        (n.includes("dolby_vision") || n.push("dolby_vision")),
      !(
        /\bhdr\b/.test(t) ||
        t.includes("[hdr]") ||
        t.includes("(hdr)") ||
        t.includes(", hdr")
      ) ||
        n.includes("hdr10plus") ||
        n.includes("hdr10") ||
        n.push("hdr10"),
      (t.includes("sdr") || t.includes("[sdr]") || t.includes("(sdr)")) &&
        (n.includes("sdr") || n.push("sdr")),
      0 === n.length)
    )
      return "sdr";
    const r = d.scoring_rules?.hdr || {
      dolby_vision: 40,
      hdr10plus: 32,
      hdr10: 32,
      sdr: -16,
    };
    let o = n[0],
      s = r[o] || 0;
    return (
      n.forEach((e) => {
        const t = r[e] || 0;
        t > s && ((s = t), (o = e));
      }),
      o
    );
  }

  function b(e) {
    const t = parseInt(e, 10);
    return Number.isFinite(t) ? t : null;
  }

  function h(e, t) {
    return null == e
      ? null
      : null == t || t === e
        ? { start: e, end: e }
        : { start: Math.min(e, t), end: Math.max(e, t) };
  }

  function _(e) {
    return Number.isInteger(e) && e >= 1 && e <= 60;
  }

  function y(e) {
    return Number.isInteger(e) && e >= 0 && e <= 5e3;
  }

  function v(e, t) {
    return (
      !(!Number.isInteger(e) || !Number.isInteger(t)) &&
      !(e < 1900 || e > 2100) &&
      !(t < 1900 || t > 2100) &&
      !(t < e) &&
      t - e <= 60
    );
  }

  function w(e) {
    const t = e.toLowerCase(),
      n = [
        /(?:^|[^\p{L}\p{N}])(фильм|film|movie|movies)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(спецвыпуск|special|specials|sp|ova|ona|bonus|extra|экстра|спэшл|спешл|спэшал|ова|она|спэшел)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(трейлер|trailer|teaser|тизер)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(саундтрек|ost|soundtrack)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(клип|clip|pv)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(интервью|interview)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(репортаж|report)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(промо|promo)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(отрывок|preview)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(анонс|announcement)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(съемки|making of|behind the scenes)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(сборник|collection)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(документальный|docu|documentary)(?=$|[^\p{L}\p{N}])/iu,
        /(?:^|[^\p{L}\p{N}])(концерт|concert|live)(?=$|[^\p{L}\p{N}])/iu,
        /movie\s*\d+/i,
        /film\s*\d+/i,
        /(?:^|[^\p{L}\p{N}])(мультфильм|аниме-фильм|спецэпизод|спецсерія)(?=$|[^\p{L}\p{N}])/iu,
        /\bepisode of\b/i,
      ];
    for (const e of n) if (e.test(t)) return !0;
    return !1;
  }

  function L(e, t, n) {
    if ("2x2" === String(n).toLowerCase().replace(/\s+/g, "")) return !0;
    const r = e.slice(Math.max(0, t - 12), t).toLowerCase(),
      o = e.slice(t + n.length, t + n.length + 12).toLowerCase(),
      s = /(дб|dub)\s*\(/i.test(r),
      a = /^\s*\)/.test(o);
    return s && a;
  }

  function x({
    season: e,
    seasonRange: t,
    episode: n,
    episodeRange: r,
    base: o,
    title: s,
  }) {
    if (s && w(s)) return 0;
    let a = o;
    const i = e ?? t?.start ?? null,
      l = n ?? r?.start ?? null;
    return (
      null != i && (a += 10),
      null != l && (a += 10),
      null != i && null != l && (a += 15),
      t && t.end !== t.start && (a += 5),
      r && r.end !== r.start && (a += 5),
      null == i || _(i) || (a -= 60),
      null == l || y(l) || (a -= 60),
      (d = a),
      Number.isFinite(d) ? Math.max(0, Math.min(100, Math.round(d))) : 0
    );
    var d;
  }

  function k(e) {
    const t = (function (e) {
        if (null == e) return "";
        let t = String(e);
        return (
          (t = t.replace(/[\u2012\u2013\u2014\u2212]/g, "-")),
          (t = t.replace(/х/gi, "x")),
          (t = t.replace(/\u00A0/g, " ")),
          (t = t.replace(/\s+/g, " ").trim()),
          t
        );
      })(e),
      n = (function (e) {
        const t =
          /(?:^|[^\p{L}\p{N}])(?:из|of)\s*(\d{1,4})(?=$|[^\p{L}\p{N}])/iu.exec(
            e,
          );
        if (!t) return null;
        const n = b(t[1]);
        return y(n) ? n : null;
      })(t);
    if (w(t))
      return { season: null, episode: null, source: "trash", confidence: 0 };
    const r = [],
      o = [];
    {
      const e =
        /s(\d{1,2})\s*[ex](\d{1,3})(?:\s*[-]\s*[ex]?(\d{1,3}))?\b/i.exec(t);
      if (e) {
        const t = b(e[1]),
          n = h(b(e[2]), b(e[3])),
          s = n ? n.start : null;
        (_(t) && r.push({ season: t, base: 90, name: "SxxEyy" }),
          y(s) &&
            o.push({ episode: s, episodeRange: n, base: 90, name: "SxxEyy" }));
      }
    }
    {
      const e =
        /\b(\d{1,2})\s*[-]\s*(\d{1,2})\s*x\s*(\d{1,3})(?:\s*[-]\s*(\d{1,4}))?\b/i.exec(
          t,
        );
      if (e && !L(t, e.index, e[0])) {
        const t = b(e[1]),
          n = b(e[2]),
          s = b(e[3]),
          a = b(e[4]),
          i = h(t, n),
          l = h(s, a);
        (i &&
          _(i.start) &&
          _(i.end) &&
          r.push({
            season: i.start,
            seasonRange: i.start !== i.end ? i : void 0,
            base: 92,
            name: "Srange x Erange",
          }),
          l &&
            y(l.start) &&
            y(l.end) &&
            o.push({
              episode: l.start,
              episodeRange: l.start !== l.end ? l : void 0,
              base: 92,
              name: "Srange x Erange",
            }));
      }
    }
    {
      const e = /\b(\d{1,2})\s*x\s*(\d{1,3})(?:\s*[-]\s*(\d{1,3}))?\b/i.exec(t);
      if (e)
        if (L(t, e.index, e[0]));
        else {
          const t = b(e[1]),
            n = h(b(e[2]), b(e[3])),
            s = n ? n.start : null;
          (_(t) && r.push({ season: t, base: 85, name: "xxXyy" }),
            y(s) &&
              o.push({ episode: s, episodeRange: n, base: 85, name: "xxXyy" }));
        }
    }
    {
      const e = t.matchAll(/[\[\(]([^\]\)]+)[\]\)]?/g);
      for (const t of e) {
        const e = t[1],
          n = /(\d{1,4})\s*[-]\s*(\d{1,4})/g;
        let r;
        for (; null !== (r = n.exec(e)); ) {
          const t = b(r[1]),
            n = b(r[2]);
          if (null == t || null == n || v(t, n)) continue;
          const s = e
              .slice(r.index + r[0].length, r.index + r[0].length + 12)
              .toLowerCase(),
            a = e.slice(Math.max(0, r.index - 12), r.index).toLowerCase(),
            i = /(эп|ep|из|of|tv|series|сер)/i.test(a + " " + s);
          if (!(i || Math.max(t, n) >= 50)) continue;
          const l = h(t, n),
            d = l?.start ?? null;
          o.push({
            episode: y(d) ? d : null,
            episodeRange: l && y(l.start) ? l : void 0,
            base: i ? 75 : 70,
            name: "bracket range",
          });
        }
        const s = /(?:эп|ep|сер|серия)\s*(\d{1,4})(?=$|[^\d])/i,
          a =
            /(?:^|[^\d])(\d{1,4})(?:\s*(?:из|эп|ep|сер|of|from))(?=$|[^\d])/i.exec(
              e,
            ) || s.exec(e);
        if (a) {
          const e = b(a[1]);
          y(e) && o.push({ episode: e, base: 65, name: "bracket single" });
        }
      }
    }
    {
      const e = [
        {
          re: /(?:^|[^\p{L}\p{N}])(\d{1,2})(?:\s*[-]\s*(\d{1,2}))?\s*сезон(?:а|ы|ів)?(?=$|[^\p{L}\p{N}])/iu,
          base: 75,
          name: "N сезон",
        },
        {
          re: /(?:^|[^\p{L}\p{N}])сезон(?:а|ы|и|ів)?\s*(\d{1,2})(?:\s*[-]\s*(\d{1,2}))?(?=$|[^\p{L}\p{N}])/iu,
          base: 70,
          name: "Сезон N",
        },
        {
          re: /(?:^|[^\p{L}\p{N}])сезон(?:а|ы|и|ів)?\s*:\s*(\d{1,2})(?:\s*[-]\s*(\d{1,2}))?/iu,
          base: 66,
          name: "Сезон: N",
        },
        {
          re: /\bseason\s*[: ]\s*(\d{1,2})(?:\s*[-]\s*(\d{1,2}))?\b/i,
          base: 55,
          name: "Season:",
        },
        { re: /\bseason\s*(\d{1,2})\b/i, base: 52, name: "Season N" },
        { re: /\[\s*s(\d{1,2})\s*\]/i, base: 80, name: "[Sxx]" },
        { re: /\bs(\d{1,2})\b/i, base: 50, name: "Sxx (season-only)" },
      ];
      for (const { re: n, base: o, name: s } of e) {
        const e = n.exec(t);
        if (!e) continue;
        if ("Сезон: N" === s) {
          const n = t
            .slice(e.index + e[0].length, e.index + e[0].length + 20)
            .toLowerCase();
          if (/^[\s]* (сер|series|episode|эпиз)/i.test(n)) continue;
        }
        const a = b(e[1]),
          i = b(e[2]);
        if (null == a) continue;
        const l = h(a, i);
        r.push({
          season: l?.start ?? null,
          seasonRange: l && l.end !== l.start ? l : void 0,
          base: o,
          name: s,
        });
      }
    }
    {
      const e = [
        {
          re: /(?:^|[^\p{L}\p{N}])(?:серии|серія|серії|эпизод(?:ы)?|episodes|эп\.?)\s*[: ]?\s*(\d{1,4})(?:\s*[-]\s*(\d{1,4}))?(?=$|[^\p{L}\p{N}])/iu,
          base: 60,
          name: "серии",
        },
        {
          re: /(?:^|[^\p{L}\p{N}])(\d{1,4})(?:\s*[-]\s*(\d{1,4}))?\s*(?:серии|серія|серії|эпизод(?:ы)?|эп\.?)(?=$|[^\p{L}\p{N}])/iu,
          base: 62,
          name: "1-4 серии",
        },
        {
          re: /(?:^|[^\p{L}\p{N}])(\d{1,4})\s*[-]\s*(\d{1,4})\s*серия(?=$|[^\p{L}\p{N}])/iu,
          base: 62,
          name: "1-4 серия",
        },
        {
          re: /(?:^|[^\p{L}\p{N}])(\d{1,4})\s*(?:серия|серія)(?=$|[^\p{L}\p{N}])/iu,
          base: 54,
          name: "N серия",
        },
        {
          re: /(?:серии|серії)\s*(\d{1,4})\s*из\s*(\d{1,4})/iu,
          base: 65,
          name: "серии X из Y",
        },
      ];
      for (const { re: n, base: r, name: s } of e) {
        const e = n.exec(t);
        if (!e) continue;
        const a = b(e[1]),
          i = b(e[2]);
        if (null == a) continue;
        const l = h(a, i);
        o.push({
          episode: l?.start ?? null,
          episodeRange: l && l.end !== l.start ? l : void 0,
          base: r,
          name: s,
        });
      }
    }
    const s = r.sort((e, t) => t.base - e.base)[0] || null,
      a = o.sort((e, t) => t.base - e.base)[0] || null;
    if (s || a) {
      const e = s?.season ?? null,
        r = a?.episode ?? null,
        o = s?.seasonRange,
        i = a?.episodeRange,
        l = null != e && _(e) ? e : null,
        d = null != r && y(r) ? r : null;
      return {
        season: l,
        seasonRange: o,
        episode: d,
        episodeRange: i,
        episodesTotal: n,
        episodesCount: i ? i.end - i.start + 1 : null != d ? 1 : null,
        source: [s?.name, a?.name].filter(Boolean).join(" + ") || "heuristic",
        confidence: x({
          season: l,
          seasonRange: o,
          episode: d,
          episodeRange: i,
          base: Math.max(s?.base ?? 0, a?.base ?? 0),
          title: t,
        }),
      };
    }
    return { season: null, episode: null, source: "none", confidence: 0 };
  }

  function S(e, t, n = !1, r = 1) {
    const o = e.Title || e.title || "",
      s = e.Size || e.size_bytes || 0;
    if (e.ffprobe && Array.isArray(e.ffprobe)) {
      const t = e.ffprobe.find((e) => "video" === e.codec_type);
      if (t) {
        if (t.tags && t.tags.BPS) {
          const e = parseInt(t.tags.BPS, 10);
          if (!isNaN(e) && e > 0) return Math.round(e / 1e6);
        }
        if (t.bit_rate) {
          const e = parseInt(t.bit_rate, 10);
          if (!isNaN(e) && e > 0) return Math.round(e / 1e6);
        }
      }
    }
    let a = t?.runtime || t?.duratio
