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

**Five self-contained pages**, each linking the same compiled `css/custom.css` and repeating the same `#nav` block:
- `index.html` — landing header + `#work` portfolio grid (the project cards). Loads jQuery from CDN for one feature: smooth-scroll anchor jumps to `#work`.
- `services.html` — service packages with starting prices. The site stays a portfolio first: selling lives here and on `contact.html`, with only quiet links from the homepage.
- `about.html`, `resume.html`, `contact.html` — single-section pages.

**Styling is one stylesheet scoped by page ID.** All CSS lives in `sass/custom.scss`. Each page wraps its content in a div with a distinguishing id (`#work`, `#services`, `#about`, `#contact`, `#resume`), and the SCSS keys page-specific rules off that id. So to change a single page's layout, find its `#id { … }` block in `custom.scss` rather than looking for a separate file.

**Responsive design** is driven by SCSS mixins defined at the top of `custom.scss` (`phone-only`, `tablet-up`, `desktop-up`, etc.) wrapping `@media` queries. Brand variables (`$main-color`, fonts, breakpoints) are also defined there. Always edit the `.scss` and recompile — never hand-edit `css/custom.css`.

**Portfolio cards** (`index.html`) follow a fixed pattern: a `.project` div (optionally `.span-3` for a wide card) containing an `<img>`/`<video>` plus a `.overlay > .text` block that fades in on hover. To add a project, copy an existing `.project` block and drop its media into `img/`.

Fonts (Montserrat, Space Mono) load from the Google Fonts CDN in each page `<head>`.
