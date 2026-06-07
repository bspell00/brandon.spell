# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static personal portfolio website for Brandon Spell (graphic/web designer). There is no build server, package manager, framework, or test suite — it is plain HTML + compiled CSS deployed via **GitHub Pages**. `CNAME` maps the site to `www.brandonspell.com`, so a push to `master` publishes the live site.

## Build / develop

The only build step is compiling SASS to CSS. The single source file `sass/custom.scss` compiles to `css/custom.css` (with `css/custom.css.map`).

- The project was set up to build with **CodeKit 3** (the `config.codekit3` file is its project config — do not edit it by hand; it contains 64-bit integers that JS JSON parsers corrupt).
- Without CodeKit, compile with the Dart Sass CLI directly:
  ```
  sass sass/custom.scss css/custom.css            # one-off build
  sass --watch sass/custom.scss:css/custom.css    # rebuild on save
  ```
- Preview by opening the `.html` files directly, or serve the folder (e.g. `python3 -m http.server`).

There is no lint or test command.

## Architecture

**Four self-contained pages**, each linking the same compiled `css/custom.css` and repeating the same `#nav` block:
- `index.html` — landing header + `#work` portfolio grid (the project cards). Loads jQuery from CDN for one feature: smooth-scroll anchor jumps to `#work`.
- `about.html`, `resume.html`, `contact.html` — single-section pages.

**Styling is one stylesheet scoped by page ID.** All CSS lives in `sass/custom.scss`. Each page wraps its content in a div with a distinguishing id (`#work`, `#about`, `#contact`, `#resume`), and the SCSS keys page-specific rules off that id. So to change a single page's layout, find its `#id { … }` block in `custom.scss` rather than looking for a separate file.

**Responsive design** is driven by SCSS mixins defined at the top of `custom.scss` (`phone-only`, `tablet-up`, `desktop-up`, etc.) wrapping `@media` queries. Brand variables (`$main-color`, fonts, breakpoints) are also defined there. Always edit the `.scss` and recompile — never hand-edit `css/custom.css`.

**Portfolio cards** (`index.html`) follow a fixed pattern: a `.project` div (optionally `.span-3` for a wide card) containing an `<img>`/`<video>` plus a `.overlay > .text` block that fades in on hover. To add a project, copy an existing `.project` block and drop its media into `img/`.

Fonts (Montserrat, Space Mono) load from the Google Fonts CDN in each page `<head>`.
