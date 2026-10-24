import { readFileSync } from 'node:fs';

// Keep every BWA declaration intact; only isolate selectors from the other skins.
export function scopeBwaCss(css, scope = '.nova-bwa-scope', providerScope = scope) {
  function endOf(text, start, opening, closing) {
    let depth = 1, quote = '';
    for (let at = start; at < text.length; at++) {
      const char = text[at];
      if (quote) { if (char === '\\') at++; else if (char === quote) quote = ''; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === opening) depth++;
      else if (char === closing && --depth === 0) return at;
    }
    throw new Error('Unbalanced BWA stylesheet');
  }
  function selector(value) {
    if (value.includes(':root')) return value.replace(/:root/g, scope);
    if (value.includes('.bwa-scope')) return value.replace(/\.bwa-scope/g, providerScope).replace(/body\.bwa-on/g, 'body');
    return scope + ' ' + value.replace(/body\.bwa-on\s*/g, '');
  }
  let out = '', cursor = 0;
  while (cursor < css.length) {
    const start = css.indexOf('{', cursor);
    if (start < 0) { if (css.slice(cursor).trim()) throw new Error('Unexpected BWA CSS suffix'); break; }
    const head = css.slice(cursor, start).trim();
    const end = endOf(css, start + 1, '{', '}');
    const body = css.slice(start + 1, end);
    if (/^@(?:media|supports)\b/.test(head)) out += head + '{' + scopeBwaCss(body, scope, providerScope) + '}';
    else if (/^@(?:-webkit-)?keyframes\b/.test(head)) out += head + '{' + body + '}';
    else out += head.split(/,(?![^()]*\))/).map(part => selector(part.trim())).join(',') + '{' + body + '}';
    cursor = end + 1;
  }
  return out.replace(/bwaShine/g, 'novaBwaShine');
}

export function buildAppearanceCss() {
  const read = name => readFileSync(new URL('./bwa/' + name + '.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n').trim();
  const integration = readFileSync(new URL('./styles.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n').trim();
  const active = '.nova-bwa-scope.nova-bwa-scope';
  const css = integration + '\n' + scopeBwaCss(read('base'), active, '.nova-bwa-scope') + '\n' + scopeBwaCss(read('theme'), active, '.nova-bwa-scope') + '\n' +
    scopeBwaCss(read('lite'), '.nova-bwa-credits', '.nova-bwa-credits') + '\n' +
    scopeBwaCss(read('views'), active, '.nova-bwa-fixed') + '\n' +
    scopeBwaCss(read('gap-fallback'), '.nova-bwa-scope.nova-bwa-no-gap');
  // BWA also substitutes its static theme for engines without CSS variables.
  // Resolve the same fixed yellow theme at build time for identical old/new output.
  const variables = {};
  for (const source of [read('base'), read('theme')]) {
    for (const match of source.matchAll(/:root\{([^}]*)\}/g)) {
      for (const declaration of match[1].split(';')) {
        const at = declaration.indexOf(':');
        if (at > 0) variables[declaration.slice(0, at).trim()] = declaration.slice(at + 1).replace(/!important/g, '').trim();
      }
    }
  }
  let resolved = css;
  for (let pass = 0; pass < 4; pass++) resolved = resolved.replace(/var\((--[\w-]+)\)/g, (match, key) => variables[key] || match);
  if (resolved.includes('var(--bwa-')) throw new Error('Unresolved BWA theme variable');
  return resolved;
}
