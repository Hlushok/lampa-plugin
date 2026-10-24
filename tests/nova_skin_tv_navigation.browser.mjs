import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fixture, browser, browserErrors, args } from './nova_skin_appearance.browser.mjs';

const output = resolve(args['--output']);
mkdirSync(output, { recursive: true });
const results = [];
const modes = ['native', 'nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
const options = { nativeController: true, nativeScroll: true, nativeKeypad: true, input: 'remote' };
const directions = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

async function scenario(name, run) {
  if (args['--only'] && !new RegExp(args['--only']).test(name)) return;
  let page;
  try {
    page = await run(value => { page = value; });
    assert.deepEqual(browserErrors.get(page), [], 'no uncaught script errors');
    results.push({ name, status: 'passed' });
  } catch (error) {
    const record = { name, status: 'failed', message: error.message };
    if (page && !page.isClosed()) {
      record.state = await page.evaluate(() => novaFixture.state()).catch(() => null);
      await page.screenshot({ path: join(output, name + '-failed.png') }).catch(() => {});
    }
    results.push(record);
    console.log('FAIL', name, error.message);
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
}

async function state(page) {
  return page.evaluate(() => {
    const controller = Lampa.Controller.enabled().name;
    if (controller !== 'content') return '@' + controller;
    const node = document.querySelector('.fixture .focus');
    if (!node) return '@no-focus';
    const key = node.getAttribute('data-nova-focus') || (node.matches('.online-prestige') ? 'native:item:' + node.getAttribute('data-index') : 'native:search');
    return (document.querySelector('.nova-layout__drawer:not(.nova-layout__drawer--closed)') ? 'drawer|' : 'main|') + key;
  });
}

async function focus(page, key) {
  await page.evaluate(key => {
    if (key.startsWith('native:')) {
      const node = key === 'native:search' ? document.querySelector('.filter--search') : document.querySelector('.online-prestige[data-index="' + key.slice(12) + '"]');
      Lampa.Controller.collectionFocus(node);
    } else novaFixture.focus(key);
  }, key);
}

async function restore(page, target) {
  await page.evaluate(() => Lampa.Controller.toggle('content'));
  const separator = target.indexOf('|');
  const pane = target.slice(0, separator), key = target.slice(separator + 1);
  const drawer = await page.locator('.nova-layout__drawer:not(.nova-layout__drawer--closed)').count();
  if (pane === 'main' && drawer) await page.keyboard.press('Escape');
  if (pane === 'drawer' && !drawer) {
    await focus(page, 'appearance:settings');
    await page.keyboard.press('Enter');
  }
  await focus(page, key);
  assert.equal(await state(page), target, 'restore graph origin ' + target);
}

function reachable(graph, initial) {
  const visited = new Set([initial]), queue = [initial];
  while (queue.length) for (const next of Object.values(graph[queue.shift()] || {})) if (!visited.has(next)) {
    visited.add(next); queue.push(next);
  }
  return visited;
}

async function buildGraph(page, mode) {
  const keys = await page.evaluate(() => Array.from(document.querySelectorAll('.fixture .scroll__body .selector')).filter(node => node.getClientRects().length && !node.closest('.nova-layout__drawer--closed')).map(node => node.getAttribute('data-nova-focus') || (node.matches('.online-prestige') ? 'native:item:' + node.getAttribute('data-index') : 'native:search')));
  const required = await page.evaluate(() => Array.from(document.querySelectorAll('.fixture .scroll__body .selector')).map(node => {
    const key = node.getAttribute('data-nova-focus');
    if (!key || key.startsWith('item:') || (!node.getClientRects().length && !node.closest('.nova-layout__drawer'))) return null;
    return (node.closest('.nova-layout__drawer') ? 'drawer|' : 'main|') + key;
  }).filter(Boolean));
  const initial = 'main|' + (keys.includes('hero') ? 'hero' : keys.find(key => key.startsWith('item:')) || keys.find(key => key.startsWith('native:item:')) || keys[0]);
  const queue = [...new Set(keys.map(key => 'main|' + key))], graph = {};
  for (let index = 0; index < queue.length; index++) {
    const target = queue[index];
    graph[target] = {};
    const moves = target.endsWith('|appearance:settings') ? { ...directions, enter: 'Enter' } : directions;
    for (const [direction, key] of Object.entries(moves)) {
      await restore(page, target);
      await page.keyboard.press(key);
      const next = await state(page);
      if (next === '@no-focus') {
        const debug = await page.evaluate(() => ({ state:novaFixture.state(), navigator:Navigator.getFocusedElement()?.getAttribute('data-nova-focus'), collection:Navigator._collection?.map(node=>node.getAttribute('data-nova-focus')), focus:Array.from(document.querySelectorAll('.focus')).map(node=>node.getAttribute('data-nova-focus')), visibleControls:Array.from(document.querySelectorAll('.nova-layout__drawer .selector')).map(node=>({key:node.getAttribute('data-nova-focus'),visible:node.offsetParent!==null})) }));
        writeFileSync(join(output,'no-focus-' + mode + '-' + target.replaceAll(/[^a-z0-9]+/gi,'-') + '-' + direction + '.json'),JSON.stringify(debug,null,2));
        assert.fail('TV ' + direction + ' from ' + target + ' must retain focus or enter a Lampa controller');
      }
      graph[target][direction] = next;
      if (!next.startsWith('@') && !queue.includes(next)) queue.push(next);
    }
    assert.ok(queue.length < 120, mode + ' graph must remain bounded');
  }
  return { initial, graph, required };
}

try {
  for (const mode of modes) await scenario('tv-graph-' + mode, async register => {
    const page = await fixture(mode, options, 1366, 768); register(page);
    const { initial, graph, required } = await buildGraph(page, mode);
    writeFileSync(join(output, 'graph-' + mode + '.json'), JSON.stringify({ initial, graph }, null, 2));
    const visit = reachable(graph, initial);
    const missing = required.filter(key => !visit.has(key));
    assert.deepEqual(missing, [], 'hero must reach all visible settings and actions');
    assert.ok(visit.has('@head'), 'TV Up path must reach the Lampa header/settings');
    assert.ok(visit.has('@menu'), 'TV Left path must reach the Lampa menu');
    const trapped = Object.keys(graph).filter(key => {
      const seen = reachable(graph, key);
      return !seen.has('@head') && !seen.has('@menu');
    });
    assert.deepEqual(trapped, [], 'every focus position has a route out to Lampa');
    return page;
  });

  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) for (const setting of ['source', 'season', 'voice', 'jump']) await scenario('tv-options-' + mode + '-' + setting, async register => {
    const page = await fixture(mode, { ...options, seasons:32, sources:32, voices:32, count:640 }, 1366,768); register(page);
    async function open() {
      await page.evaluate(() => Lampa.Controller.toggle('content'));
      if (mode === 'credits_plus' && !(await page.locator('.nova-layout__drawer:not(.nova-layout__drawer--closed)').count())) {
        await focus(page, 'appearance:settings'); await page.keyboard.press('Enter');
      }
      if (!(mode === 'poster' && setting === 'season') && await page.evaluate(() => novaFixture.state().open) !== setting) {
        await focus(page, setting); await page.keyboard.press('Enter');
      }
    }
    await open();
    if (!(mode === 'poster' && setting === 'season')) assert.equal(await page.evaluate(() => novaFixture.state().open), setting, 'OK opens the selected settings list');
    const selector = mode === 'poster' && setting === 'season' ? '.bwa-season' : '.nova-drop .nova-chip';
    const keys = await page.locator(selector).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-nova-focus')));
    assert.ok(keys.length >= (setting === 'jump' ? 10 : 32), 'long option list is present');
    await focus(page, keys[0]);
    const target = keys.at(-1), graph = {};
    // Explore actual Keypad transitions, including wrapped/grid lists, instead
    // of assuming that every appearance uses the same directional axis.
    const queue = [await state(page)];
    for (let index=0; index<queue.length && !queue.some(key => key.endsWith('|' + target)); index++) {
      const origin = queue[index]; graph[origin] = {};
      for (const [direction, key] of Object.entries(directions)) {
        await open();
        await focus(page, origin.slice(origin.indexOf('|') + 1));
        await page.keyboard.press(key);
        const next = await state(page);
        graph[origin][direction] = next;
        if (next.endsWith('|' + target)) { queue.push(next); break; }
        if (!next.startsWith('@') && keys.includes(next.slice(next.indexOf('|') + 1)) && !queue.includes(next)) queue.push(next);
      }
    }
    writeFileSync(join(output, 'options-' + mode + '-' + setting + '.json'), JSON.stringify({ target, graph }, null, 2));
    assert.ok(queue.some(key => key.endsWith('|' + target)), 'TV directions can reach final option ' + target);
    await open();
    await focus(page, target);
    const visible = await page.locator('[data-nova-focus="' + target + '"]').evaluate(node => {
      const rect=node.getBoundingClientRect(); return rect.top >=78 && rect.bottom<=innerHeight+2 && rect.left>=-2 && rect.right<=innerWidth+2;
    });
    assert.equal(visible, true, 'final focused option is inside the TV screen');
    const changesBefore = await page.evaluate(() => fixtureActions.filter(action => action[0] === 'filter').length);
    await page.keyboard.press('Enter'); await page.waitForTimeout(50);
    if (setting === 'jump') assert.equal(await page.locator('.nova-card').first().getAttribute('data-nova-focus'), target.replace('jump:', 'item:'), 'TV OK chooses the final episode range');
    else assert.equal(await page.evaluate(() => fixtureActions.filter(action => action[0] === 'filter').length), changesBefore+1, 'TV OK invokes the original provider filter');
    return page;
  });

  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) for (const kind of ['error', 'folders']) await scenario('tv-' + kind + '-' + mode, async register => {
    const page = await fixture(mode, { ...options, [kind]:true, count:3 }, 1366,768); register(page);
    const { initial, graph, required } = await buildGraph(page, mode);
    writeFileSync(join(output, 'graph-' + kind + '-' + mode + '.json'), JSON.stringify({ initial, graph }, null,2));
    const visit=reachable(graph,initial);
    assert.deepEqual(required.filter(key=>!visit.has(key)), [], 'TV can reach all ' + kind + ' recovery/settings actions');
    assert.ok(visit.has('@head'), kind + ' state still permits access to Lampa header/settings');
    assert.ok(visit.has('@menu'), kind + ' state still permits access to Lampa menu');
    return page;
  });

  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) await scenario('tv-loading-' + mode, async register => {
    const page = await fixture(mode, { ...options, loading:true },1366,768); register(page);
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.evaluate(()=>Lampa.Controller.enabled().name), 'head', 'loading must not prevent reaching the Lampa header');
    await page.evaluate(()=>Lampa.Controller.toggle('content'));
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(()=>Lampa.Controller.enabled().name), 'menu', 'loading must not prevent reaching the Lampa menu');
    return page;
  });
} finally {
  const summary = { total:results.length, passed:results.filter(result=>result.status==='passed').length, failed:results.filter(result=>result.status==='failed').length, results };
  writeFileSync(join(output,'results.json'), JSON.stringify(summary,null,2));
  console.log(JSON.stringify({ total:summary.total, passed:summary.passed, failed:summary.failed, report:join(output,'results.json') }));
  await browser.close();
}
if (results.some(result => result.status === 'failed')) process.exitCode=1;
