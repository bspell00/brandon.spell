# Design sync notes — brandonspell.com

Project: "Brandon Spell Design System" (`projectId` in config.json).

## How this repo syncs

- **Styles-only design system.** The site is plain HTML + SASS with no React components, by the user's choice (2026-10-01: "Tokens and styles only"). `design-system/index.js` is an empty entry (`export {}`) that exists only because the converter needs an entry; it logs `[ZERO_MATCH] no component exports — treating as tokens-only DS`, which is expected.
- **The stylesheet is `design-system/brandonspell.css`** (`cfg.cssEntry`): tokens as `--bs-*` custom properties plus portable `bs-` classes. Every value is hand-copied from `sass/custom.scss`. The site's own `css/custom.css` is NOT shipped: its rules are scoped to page ids (`#work`, `#contact`) and bare elements (`header { min-height: 100vh }`), which would restyle any design.
- **Element defaults under `.bs-page` are wrapped in `:where()`** so they carry zero specificity. Without that, `.bs-page a { color: black }` beat `.bs-btn`'s white text (invisible pill) and `.bs-page p` overrode `.bs-lead`'s size. Keep any new element default inside `:where()`.
- **Fonts** load from Google Fonts via an `@import` at the top of brandonspell.css; validate prints `[FONT_REMOTE]` (informational).
- **Render check** uses the Mac's installed Chrome, not a Playwright-downloaded Chromium: install the library with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` into `.ds-sync/`, then run validate with `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. With no components there are 0 previews to render; the real visual check is the specimen below.
- **Visual check:** there are no preview cards, so verify the stylesheet by rendering a specimen page (every `bs-` class in realistic site content) that links `ds-bundle/styles.css`, at 1440px and 390px, and compare it with the live site. The specimen and its screenshot script live in `.design-sync/.cache/` (gitignored); recreate them if missing.
- Converter deps (`esbuild ts-morph @types/react react@18 react-dom@18 playwright@1.60`) are installed in `.ds-sync/`, never in the site's package.json. Build with `--node-modules .ds-sync/node_modules --entry ./design-system/index.js`.

## Known render warns

- `[DTS_REACT] @types/react not found`: irrelevant with zero components.

## Re-sync risks

- **brandonspell.css drifts from sass/custom.scss.** It is a hand-made copy. Any colour, size, spacing or component change on the site must be mirrored there, or Claude Design keeps designing with the old look. Diff the two before every re-sync.
- **conventions.md names every class and token**; re-validate it against brandonspell.css after any CSS change (a renamed class there would silently unstyle designs).
- Display sizes are viewport units (6vw/5vw/4vw/3.5vw), copied exactly from the site; designs in narrow frames will show them small.
- Google Fonts is a network dependency at design time.
