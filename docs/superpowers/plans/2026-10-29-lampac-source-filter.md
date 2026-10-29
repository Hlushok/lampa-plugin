# Lampac source filtering implementation plan

> **For agentic workers:** Execute the scoped regression, implementation, verification and publication steps below.

**Goal:** All Premium appearances consume Lampac `checkOnlineSearch` availability, show confirmed sources first and expose the rest through «Усі джерела», without a second search.

**Architecture:** Retain the shared Nova source row. In managed external mode, use the active native Filter's `sort` entries (`ghost: false` confirms availability). React to changed native `Filter.set('sort', ...)` by refreshing only source controls. Keep the bridge's external probe guard and all presentation/input code.

**Tech stack:** Existing JavaScript generator, Node tests, Edge browser regression with current Lampa components.

**Spec:** User request in this chat, 2026-10-29.

## Constraints and review focus

- Preserve current `66e935a` indicators, all layout/CSS/accent files and remote/mouse handlers.
- Back up and verify the exact current source and public file before implementation.
- Ignore stale Nova probe cache in external mode. Do not start a provider scan or a new `/lifeevents` request from the skin.
- Preserve source order within found/unconfirmed groups; do not mutate Lampac's array or permissions.
- A selected unavailable source or an unknown mixed status is not confirmation. Plugins with no availability flags retain their normal source list.
- Late and duplicate native updates must not replace episode/hero nodes or steal focus from another controller.

## Task: shared source contract

Files: `scripts/nova-skin-search-reliability.mjs`, generated `nova_skin_premium.js`; tests `tests/nova_skin_search_reliability.test.js`, `tests/nova_skin_source_status.browser.mjs`, `tests/fixtures/nova_appearance_bridge.js`.

- [x] Trace current native online.js → Filter sort → Nova source row, and verify current main/upstream/public hashes.
- [x] Create and validate `backups/nova-before-source-filter-20261029.zip`.
- [x] Reproduce selected unavailable, unknown mixed status and late same-count updates in focused regressions.
- [x] Patch shared filtering and native status refresh, leaving layout/input code untouched.
- [x] Regenerate Premium; run unit, source browser, layout and input regression checks; independently review the diff.
- [ ] Publish authorized update and independently compare public/cache-loader files after CI and Pages finish.
