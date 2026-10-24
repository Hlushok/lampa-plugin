# BWA appearance assets

The CSS files are the original static strings from `https://bwa.ad/rc`, downloaded
on 2026-10-24, SHA256 `db60bed7f827421462a6f261021248b3a0e24f8c4826d689adbdb29842609dc8`.
Only the string-table bootstrap was decoded for inspection; the plugin was not executed.

- `base.css`: original `_0x23f6f1`, hero, episodes, pills and seasons.
- `theme.css`: original `_0x1a6485`, yellow theme.
- `lite.css`: original `_0x4e3308`, used by BWA for Credits.
- `views.css`: original `_0x25db30`, Filmstrip, Credits and Credits+.
- `gap-fallback.css`: original `_0x3a5180`, used only without flex gap support.

These declarations are kept verbatim. `bwa-styles.mjs` scopes their selectors to
the active Nova appearance, renames the animation, and isolates fixed-view and
Credits rules. The integration stylesheet resets inherited Nova rules and connects
the existing data, focus and scrolling code. No BWA provider, player or loader is run.
