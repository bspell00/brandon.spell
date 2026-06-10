// One-off capture tool for portfolio card media.
// Usage: node tools/capture-portfolio-media.mjs [projectKey ...]
// With no args, captures all projects.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
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

async function settle(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(4000); // let heroes/fonts/videos settle
}

async function still(browser, p) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await settle(page, p.url);
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
  await settle(page, p.url);
  // poster = top of page
  await page.screenshot({ path: `img/${p.key}-poster.jpg`, type: 'jpeg', quality: 80 });
  // slow scroll: ~8s down up to 3 viewports
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
