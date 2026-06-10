# My Work Section Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the eight 2018–2019 portfolio cards in `index.html` with six current projects, freshly captured media, and an upgraded card overlay (year/role chips + "visit site ↗" affordance).

**Architecture:** This is a static GitHub Pages site — plain HTML + one SCSS file (`sass/custom.scss`) compiled to `css/custom.css` with Dart Sass. There is no test suite; verification is done by compiling, serving locally, and visually checking captures/screenshots. Media is captured from the live project sites with Playwright (stills for standard cards, scroll-recorded MP4s for wide cards, converted with ffmpeg).

**Tech Stack:** HTML, SCSS (Dart Sass 1.77), Playwright 1.60 (via npx), ffmpeg, python3 http.server for preview.

**Spec:** `docs/superpowers/specs/2026-06-09-work-section-refresh-design.md`

**Important context for the engineer:**
- Branch: `prototype/motion-pass`. There are pre-existing uncommitted changes in `index.html`, `js/main.js`, `css/custom.css`, `sass/custom.scss` (the user's motion-pass WIP). Do NOT revert or stash them — build on top. Only `git add` the specific files each commit step names.
- Never hand-edit `css/custom.css` — always edit `sass/custom.scss` and recompile.
- A push to `master` publishes the live site. Do not merge or push to `master`; all work stays on this branch.
- Existing global CSS already gives `img, video` 100% width/height + `object-fit: cover`, but `.project img { height: 300px }` (350px tablet-up) targets only `img` — Task 3 extends it to `video`.
- The `.reveal` class on each `.project` drives the scroll-reveal motion pass — keep it on every new card.

---

### Task 1: Capture card media with Playwright

**Files:**
- Create: `tools/capture-portfolio-media.mjs`
- Create (outputs): `img/freechapel.mp4`, `img/freechapel-poster.jpg`, `img/ark.mp4`, `img/ark-poster.jpg`, `img/divine26.mp4`, `img/divine26-poster.jpg`, `img/shiloh.jpg`, `img/forward26.jpg`, `img/fccollege.jpg`

- [ ] **Step 1: Ensure Playwright's Chromium is installed**

Run: `npx playwright install chromium`
Expected: completes (fast no-op if already installed).

- [ ] **Step 2: Write the capture script**

Create `tools/capture-portfolio-media.mjs`:

```js
// One-off capture tool for portfolio card media.
// Usage: node tools/capture-portfolio-media.mjs [projectKey ...]
// With no args, captures all projects.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECTS = [
  { key: 'freechapel', url: 'https://freechapel.org', video: true },
  { key: 'shiloh', url: 'https://www.shilohranchga.com', video: false },
  { key: 'forward26', url: 'https://forwardconference.org', video: false },
  { key: 'ark', url: 'https://www.thearksalina.com', video: true },
  { key: 'divine26', url: 'https://divineconference.org', video: true },
  { key: 'fccollege', url: 'https://freechapelcollege.org', video: false },
];

const VIEWPORT = { width: 1440, height: 900 };
const only = process.argv.slice(2);

async function settle(page) {
  await page.goto(page._targetUrl, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(4000); // let heroes/fonts/videos settle
}

async function still(browser, p) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  page._targetUrl = p.url;
  await settle(page);
  await page.screenshot({ path: `img/${p.key}.jpg`, type: 'jpeg', quality: 80 });
  await page.close();
  console.log(`still: img/${p.key}.jpg`);
}

async function scrollVideo(browser, p) {
  const dir = mkdtempSync(join(tmpdir(), `cap-${p.key}-`));
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir, size: VIEWPORT },
  });
  const page = await ctx.newPage();
  page._targetUrl = p.url;
  await settle(page);
  // poster = top of page
  await page.screenshot({ path: `img/${p.key}-poster.jpg`, type: 'jpeg', quality: 80 });
  // slow scroll: 8s down ~3 viewports, pause, jump back
  await page.evaluate(async () => {
    const total = Math.min(document.body.scrollHeight - innerHeight, innerHeight * 3);
    const steps = 240;
    for (let i = 1; i <= steps; i++) {
      scrollTo(0, (total * i) / steps);
      await new Promise(r => setTimeout(r, 33));
    }
  });
  await page.waitForTimeout(1000);
  await page.close();
  await ctx.close(); // flushes the webm
  const webm = readdirSync(dir).find(f => f.endsWith('.webm'));
  execSync(
    `ffmpeg -y -i "${join(dir, webm)}" -an -vf "scale=1280:-2,fps=24" ` +
    `-c:v libx264 -crf 28 -preset medium -movflags +faststart img/${p.key}.mp4`,
    { stdio: 'inherit' }
  );
  rmSync(dir, { recursive: true, force: true });
  console.log(`video: img/${p.key}.mp4 (+poster)`);
}

const browser = await chromium.launch();
for (const p of PROJECTS) {
  if (only.length && !only.includes(p.key)) continue;
  try {
    await (p.video ? scrollVideo(browser, p) : still(browser, p));
  } catch (e) {
    console.error(`FAILED ${p.key}: ${e.message}`);
    process.exitCode = 1;
  }
}
await browser.close();
```

- [ ] **Step 3: Run the capture**

Run: `node tools/capture-portfolio-media.mjs`
Expected: 3 stills, 3 MP4s + 3 posters in `img/`, no `FAILED` lines. If a site shows a cookie banner/popup ruining the capture, handle it case-by-case (e.g. `page.click` the dismiss button in the script) and re-run for just that key: `node tools/capture-portfolio-media.mjs freechapel`.

- [ ] **Step 4: Review every capture**

Open each new file in `img/` (Read tool for jpgs; `open img/<key>.mp4` for videos) and confirm: page rendered fully (no blank hero, no loading spinners), text legible, capture represents the site well. Retake any that fail.

- [ ] **Step 5: Check file sizes**

Run: `ls -lh img/freechapel.mp4 img/ark.mp4 img/divine26.mp4 img/*.jpg | awk '{print $5, $9}'`
Expected: each MP4 under ~4 MB, each JPG under ~500 KB. If an MP4 is much larger, raise CRF to 30–32 and re-run that key.

- [ ] **Step 6: Commit**

```bash
git add tools/capture-portfolio-media.mjs img/freechapel.mp4 img/freechapel-poster.jpg \
  img/ark.mp4 img/ark-poster.jpg img/divine26.mp4 img/divine26-poster.jpg \
  img/shiloh.jpg img/forward26.jpg img/fccollege.jpg
git commit -m "Add capture tool and fresh portfolio media for 6 current projects"
```

---

### Task 2: Replace the #work cards in index.html

**Files:**
- Modify: `index.html:30-129` (the `#work` div) and `index.html:134` (footer year)

- [ ] **Step 1: Replace the entire `#work` div**

Replace everything from `<div id="work">` through its closing `</div>` (currently lines 30–129) with:

```html
  <div id="work">
   <div class="container">

    <div class="project span-3 reveal">
      <a href="https://freechapel.org" target="_blank" rel="noopener">
        <video autoplay muted loop playsinline poster="img/freechapel-poster.jpg" src="img/freechapel.mp4"></video>
        <div class="overlay">
          <div class="text">
            <p class="title">Free Chapel</p>
            <div class="chips"><span class="chip">2017&ndash;present</span><span class="chip">UX/UI &mdash; Design &amp; Development</span></div>
            <p class="desc">Free Chapel's entire web presence &mdash; the public site and the custom platform behind it &mdash; designed, built, and continuously evolved since 2017.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

    <div class="project reveal">
      <a href="https://www.shilohranchga.com" target="_blank" rel="noopener">
        <img class="cover" src="img/shiloh.jpg" alt="Shiloh Ranch website">
        <div class="overlay">
          <div class="text">
            <p class="title">Shiloh Ranch</p>
            <div class="chips"><span class="chip">2026</span><span class="chip">Design &amp; Development</span></div>
            <p class="desc">An invitation-only retreat portal for a private ministry ranch &mdash; custom RSVP system, admin dashboard, and event management.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

    <div class="project reveal">
      <a href="https://forwardconference.org" target="_blank" rel="noopener">
        <img class="cover" src="img/forward26.jpg" alt="Forward Conference website">
        <div class="overlay">
          <div class="text">
            <p class="title">Forward Conference</p>
            <div class="chips"><span class="chip">2026</span><span class="chip">Design &amp; Development</span></div>
            <p class="desc">The 2026 site for Atlanta's annual youth conference, hosting over 13,000 students.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

    <div class="project span-3 reveal">
      <a href="https://www.thearksalina.com" target="_blank" rel="noopener">
        <video autoplay muted loop playsinline poster="img/ark-poster.jpg" src="img/ark.mp4"></video>
        <div class="overlay">
          <div class="text">
            <p class="title">The Ark Church</p>
            <div class="chips"><span class="chip">2025</span><span class="chip">Design &amp; Development</span></div>
            <p class="desc">A complete website for The Ark Church in Salina, KS &mdash; CMS-driven content, live streaming, and social integration.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

    <div class="project span-3 reveal">
      <a href="https://divineconference.org" target="_blank" rel="noopener">
        <video autoplay muted loop playsinline poster="img/divine26-poster.jpg" src="img/divine26.mp4"></video>
        <div class="overlay">
          <div class="text">
            <p class="title">DIVINE Conference</p>
            <div class="chips"><span class="chip">2026</span><span class="chip">Design &amp; Development</span></div>
            <p class="desc">The 2026 site for Free Chapel's annual women's conference.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

    <div class="project reveal">
      <a href="https://freechapelcollege.org" target="_blank" rel="noopener">
        <img class="cover" src="img/fccollege.jpg" alt="Free Chapel College website">
        <div class="overlay">
          <div class="text">
            <p class="title">Free Chapel College</p>
            <div class="chips"><span class="chip">2024</span><span class="chip">Design &amp; Development</span></div>
            <p class="desc">A recruiting and information site for Free Chapel's ministry college.</p>
            <span class="visit">visit site &nearr;</span>
          </div>
        </div>
      </a>
    </div>

   </div>
  </div>
```

Layout note: grid is 5 columns; the order above produces rows of 3+2 (Free Chapel + Shiloh), 2+3 (Forward + Ark), 3+2 (Divine + FC College).

- [ ] **Step 2: Update the footer year**

In the footer, change `<p>Brandon Spell  |  2025</p>` to `<p>Brandon Spell  |  2026</p>`.

- [ ] **Step 3: Sanity-check the smooth-scroll selector still works**

The inline jQuery binds `$('a[href*="#"]')` — the new card links contain no `#`, so only the nav's `#work` link is affected. No change needed; just confirm no card `href` contains `#`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Replace 2018-19 portfolio cards with 6 current projects"
```

---

### Task 3: SCSS card upgrades (chips, title, visit affordance, video sizing)

**Files:**
- Modify: `sass/custom.scss` — `.project` block (~line 216) and `.overlay .text` block (~lines 281–294)
- Output: `css/custom.css`, `css/custom.css.map` (compiled — never hand-edited)

- [ ] **Step 1: Extend the card height rule to videos**

In the `.project` block, change:

```scss
img {
    height: 300px;
    @include tablet-up {
        height: 350px;
    }
}
```

to:

```scss
img, video {
    height: 300px;
    @include tablet-up {
        height: 350px;
    }
}
```

- [ ] **Step 2: Replace the `.text` block styles**

The current `.text` block ends with a `p:nth-of-type(4)` rule that assumed four bare `<p>` tags — the new markup is title/chips/desc/visit. Replace the whole `.text { ... }` block inside `.overlay` with:

```scss
.text {
    font-weight: 600;
    padding: 0 2%;
    @include tablet-up {
        color: $white;
        padding: 0 5%;
    }
    p {
        line-height: 1.5;
    }
    .title {
        font-size: 1.2rem;
        margin-bottom: 0.75rem;
    }
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 0.75rem;
        @include tablet-up {
            justify-content: center;
        }
    }
    .chip {
        font-family: $font-alternative;
        font-size: 0.65rem;
        font-weight: 400;
        line-height: 1;
        padding: 6px 10px;
        border: 1px solid currentColor;
        border-radius: 999px;
        white-space: nowrap;
    }
    .desc {
        margin-bottom: 1rem;
    }
    .visit {
        display: inline-block;
        font-family: $font-alternative;
        font-size: 0.7rem;
        padding: 8px 14px;
        background-color: $main-color;
        color: $black;
        border-radius: 999px;
    }
}
```

Variable names verified against `custom.scss:3-7`: `$font-alternative` is Space Mono, `$main-color` is `#efd2d5`, plus `$black`/`$white`.

