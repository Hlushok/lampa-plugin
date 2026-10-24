# Nova Skin appearance implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Preserve «Нова» and replace the boolean enable setting with six working appearance choices.
**Architecture:** A guarded generator patch embeds an ES5 runtime and scoped CSS. Runtime adapters reuse existing Nova data, cards, playback and controls, and provide layout-specific DOM and directional navigation. Generated Premium remains reproducible from immutable upstream.
**Tech Stack:** Node.js build/tests, ES5 plugin JavaScript, jQuery/Lampa, scoped CSS; real DOM checks in headless Edge using the available Playwright runtime.
**Spec:** `docs/superpowers/specs/2026-10-24-nova-appearance-design.md` (approved by user on 2026-10-24).

## Global Constraints

- Order: Рідний → Нова → Афіша → Плівка → Титри → Титри+.
- Keys: `nova_skin_appearance` = native/nova/poster/filmstrip/credits/credits_plus.
- Preserve legacy false as native; default and legacy true as nova; preserve saved valid choices.
- Preserve Premium access, native provider actions, Timeline identifiers, original Nova visuals, and generated/upstream boundaries.
- Work in the isolated `codex/nova-appearance-modes` checkout; retain the verified prechange ZIP.
- Current upstream is `ccefcc82d2be56571b33e850e77e94411d3a1f5b`.

## Review Focus

- Revoked Premium access must keep every appearance inert (Task 1 entitlement regression).
- Switching to native must restore hidden provider selectors and focus (Task 2 native restoration test).
- Selecting source/season in the drawer must not focus a hidden or stale node (Task 2 real DOM test).
- Long seasons and folder/film results must remain reachable and invoke original actions (Task 2 navigation/action tests).
- Missing artwork and narrow viewports must leave usable controls (Task 2 browser fixture checks).

### Task 1: Generator integration and preference migration — complete

**Files:** Create `scripts/nova-skin-appearance.mjs`, `scripts/nova-skin-appearance/runtime.js`, `scripts/nova-skin-appearance/styles.css`, `tests/nova_skin_appearance.test.js`; modify `scripts/build-nova-skin-premium.mjs` and baseline builder fixture.
**Interfaces:** Produces `patchAppearance(source: string): string` and embedded `installNovaAppearance(css: string)`; the latter returns its setting/current helpers for direct behavior testing and installs local Nova adapters once.

- [x] Write and run failing tests for legacy migration, setting order/persistence, entitlement, guarded anchors and duplicate application.
- [x] Implement guarded injection at `start()`, replace the old enabled setting through a scoped settings adapter, and install compatible enabled/current behavior.
- [x] Verify with `node --test tests/nova_skin_appearance.test.js tests/nova_skin_premium_build.test.js tests/nova_skin_lampac.test.js tests/nova_skin_search_reliability.test.js`. Expected: all pass.
- [x] Commit the preference/build integration.

### Task 2: Four layouts, drawer and focus — complete

**Files:** Extend appearance runtime/CSS; add real DOM fixture and browser verification under `tests/fixtures/` and `tests/`.
**Interfaces:** Consumes the installed runtime; wraps local uiFrame/buildHero/buildRows/buildCard/stamp/focus/scroll/controller functions, preserving their public behavior for `nova` and delegating actions to existing Nova handlers.

- [x] Add failing behavior checks for native restoration, each layout, drawer opening/closing/selection, long-list navigation and playback/long-press delegation.
- [x] Implement poster hero, filmstrip, text columns and thumbnail columns with a right drawer; decorate existing nodes without changing their source identities.
- [x] Implement keyboard/controller navigation, panel scrolling, back behavior, source-switch focus restoration and responsive layout.
- [x] Run Node behavior checks and real DOM Edge checks. Expected: every mode works, controls remain visible at narrow widths, original Nova structure is retained, and native selectors are restored.
- [x] Commit the layout implementation.

### Task 3: Generated candidate, verification and review — complete locally

**Files:** Regenerate `nova_skin_premium.js`; update `README.md`; save test logs and preview screenshots outside tracked production files.
**Interfaces:** Consumes the generator and runtime; produces a deterministic candidate with all existing and new tests green.

- [x] Generate from the pinned upstream into the candidate and independently regenerate into a temporary file; compare exact bytes.
- [x] Run `node --check` on generated/runtime files, full `node --test tests/*.test.js`, and real DOM checks for all modes; inspect screenshots.
- [x] Update README with appearance choices and compatibility; commit the complete candidate.
- [x] Dispatch one fresh-context whole-branch reviewer with spec, plan, diff and test evidence; address substantive findings and verify their regressions.
- [x] Deliver candidate/preview links and backup evidence; record the publication state accurately.

Verification: `docs/superpowers/reports/2026-10-24-nova-appearance-verification.md`.
