import assert from 'node:assert/strict';
import { fixture, browser, browserErrors } from './nova_skin_appearance.browser.mjs';

const modes = ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus'];
let checks = 0;

try {
  for (const mode of modes) {
    for (const terminal of ['results', 'timeout', 'manual-remote', 'manual-click']) {
      const page = await fixture(mode, { film: true, count: 2, nativeFilter: true,
        input: terminal === 'manual-click' ? 'mouse_pc' : 'remote', nativeKeypad: true }, 1366, 768);
      try {
        await page.evaluate(() => {
          const results = window.jQuery('.native-results');
          window.stagedCards = results.find('.online-prestige--full').detach();
          results.append('<div class="online-empty stale-scan"><div class="broadcast__scan">Опитування джерел</div></div>');
          novaFixture.showLoading();
          novaFixture.sourceDraw();
        });
        assert.equal(await page.locator('.nova-loading:visible').count(), 1, `${mode} shows loading initially`);
        const action = page.locator('[data-nova-focus="loading:native"]');
        assert.equal(await action.textContent(), 'Відкрити рідний онлайн', `${mode} offers native Online immediately`);
        await page.evaluate(() => {
          window.stagedAction = document.querySelector('.nova-loading__native');
          novaFixture.sourceDraw();
        });
        assert.equal(await action.evaluate(node => node === window.stagedAction), true, 'loading redraw retains the action');
        if (terminal === 'manual-remote') {
          await page.evaluate(() => novaFixture.focus('loading:native'));
          await page.keyboard.press('Enter');
        } else if (terminal === 'manual-click') {
          await action.click();
        } else await page.evaluate(terminal => {
          const results = window.jQuery('.native-results');
          if (terminal === 'results') results.append(stagedCards);
          else results.append('<div class="online-empty timeout-note"><div class="online-empty__title">Джерело не відповідає</div></div>');
          novaFixture.sourceDraw();
        }, terminal);
        assert.equal(await page.locator('.stale-scan').count(), 1, 'test retains the stale placeholder');
        assert.equal(await page.locator('.nova-loading').count(), 0, `${mode} clears loading (${terminal})`);
        if (terminal === 'results') {
          assert.equal(await page.locator('.nova-card:visible').count(), 2, `${mode} shows the native results`);
        } else {
          assert.equal(await page.locator('.nova-skin-root').count(), 0, `${mode} relinquishes the page`);
          if (terminal === 'timeout') assert.equal(await page.locator('.timeout-note:visible').count(), 1, `${mode} reveals the native timeout`);
          else {
            assert.equal(await page.locator('.stale-scan:visible').count(), 1, `${mode} reveals native Online immediately`);
            assert.ok((await page.evaluate(() => fixtureActions)).every(action => action[0] !== 'replace'), 'does not replace the activity');
          }
        }
        assert.equal(await action.count(), 0, `${mode} removes the loading action`);
        assert.deepEqual(browserErrors.get(page), [], `${mode} has no browser errors`);
        assert.deepEqual(await page.evaluate(() => fixtureNetworkRequests), [], `${mode} does not send another search`);
        checks++;
      } finally { await page.close(); }
    }
  }
  console.log(`${checks} browser loading scenarios passed`);
} finally { await browser.close(); }