- [ ] **Step 3: Compile SASS**

Run: `sass sass/custom.scss css/custom.css`
Expected: exits 0, no errors; `css/custom.css` and `css/custom.css.map` updated.

- [ ] **Step 4: Commit**

```bash
git add sass/custom.scss css/custom.css css/custom.css.map
git commit -m "Style card chips and visit-site affordance; size videos like images"
```

---

### Task 4: Delete unused old media

**Files:**
- Delete: old project media in `img/` (list below)

- [ ] **Step 1: Verify nothing still references the old files**

Run:
```bash
grep -rho 'img/[A-Za-z0-9._-]*' *.html css/custom.css | sort -u
```
Expected references: `img/favicon.ico`, `img/headshot.jpg`, the 9 new capture files, and possibly `img/resume22.pdf` from a non-img-tag link — also run `grep -rn 'resume22' *.html` and keep the PDF regardless.

- [ ] **Step 2: Remove the old files**

```bash
git rm img/balram.jpg img/chapel.jpg img/divine17.mp4 img/divine18.gif img/divine18.mp4 \
  img/fc.gif img/fc.mp4 img/fcmusic_2.mp4 img/fcmusic.gif img/fcmusic.mp4 \
  img/forward17.gif img/forward17.mp4 img/forward19.gif img/forward19.mp4 \
  img/llynbh.jpg img/wilson.jpg
```

