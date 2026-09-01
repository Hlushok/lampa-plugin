'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'redirect.js'), 'utf8');

function createWebStorage(values) {
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
    },
    setItem(key, value) {
      values[key] = String(value);
    },
    removeItem(key) {
      delete values[key];
    }
  };
}

function harness(options = {}) {
  const storage = options.storage || {
    location_server: 'http://lampaua.mooo.com/',
    const_redirect: true
  };
  const localValues = options.localValues || {};
  const sessionValues = options.sessionValues || {};
  const notifications = [];
  const navigations = [];
  const settings = [];
  const keypadListeners = [];
  const windowKeydownListeners = [];
  const timeouts = new Map();
  const intervals = new Map();
  let timerId = 0;
  let href = options.href || 'https://start.example/';

  const initialUrl = new URL(href);
  const location = {
    host: initialUrl.host,
    hostname: initialUrl.hostname,
    hash: initialUrl.hash,
    search: initialUrl.search,
    replace(url) {
      navigations.push(String(url));
      href = String(url);
    }
  };
  Object.defineProperty(location, 'href', {
    get() {
      return href;
    },
    set(url) {
      navigations.push(String(url));
      href = String(url);
    }
  });

  function setTimeoutFake(callback, delay) {
    const id = ++timerId;
    timeouts.set(id, { callback, delay });
    return id;
  }

  function clearTimeoutFake(id) {
    timeouts.delete(id);
  }

  function setIntervalFake(callback, delay) {
    const id = ++timerId;
    intervals.set(id, { callback, delay });
    return id;
  }

  function clearIntervalFake(id) {
    intervals.delete(id);
  }

  function jquery(selector) {
    return {
      remove() { return this; },
      append() { return this; },
      insertAfter() { return this; },
      on(events, callback) {
        this.events = events;
        this.callback = callback;
        return this;
      },
      selector
    };
  }

  const window = {
    appready: true,
    location,
    addEventListener(name, callback) {
      if (name === 'keydown') windowKeydownListeners.push(callback);
    }
  };

  const Lampa = {
    Platform: { tv() {} },
    Storage: {
      get(key, fallback) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : fallback;
      },
      field(key) {
        return storage[key];
      },
      set(key, value) {
        storage[key] = value;
      }
    },
    SettingsApi: {
      addComponent() {},
      addParam(param) {
        settings.push(param);
      }
    },
    Keypad: {
      listener: {
        follow(name, callback) {
          if (name === 'keydown') keypadListeners.push(callback);
        }
      }
    },
    Noty: {
      show(message) {
        notifications.push(message);
      }
    }
  };
  window.Lampa = Lampa;

  const context = {
    window,
    document: {
      createElement(name) {
        if (name !== 'a') return {};
        const anchor = {};
        Object.defineProperty(anchor, 'href', {
          set(value) {
            const parsed = new URL(value, href);
            anchor.host = parsed.host;
            anchor.hostname = parsed.hostname;
          }
        });
        return anchor;
      }
    },
    Lampa,
    localStorage: createWebStorage(localValues),
    sessionStorage: createWebStorage(sessionValues),
    URL,
    Date: class extends Date {
      static now() {
        return options.now === undefined ? 1_000_000 : options.now;
      }
    },
    JSON,
    console: { log() {} },
    $: jquery,
    setTimeout: setTimeoutFake,
    clearTimeout: clearTimeoutFake,
    setInterval: setIntervalFake,
    clearInterval: clearIntervalFake
  };

  vm.runInNewContext(source, context, { filename: 'redirect.js' });

  return {
    storage,
    localValues,
    sessionValues,
    notifications,
    navigations,
    settings,
    start() {
      for (const { callback } of [...intervals.values()]) callback();
    },
    runTimeout(delay) {
      for (const [id, timer] of [...timeouts.entries()]) {
        if (timer.delay === delay) {
          timeouts.delete(id);
          timer.callback();
        }
      }
    },
    pressDownEarly() {
      for (const callback of windowKeydownListeners) {
        callback({ keyCode: 40, which: 40 });
      }
    },
    setting(name) {
      return settings.find((item) => item.param && item.param.name === name);
    }
  };
}

test('persistent redirect allows two attempts and stops before the third', () => {
  const storage = {
    location_server: 'http://lampaua.mooo.com/',
    const_redirect: true
  };
  const localValues = {};
  const sessionValues = {};
  const navigations = [];

  for (let run = 0; run < 3; run++) {
    const app = harness({ storage, localValues, sessionValues });
    app.start();
    app.runTimeout(3000);
    navigations.push(...app.navigations);
  }

  assert.deepEqual(navigations, [
    'http://lampaua.mooo.com/',
    'http://lampaua.mooo.com/'
  ]);
  assert.equal(storage.const_redirect, false);
});

test('#no_redirect disables persistent redirect before a timer is scheduled', () => {
  const app = harness({ href: 'https://start.example/#no_redirect' });

  app.start();
  app.runTimeout(3000);

  assert.equal(app.storage.const_redirect, false);
  assert.deepEqual(app.navigations, []);
});

test('pressing Down before Lampa is ready cancels persistent redirect', () => {
  const app = harness();

  app.pressDownEarly();
  app.start();
  app.runTimeout(3000);

  assert.equal(app.storage.const_redirect, false);
  assert.deepEqual(app.navigations, []);
});

test('turning persistent redirect off cancels an already scheduled timer', () => {
  const app = harness();
  app.start();

  const setting = app.setting('const_redirect');
  assert.equal(typeof setting.onChange, 'function');
  setting.onChange(false);
  app.runTimeout(3000);

  assert.equal(app.storage.const_redirect, false);
  assert.deepEqual(app.navigations, []);
});

test('same hostname with another protocol is already the target server', () => {
  const localValues = {
    app_settings_redirect_guard_v1: JSON.stringify({
      target: 'lampaua.mooo.com',
      attempts: 2,
      lastAt: 1_000_000
    })
  };
  const app = harness({
    href: 'https://lampaua.mooo.com/',
    localValues
  });

  app.start();
  app.runTimeout(3000);

  assert.equal(app.storage.const_redirect, true);
  assert.deepEqual(app.navigations, []);
  assert.equal(localValues.app_settings_redirect_guard_v1, undefined);
});

test('redirect attempt counter expires after the loop window', () => {
  const storage = {
    location_server: 'http://lampaua.mooo.com/',
    const_redirect: true
  };
  const localValues = {};
  const sessionValues = {};
  const navigations = [];

  for (let run = 0; run < 2; run++) {
    const app = harness({ storage, localValues, sessionValues, now: 1_000_000 });
    app.start();
    app.runTimeout(3000);
    navigations.push(...app.navigations);
  }

  const later = harness({
    storage,
    localValues,
    sessionValues,
    now: 1_120_001
  });
  later.start();
  later.runTimeout(3000);
  navigations.push(...later.navigations);

  assert.equal(storage.const_redirect, true);
  assert.equal(navigations.length, 3);
});

test('loop stop remains armed and explains why persistent redirect was disabled', () => {
  const localValues = {
    app_settings_redirect_guard_v1: JSON.stringify({
      target: 'lampaua.mooo.com',
      attempts: 2,
      lastAt: 1_000_000
    })
  };
  const app = harness({ localValues });

  app.start();
  app.runTimeout(3000);

  assert.equal(app.storage.const_redirect, false);
  assert.deepEqual(app.navigations, []);
  assert.ok(app.notifications.some((message) => message.includes('цикл редиректів')));
  assert.equal(JSON.parse(localValues.app_settings_redirect_guard_v1).attempts, 2);
});
