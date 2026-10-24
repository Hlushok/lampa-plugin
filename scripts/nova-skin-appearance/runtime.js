// LampaUA appearance adapters. Local to the generated Nova Skin IIFE.
function installNovaAppearance(css) {
  if (installNovaAppearance.api) return installNovaAppearance.api;
  var KEY = 'nova_skin_appearance';
  var ORDER = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
  var TEXT = {
    uk: { title: 'Оформлення', description: 'Вигляд картки та списку серій', names: ['Рідний', 'Нова', 'Афіша', 'Плівка', 'Титри', 'Титри+'] },
    ru: { title: 'Оформление', description: 'Вид карточки и списка серий', names: ['Родной', 'Нова', 'Афиша', 'Плёнка', 'Титры', 'Титры+'] },
    en: { title: 'Appearance', description: 'Movie details and episode layout', names: ['Native', 'Nova', 'Poster', 'Filmstrip', 'Credits', 'Credits+'] }
  };

  function valid(value) { return ORDER.indexOf(value) !== -1; }
  function current() {
    var value = get(KEY, '');
    return valid(value) ? value : (get(ENABLED_KEY, true) === false ? 'native' : 'nova');
  }
  function words() {
    var language = get('language', 'ru');
    return TEXT[language === 'ua' ? 'uk' : language] || TEXT.en;
  }
  function setting() {
    var text = words();
    var values = {};
    ORDER.forEach(function (mode, index) { values[mode] = text.names[index]; });
    return {
      component: 'nova_skin',
      param: { name: KEY, type: 'select', values: values, default: current() },
      field: { name: text.title, description: text.description },
      onChange: function (value) {
        var mode = valid(value) ? value : current();
        save(KEY, mode);
        save(ENABLED_KEY, mode !== 'native');
        try { Lampa.Activity.replace(); } catch (error) {}
      }
    };
  }

  enabled = function () {
    return window.nova_skin_lampac_access === true && current() !== 'native';
  };

  var originalSettings = settings;
  settings = function () {
    var api = Lampa.SettingsApi;
    var addParam = api.addParam;
    api.addParam = function (entry) {
      if (entry && entry.component === 'nova_skin' && entry.param && entry.param.name === ENABLED_KEY) {
        entry = setting();
      }
      return addParam.call(api, entry);
    };
    try { return originalSettings.apply(this, arguments); }
    finally { api.addParam = addParam; }
  };

  installNovaAppearance.api = { current: current, setting: setting };
  return installNovaAppearance.api;
}