If Step 1 showed any of these still referenced, do not delete that file — fix the reference question first.

- [ ] **Step 3: Commit**

```bash
git commit -m "Remove media for retired 2018-19 portfolio pieces"
```

---

### Task 5: Verify locally

**Files:** none modified

- [ ] **Step 1: Serve the site**

Run: `python3 -m http.server 8123` (in background, from repo root)

- [ ] **Step 2: Automated render check**

Screenshot the local page with Playwright and inspect it:

```bash
npx playwright screenshot --viewport-size=1440,2400 --wait-for-timeout=6000 \
  http://localhost:8123/index.html /tmp/work-check-desktop.png
npx playwright screenshot --viewport-size=390,3000 --wait-for-timeout=6000 \
  http://localhost:8123/index.html /tmp/work-check-phone.png
```

Read both PNGs and confirm: six cards present, 3+2/2+3/3+2 row layout at desktop, cards stack at phone width, chips and visit buttons render, no broken-image icons.

- [ ] **Step 3: Link check**

```bash
for u in https://freechapel.org https://www.shilohranchga.com https://forwardconference.org \
  https://www.thearksalina.com https://divineconference.org https://freechapelcollege.org; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' -L --max-time 10 "$u")"; done
```
Expected: all `200`.

- [ ] **Step 4: Hand off to Brandon for visual review**

Stop here. Tell Brandon the site is at `http://localhost:8123` and ask him to review cards, captures, hover overlays, and phone layout before anything is merged toward `master`. Do not merge or push to `master`.
