import assert from 'node:assert/strict';
import { fixture, browser } from './nova_skin_appearance.browser.mjs';

let checks = 0;
try {
  for (const mode of ['nova', 'poster', 'filmstrip', 'credits', 'credits_plus']) {
    const page = await fixture(mode, { sourceStates: [
      { title: 'Found', source: 'found', selected: true, ghost: false },
      { title: 'Missing', source: 'missing', ghost: true },
      { title: 'Found second', source: 'found-second', ghost: false }
    ] });
    await page.evaluate(mode => {
      if (mode === 'credits_plus') novaFixture.enter('appearance:settings');
      novaFixture.enter('source');
    }, mode);
    assert.equal(await page.locator('[data-nova-src="found"] .nova-chip__dot').count(), 1, mode + ' retains confirmed-source indicator'); checks++;
    assert.equal(await page.locator('[data-nova-src="missing"]').count(), 0, mode + ' keeps unconfirmed source behind More'); checks++;
    await page.evaluate(() => novaFixture.enter('src:more'));
    const opacity = await page.locator('[data-nova-src="missing"]').evaluate(node => Number(getComputedStyle(node).opacity));
    assert.ok(opacity < .5, mode + ' dims empty source after More'); checks++;
    assert.equal(await page.locator('[data-nova-src="found"] .nova-chip__dot').count(), 1, mode + ' retains indicator after rerender'); checks++;
    await page.close();
  }
  console.log(JSON.stringify({ checks, result: 'passed' }));
} finally { await browser.close(); }
