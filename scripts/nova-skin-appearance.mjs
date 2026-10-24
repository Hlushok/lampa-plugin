import { readFileSync } from 'node:fs';

const startAnchor = '  function start() {\n    settings();';
export const appearanceAnchors = [
  '  function start() {',
  '  function settings() {',
  "param: { name: ENABLED_KEY, type: 'trigger', default: true }"
];
export const appearanceFunctions = [
  'enabled', 'settings', 'uiFrame', 'buildHero', 'buildRows', 'buildCard',
  'stamp', 'viewMode', 'scrollTo', 'focusNode', 'bind', 'restoreFocus',
  'novaUp', 'novaDown', 'novaLeft', 'novaRight', 'hookController', 'addCSS',
  'fitToolbar', 'get', 'save', 'pickResume', 'seek', 'lockRelease',
  'refreshCollection', 'inSkin', 'sourceTitle', 'shortQuality', 'isSeen',
  'play', 'longPress', 'keyIndex', 'preselectPage', 'probeStop', 'searchRecover'
];

export function patchAppearance(source) {
  if (source.includes('function installNovaAppearance(')) {
    throw new Error('Appearance patch is already installed');
  }
  for (const anchor of [...appearanceAnchors, startAnchor]) {
    const count = source.split(anchor).length - 1;
    if (count !== 1) throw new Error(`Appearance anchor must occur exactly once; found ${count}: ${anchor}`);
  }
  for (const name of appearanceFunctions) {
    const count = [...source.matchAll(new RegExp(`\\bfunction ${name}\\s*\\(`, 'g'))].length;
    if (count !== 1) throw new Error(`Appearance function must occur exactly once; found ${count}: ${name}`);
  }
  const runtime = readFileSync(new URL('./nova-skin-appearance/runtime.js', import.meta.url), 'utf8').trimEnd();
  const css = readFileSync(new URL('./nova-skin-appearance/styles.css', import.meta.url), 'utf8').trim();
  return source.replace(startAnchor,
    runtime.split('\n').map(line => '  ' + line).join('\n') + '\n\n' +
    '  function start() {\n    installNovaAppearance(' + JSON.stringify(css) + ');\n    settings();');
}
