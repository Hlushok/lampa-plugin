'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const bridgeUrl = 'https://hlushok.github.io/lampa-plugin/nova_skin_pr.js';
const premiumPrefix = 'https://hlushok.github.io/lampa-plugin/nova_skin_premium.js?';
const allowedBody = { ready: false, tasks: 0, online: [] };
const source = fs.readFileSync(path.join(__dirname, '..', 'nova_skin_pr.js'), 'utf8');

function harness(options = {}) {
  const timers = [];
  const appended = [];
  const requests = [];
  const writes = [];
  let refreshes = 0;
  const deferred = [];
  const storageListeners = [];
  const responses = [...(options.responses || [])];
  const storage = {
    account_email: 'viewer-test',
    lampac_unic_id: 'device-test',
    ...(options.storage || {})
  };

  const rawStorage = {};
  Object.keys(storage).forEach((key) => {
    rawStorage[key] = JSON.stringify(storage[key]);
  });

  const localStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(rawStorage, key) ? rawStorage[key] : null;
    },
    setItem(key, value) {
      rawStorage[key] = String(value);
    }
  };

  const loadedScripts = options.loadedScripts === undefined
    ? ['https://lampac.example/online.js']
    : options.loadedScripts;

  const window = {
    console: { error() {} },
    location: { href: 'https://siaivo.example/' },
    Lampa: {
      Activity: {
        replace() {
          refreshes++;
        }
      },
      Plugins: {
        loaded() {
          return loadedScripts.slice();
        }
      },
      Storage: {
        get(key, fallback) {
          return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : fallback;
        },
        set(key, value) {
          writes.push([key, value]);
          storage[key] = value;
          rawStorage[key] = JSON.stringify(value);
        },
        listener: {
          follow(name, listener) {
            if (name === 'change') storageListeners.push(listener);
          }
        }
      }
    }
  };

  class FakeXMLHttpRequest {
    constructor() {
      this.headers = {};
      this.status = 0;
      this.responseText = '';
      this.timeout = 0;
    }

    open(method, url) {
      this.method = method;
      this.url = url;
    }

    setRequestHeader(name, value) {
      this.headers[name] = value;
    }

    send() {
      const response = responses.length
        ? responses.shift()
        : { status: 403, body: '' };
      requests.push({ method: this.method, url: this.url, headers: { ...this.headers } });

      if (response.defer) {
        deferred.push(() => this.deliver(response));
        return;
      }

      this.deliver(response);
    }

    deliver(response) {
      if (response.error) {
        if (typeof this.onerror === 'function') this.onerror(new Error(response.error));
        return;
      }

      this.status = response.status;
      this.responseText = typeof response.body === 'string'
        ? response.body
        : JSON.stringify(response.body);
      if (typeof this.onload === 'function') this.onload();
    }
  }

  const document = {
    currentScript: { src: options.bridgeSrc || bridgeUrl },
    scripts: (options.documentScripts || []).map((src) => ({ src })),
    createElement(tag) {
      return { tagName: String(tag).toUpperCase() };
    },
    head: {
      appendChild(node) {
        node.probeModeAtInsert = typeof window.nova_skin_probe_mode === 'function'
          ? window.nova_skin_probe_mode()
          : '';
        node.accessAtInsert = window.nova_skin_lampac_access;
        appended.push(node);
      }
    },
    documentElement: {
      appendChild(node) {
        document.head.appendChild(node);
      }
    }
  };

  function setTimeoutFake(fn) {
    timers.push(fn);
    return timers.length;
  }

  const context = {
    window,
    document,
    console: window.console,
    Date: { now: () => 1_780_000_000_000 },
    localStorage,
    XMLHttpRequest: FakeXMLHttpRequest,
    setTimeout: setTimeoutFake,
    clearTimeout() {},
    encodeURIComponent,
    decodeURIComponent
  };
  window.window = window;
  window.document = document;
  window.localStorage = localStorage;
  window.XMLHttpRequest = FakeXMLHttpRequest;
  window.setTimeout = setTimeoutFake;

  vm.runInNewContext(source, context, { filename: 'nova_skin_pr.js' });

  return {
    window,
    appended,
    requests,
    storage,
    writes,
    get refreshes() {
      return refreshes;
    },
    respondNext() {
      const response = deferred.shift();
      if (!response) throw new Error('no deferred response');
      response();
    },
    flush(limit = 200) {
      let count = 0;
      while (timers.length && count < limit) {
        count++;
        timers.shift()();
      }
      if (timers.length) throw new Error('bridge timer did not settle');
    },
    changeStorage(name, value) {
      storage[name] = value;
      rawStorage[name] = JSON.stringify(value);
      storageListeners.slice().forEach((listener) => listener({ name, value }));
    }
  };
}

