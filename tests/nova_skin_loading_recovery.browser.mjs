import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fixture, browser, browserErrors, args } from './nova_skin_appearance.browser.mjs';

const modes = ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
const sourceStates = [
  { title: 'Поточне', source: 'current', selected: true, ghost: true },
  { title: 'Без результату', source: 'empty', ghost: true },
  { title: 'Невідоме', source: 'unknown' },
  { title: 'Доступне', source: 'confirmed', ghost: false },
  { title: 'Ще одне', source: 'extra', ghost: false }
];
let checks = 0;

try {
  for (const mode of modes) {
    for (const terminal of ['results', 'timeout', 'manual-remote', 'manual-click', 'late-status']) {
      const page = await fixture(mode, { film: true, count: 2, nativeFilter: true,
        sourceStates: terminal === 'late-status' ? sourceStates.slice(0, 3) : sourceStates,
        input: terminal === 'manual-click' ? 'mouse_pc' : 'remote', nativeKeypad: true },
        terminal === 'late-status' ? 390 : 1366, 768);
      try {
        await page.evaluate(() => {
          const results = window.jQuery('.native-results');
          window.stagedCards = results.find('.online-prestige--full').detach();
          results.append('<div class="online-empty stale-scan"><div class="broadcast__scan">Опитування джерел</div></div>');
          novaFixture.showLoading();
          novaFixture.sourceDraw();
        });
        assert.equal(await page.locator('.nova-loading:visible').count(), 1, `${mode} shows loading initially`);
        const action = page.locator('[data-nova-focus="loading:next"]');
        if (terminal === 'late-status') {
          assert.equal(await action.count(), 0, `${mode} does not offer a switch without a confirmed alternative`);
          await page.evaluate(list => novaFixture.updateSources(list), sourceStates);
        }
        assert.match(await action.textContent({ timeout: 2000 }), /^Наступне джерело/, `${mode} offers the next confirmed source`);
        const geometry = await action.evaluate(node => ({ width: node.offsetWidth, parent: node.parentElement.clientWidth,
          height: node.offsetHeight, radius: parseFloat(getComputedStyle(node).borderRadius) }));
        assert.ok(geometry.width < geometry.parent * .82 && geometry.height >= 24 && geometry.radius > 0,
          `${mode} shows a compact, rounded control instead of a full-width strip: ${JSON.stringify(geometry)}`);
        if (terminal === 'manual-remote') await page.screenshot({ path: join(args['--output'], mode + '-next-source.png') });
        await page.evaluate(() => {
          window.stagedAction = document.querySelector('.nova-loading__next');
          novaFixture.sourceDraw();
        });
        assert.equal(await action.evaluate(node => node === window.stagedAction), true, 'loading redraw retains the action');
        if (terminal === 'manual-remote') {
          await page.evaluate(() => novaFixture.focus('loading:next'));
          await page.keyboard.press('Enter');
        } else if (terminal === 'manual-click') {
          await action.click();
        } else if (terminal !== 'late-status') await page.evaluate(terminal => {
          const results = window.jQuery('.native-results');
          if (terminal === 'results') results.append(stagedCards);
          else results.append('<div class="online-empty timeout-note"><div class="online-empty__title">Джерело не відповідає</div></div>');
          novaFixture.sourceDraw();
        }, terminal);
        assert.equal(await page.locator('.stale-scan').count(), 1, 'test retains the stale placeholder');
        if (terminal === 'late-status') {
          assert.equal(await action.count(), 1);
          assert.deepEqual(await page.evaluate(() => fixtureActions.filter(action => action[0] === 'filter')), []);
        } else if (terminal.startsWith('manual-')) {
          assert.equal(await page.locator('.nova-skin-root').count(), 1, `${mode} stays in Nova`);
          const selected = await page.evaluate(() => novaFixture.nativeSources().find(source => source.selected).source);
          assert.equal(selected, 'confirmed', `${mode} selects the next confirmed alternative, not a ghost or unknown`);
          assert.equal(await page.evaluate(() => fixtureActions.filter(action => action[0] === 'filter' && action[1] === 'sort').length), 1);
          assert.ok((await page.evaluate(() => fixtureActions)).every(action => action[0] !== 'replace'), 'does not change to native UI');
        } else {
          assert.equal(await page.locator('.nova-loading').count(), 0, `${mode} clears loading (${terminal})`);
          if (terminal === 'results') {
            assert.equal(await page.locator('.nova-card:visible').count(), 2, `${mode} shows the native results`);
          } else {
            assert.equal(await page.locator('.nova-skin-root').count(), 0, `${mode} relinquishes the page`);
            assert.equal(await page.locator('.timeout-note:visible').count(), 1, `${mode} reveals the native timeout`);
          }
          assert.equal(await action.count(), 0, `${mode} removes the loading action`);
        }
        assert.deepEqual(browserErrors.get(page), [], `${mode} has no browser errors`);
        assert.deepEqual(await page.evaluate(() => fixtureNetworkRequests), [], `${mode} does not send another search`);
        checks++;
      } finally { await page.close(); }
    }
  }
  console.log(`${checks} browser loading scenarios passed`);
} finally { await browser.close(); }
