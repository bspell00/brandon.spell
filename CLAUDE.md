# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static personal portfolio website for Brandon Spell (graphic/web designer). There is no framework or test suite — it is plain HTML + compiled CSS, plus one serverless function for the contact form.

**Hosting is moving from GitHub Pages to Cloudflare Pages.** `CNAME` (GitHub Pages) maps `www.brandonspell.com` today, so a push to `master` still publishes the live site there. Cloudflare Pages (configured by `wrangler.toml`, serving the repo root) builds every pushed branch as a preview; the contact form only works on Cloudflare, because GitHub Pages can't run `functions/`. Once DNS points at Cloudflare, `CNAME` is unused.

**Contact form:** `contact.html` posts to `/api/contact`, handled by `functions/api/contact.js`, which emails the enquiry through Gmail SMTP (`worker-mailer`, port 465) and redirects back to `/contact?sent=1` or `?error=…`. Secrets `GMAIL_USER` and `GMAIL_APP_PASSWORD` (optional `CONTACT_TO`) live in the Cloudflare dashboard, or in a gitignored `.dev.vars` locally — never in the repo. Cloudflare serves pages without `.html` (`/services.html` redirects to `/services`), so canonical URLs, `og:url` and `sitemap.xml` use the extensionless form.

## Build / develop

The only build step is compiling SASS to CSS. The single source file `sass/custom.scss` compiles to `css/custom.css` (with `css/custom.css.map`).

- The project was set up to build with **CodeKit 3** (the `config.codekit3` file is its project config — do not edit it by hand; it contains 64-bit integers that JS JSON parsers corrupt).
- Without CodeKit, compile with the Dart Sass CLI directly:
  ```
  sass sass/custom.scss css/custom.css            # one-off build
  sass --watch sass/custom.scss:css/custom.css    # rebuild on save
  ```
- Preview with `npm run dev` (`wrangler pages dev` on port 8000), which also runs the contact function. Run `npm install` first. Opening the `.html` files directly or `python3 -m http.server` still works for everything except the form.

There is no lint or test command.

## Architecture

**Design: "Orange Technical"** (Nov 2026 redesign, from the Claude Design canvas "Portfolio Redesign — Orange Technical"). Light grey paper, off-white tiles with a clipped top-right corner, orange `#ff4d00` as the one accent, Geist / Martian Mono / Geist Mono from Google Fonts.

**Five self-contained pages** (`index`, `services`, `about`, `resume`, `contact`, plus `404.html`), each repeating the same `header.ot-hud.site-hud` nav (current page gets `aria-current="page"`) and `footer.site-foot`, inside `.site > .sheet > main#main`. Content is laid out as `.ot-tile` panels in `.tiles` flex rows; `.ot-tile.signal` is the orange panel, `.ot-tile.dark` the black one.

**Styling** lives in `sass/custom.scss`, plain CSS in three layers, in this order (later layers override earlier ones, so keep the order):
1. Orange Technical components (`.ot-*` classes: tiles, type scale, buttons, pills, tables, ladder bars).
2. Site layer: design tokens as CSS custom properties on `:root` (`--orange`, `--ink`, `--paper`, `--panel`, …) and the portfolio classes (`.project`, `.hl`, `.spec`, `.field`, `.choices`, `.send`).
3. Live-site additions: project videos, `.reveal` scroll-in, form status, phone tweaks.
Always edit the `.scss` and recompile — never hand-edit `css/custom.css`.

**Portfolio cards** (`index.html`): an `a.ot-tile.project` with a `<video>` (with `poster`) or `<img>`, then `.project-body` holding `.project-meta` (year + `.ot-pill.muted` category), the title, a `.why` sentence and a `visit site ↗` button. Wide cards use `flex: 2 1 560px`, narrow ones `flex: 1 1 320px`; pair one of each per `.tiles` row.

`js/main.js` adds `.is-visible` to `.reveal` elements as they scroll in (its typewriter and cursor parts are dormant: no page uses `.typewriter` or `.cursor` any more).

**Claude Design sync:** `.design-sync/` and `design-system/brandonspell.css` still describe the old blush/Montserrat look and need re-syncing to Orange Technical.
