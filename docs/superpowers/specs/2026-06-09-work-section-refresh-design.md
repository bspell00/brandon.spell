# Portfolio "My Work" Section Refresh — Design

**Date:** 2026-06-09
**Status:** Approved by Brandon (Approach B)

## Goal

Replace the stale 2018–2019 portfolio content in `index.html`'s `#work` section with six
current projects, upgrade the card pattern with clearer affordances, and capture fresh
media for every card. The overall page design (grid, hover overlays, motion pass) stays.

## Card lineup & layout

The grid is 5 columns: standard cards span 2, `.span-3` cards span 3. Rows alternate
3+2 / 2+3 / 3+2. All eight existing cards are removed.

| # | Project | Size | Year | Role | Links to |
|---|---------|------|------|------|----------|
| 1 | Free Chapel | wide (`span-3`) | 2017–present | UX/UI — Design & Development | https://freechapel.org |
| 2 | Shiloh Ranch | standard | 2026 | Design & Development | https://www.shilohranchga.com |
| 3 | Forward Conference | standard | 2026 | Design & Development | https://forwardconference.org |
| 4 | The Ark Church | wide (`span-3`) | 2025 | Design & Development | https://www.thearksalina.com |
| 5 | DIVINE Conference | wide (`span-3`) | 2026 | Design & Development | https://divineconference.org |
| 6 | Free Chapel College | standard | 2024 | Design & Development | https://freechapelcollege.org |

Note: divineconference**.com** is a parked squatter domain — the live site is the `.org`.

### Draft card descriptions (Brandon reviews final copy before ship)

1. **Free Chapel** — Free Chapel's entire web presence — the public site and the custom
   platform behind it — designed, built, and continuously evolved since 2017.
2. **Shiloh Ranch** — An invitation-only retreat portal for a private ministry ranch —
   custom RSVP system, admin dashboard, and event management.
3. **Forward Conference** — The 2026 site for Atlanta's annual youth conference, hosting
   over 13,000 students.
4. **The Ark Church** — A complete website for The Ark Church in Salina, KS — CMS-driven
   content, live streaming, and social integration.
5. **DIVINE Conference** — The 2026 site for Free Chapel's annual women's conference.
6. **Free Chapel College** — A recruiting and information site for Free Chapel's
   ministry college.

## Card pattern upgrades (Approach B)

- **"Visit site ↗" affordance:** small Space Mono label inside the hover overlay, styled
  as a chip/button in `$main-color`, signaling cards are clickable. On phone widths the
  overlay is always visible, so it doubles as the tap cue.
- **Year/role chips:** the year and role lines become small bordered chips instead of
  plain stacked `<p>` text. Overlay hierarchy becomes: title → chips → description →
  visit-site affordance.
- All styling lives in `sass/custom.scss` under the existing `#work` block, using
  existing brand variables. Compile with Dart Sass (`sass sass/custom.scss css/custom.css`)
  — never hand-edit `css/custom.css`.

## Media capture

- **Standard cards:** desktop screenshots via Playwright at 1440px viewport, cropped and
  optimized to match the existing card aspect, saved as `img/<project>.jpg`.
- **Wide cards** (Free Chapel, Ark Church, DIVINE): slow scroll-capture recorded as a
  looping MP4, used via `<video autoplay muted loop playsinline>` with a poster image
  fallback — replaces the old GIF approach with far smaller files.
- Brandon reviews every capture; rejects are retaken or replaced with assets he provides.

## Housekeeping

- Footer year → 2026.
- Delete old media in `img/` that is no longer referenced by any page (recoverable from
  git history).
- jQuery smooth-scroll and everything outside `#work` (hero, nav, other pages) untouched.

## Verification

1. Recompile SASS; serve locally with `python3 -m http.server`.
2. Check: all six links resolve, hover overlays work, video cards autoplay and loop,
   phone-width layout stacks correctly.
3. Brandon does a final visual pass before anything is merged to `master` — a push to
   `master` publishes the live site (GitHub Pages, www.brandonspell.com).

## Out of scope

- Full `#work` redesign (Approach C — rejected).
- Personal/side apps (budgeting, trading) — client work only.
- Jentezen Franklin mobile app — explicitly excluded.
- about/resume/contact pages.
