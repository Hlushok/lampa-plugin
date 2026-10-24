# Nova appearance verification plan

**Goal:** Verify and repair the six approved appearance modes with the current public Lampa runtime.
**Architecture:** Exercise the generated plugin in a real browser with Lampa's Controller, Navigator, Keypad, Scroll, mouse mode and CSS. Keep Nova Skin's original directional handlers. Adapt only layout geometry, scroll containers and overlay collections in the generator, then regenerate the public file.
**Scope:** Native, Nova, Poster, Filmstrip, Credits and Credits+; preserve their existing visual design and preference order. User has authorized verification, fixes and replacing the public plugin.

- [x] Expand the fixture to support real Native startup, remote Keypad events, three input modes and touch. Use the actual current Lampa code, not duplicate navigation rules.
- [x] Run screen cases: 360x800, 390x844, 768x1024, 844x390, 1024x600, 1280x720, 1366x768, 1920x1080, 2560x1080 and 3840x2160. Test live resize, long titles and missing artwork.
- [x] Verify real mouse clicks, wheel, touch taps/swipes, remote arrows/OK/long OK/Back, long source/season/translation/episode lists and actor return.
- [x] Reproduce every material defect before changing production code. Make a verified source backup, apply a focused fix, and keep the failing scenario as a regression check.
- [x] Run all unit, original BWA comparison, screen and input checks; inspect representative screenshots. Review the final diff independently when available.
- [ ] Commit and publish fixes only after validation. Verify automation, Pages and the downloaded public file independently.

Physical TV remotes and mobile hardware cannot be proven by browser emulation; report that distinction in the result.
