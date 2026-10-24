'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const moduleUrl = pathToFileURL(path.join(__dirname, '../scripts/nova-skin-appearance/bwa-styles.mjs')).href;

test('BWA selector isolation preserves declarations and nested media/keyframes', async () => {
  const { scopeBwaCss } = await import(moduleUrl);
  const raw = ':root{--a:#ffd400}.bwv-card,.bwv-row{padding:.35em;width:17.4em}@media(max-width:600px){.bwv-card{width:13.5em}}@keyframes bwaShine{100%{transform:translateX(100%)}}';
  assert.equal(scopeBwaCss(raw), '.nova-bwa-scope{--a:#ffd400}.nova-bwa-scope .bwv-card,.nova-bwa-scope .bwv-row{padding:.35em;width:17.4em}@media(max-width:600px){.nova-bwa-scope .bwv-card{width:13.5em}}@keyframes novaBwaShine{100%{transform:translateX(100%)}}');
});

test('original fixed-view and Credits-only rules cannot affect Nova or Poster', async () => {
  const { buildAppearanceCss } = await import(moduleUrl);
  const css = buildAppearanceCss();
  assert.ok(css.includes('.nova-bwa-fixed .scroll__body{padding:0!important;margin:0!important}'));
  assert.ok(css.includes('.nova-bwa-credits *,.nova-bwa-credits *::before,.nova-bwa-credits *::after'));
  assert.ok(css.includes('.nova-bwa-scope.nova-bwa-no-gap .bwa-hero__content>*+*{margin-top:.6em}'));
  assert.equal(css.includes(':root{'), false);
  assert.equal(css.includes('var(--bwa-'), false, 'the original yellow theme also works without CSS variables');
  assert.equal(/(^|})\.bwv[\w -]*\{/.test(css), false);
});

test('original BWA dimensions are retained for all four views', async () => {
  const { buildAppearanceCss } = await import(moduleUrl);
  const css = buildAppearanceCss();
  for (const rule of [
    '.bwa-hero{position:relative;display:block;height:23em;margin:.4em .4em 1em;',
    '.bwv--plenka{display:flex;flex-direction:column;padding:1.5em 0 0 3.9em}',
    '.bwv-col{position:absolute;left:3.1em;top:1.4em;bottom:0;width:35%;',
    '.bwv-plist{position:absolute;left:36.1em;right:2.3em;top:3.1em;bottom:2em;',
    '.bwv-prow__im{position:relative;flex:none;width:11em;height:6.15em;'
  ]) assert.ok(css.includes(rule), rule);
});