test('discovers Lampac from the loaded online plugin without exposing it in the bridge URL', () => {
  const result = harness({ responses: [{ status: 200, body: allowedBody }] });
  result.flush();

  assert.equal(result.requests.length, 1);
  assert.match(result.requests[0].url, /^https:\/\/lampac\.example\/lifeevents\?/);
  assert.ok(result.requests[0].url.includes('account_email=viewer-test'));
  assert.equal(result.appended.length, 1);
  assert.match(result.appended[0].src, new RegExp('^' + premiumPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('falls back to an already inserted online script when the plugin registry is not ready', () => {
  const result = harness({
    loadedScripts: [],
    documentScripts: ['https://lampac.example/online.js?cache=1'],
    responses: [{ status: 200, body: allowedBody }]
  });
  result.flush();

  assert.equal(result.requests.length, 1);
  assert.match(result.requests[0].url, /^https:\/\/lampac\.example\/lifeevents\?/);
  assert.equal(result.appended.length, 1);
});

test('ignores a forged lampac query parameter and trusts only the loaded online plugin', () => {
  const result = harness({
    bridgeSrc: bridgeUrl + '?lampac=https%3A%2F%2Fevil.example',
    responses: [{ status: 403, body: '' }]
  });
  result.flush();

  assert.equal(result.requests.length, 1);
  assert.match(result.requests[0].url, /^https:\/\/lampac\.example\/lifeevents\?/);
  assert.ok(!result.requests[0].url.includes('evil.example'));
  assert.deepEqual(result.appended, []);
});

test('fails closed for Viewer response 403', () => {
  const result = harness({ responses: [{ status: 403, body: '' }] });
  result.flush();

  assert.equal(result.requests.length, 1);
  assert.deepEqual(result.appended, []);
});

test('fails closed when a 200 response does not match the lifeevents contract', () => {
  const result = harness({ responses: [{ status: 200, body: { ok: true } }] });
  result.flush();

  assert.deepEqual(result.appended, []);
});

test('bounds transient network retries and remains fail closed', () => {
  const result = harness({
    responses: [
      { error: 'offline' },
      { status: 503, body: '' },
      { error: 'still offline' }
    ]
  });
  result.flush();

  assert.equal(result.requests.length, 3);
  assert.deepEqual(result.appended, []);
});

test('passes the existing Lampac AES session header without putting it in the URL', () => {
  const result = harness({
    storage: { aesgcmkey: 'test-session-key' },
    responses: [{ status: 200, body: allowedBody }]
  });
  result.flush();

  assert.equal(result.requests[0].headers['X-Kit-AesGcm'], 'test-session-key');
  assert.ok(!result.requests[0].url.includes('test-session-key'));
});

test('sets external probe mode before inserting the Premium build', () => {
  const result = harness({ responses: [{ status: 200, body: allowedBody }] });
  result.flush();

  assert.equal(result.appended.length, 1);
  assert.equal(result.appended[0].probeModeAtInsert, 'external');
  assert.equal(result.appended[0].accessAtInsert, true);
});

test('applies only missing defaults and preserves the user disable switch', () => {
  const result = harness({
    responses: [{ status: 200, body: allowedBody }],
    storage: {
      nova_skin_enabled: false,
      nova_skin_probe: false
    }
  });
  result.flush();

  assert.equal(result.storage.nova_skin_enabled, false);
  assert.equal(result.storage.nova_skin_probe, false);
  assert.equal(result.storage.nova_skin_view, 'grid');
  assert.deepEqual(result.writes, [['nova_skin_view', 'grid']]);
});

test('uses Premium background probing and grid defaults for a new user', () => {
  const result = harness({ responses: [{ status: 200, body: allowedBody }] });
  result.flush();

  assert.equal(result.storage.nova_skin_probe, true);
  assert.equal(result.storage.nova_skin_view, 'grid');
});

test('rechecks access after login without requiring storage cleanup', () => {
  const result = harness({
    responses: [
      { status: 403, body: '' },
      { status: 200, body: allowedBody }
    ]
  });
  result.flush();
  assert.deepEqual(result.appended, []);

  result.changeStorage('account_email', 'premium-test');
  result.flush();

  assert.equal(result.requests.length, 2);
  assert.equal(result.appended.length, 1);
  assert.ok(result.requests[1].url.includes('account_email=premium-test'));
});

test('ignores an in-flight Viewer response when login changes the identity', () => {
  const result = harness({
    responses: [
      { defer: true, status: 403, body: '' },
      { status: 200, body: allowedBody }
    ]
  });
  assert.equal(result.requests.length, 1);

  result.changeStorage('account_email', 'premium-during-request');
  result.flush();
  assert.equal(result.requests.length, 1);

  result.respondNext();
  result.flush();

  assert.equal(result.requests.length, 2);
  assert.ok(result.requests[1].url.includes('account_email=premium-during-request'));
  assert.equal(result.window.nova_skin_lampac_access, true);
  assert.equal(result.appended.length, 1);
});

test('revokes an already loaded skin when the account loses Premium access', () => {
  const result = harness({
    responses: [
      { status: 200, body: allowedBody },
      { status: 403, body: '' }
    ]
  });
  result.flush();
  assert.equal(result.window.nova_skin_lampac_access, true);

  result.window.nova_skin = true;
  result.changeStorage('account_email', 'viewer-test');
  result.flush();

  assert.equal(result.requests.length, 2);
  assert.equal(result.window.nova_skin_lampac_access, false);
  assert.equal(result.refreshes, 1);
  assert.equal(result.appended.length, 1);
});

test('revokes access when Lampac can no longer be discovered after an account change', () => {
  const loadedScripts = ['https://lampac.example/online.js'];
  const result = harness({
    loadedScripts,
    responses: [{ status: 200, body: allowedBody }]
  });
  result.flush();
  assert.equal(result.window.nova_skin_lampac_access, true);

  result.window.nova_skin = true;
  loadedScripts.length = 0;
  result.changeStorage('account_email', 'another-account');
  result.flush();

  assert.equal(result.window.nova_skin_lampac_access, false);
  assert.equal(result.refreshes, 1);
});

test('does not request access when the Lampac host cannot be discovered', () => {
  const result = harness({ loadedScripts: [], documentScripts: [] });
  result.flush();

  assert.deepEqual(result.requests, []);
  assert.deepEqual(result.appended, []);
});

test('does not load the Premium build twice', () => {
  const result = harness({ responses: [{ status: 200, body: allowedBody }] });
  result.flush();
  result.changeStorage('account_email', 'another-premium-test');
  result.flush();

  assert.equal(result.appended.length, 1);
});
