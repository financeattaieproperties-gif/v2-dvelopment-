import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('docs/research/2026-11-24-ux-assets');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const results = [];
try {
  for (const [name, width, height, language] of [
    ['home-desktop', 1440, 1000, 'en'],
    ['home-mobile', 375, 812, 'en'],
    ['home-dari-mobile', 375, 812, 'fa'],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    // Isolate the inspection: no production requests, login, or database access.
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return route.continue();
    });
    await context.addInitScript(lang => localStorage.setItem('lang', lang), language);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle', timeout: 90000 });
    for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += height * 0.8) {
      await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(80);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    results.push({ name, width, height, language, errors, ...await page.evaluate(() => ({
      direction: document.documentElement.dir,
      h1: document.querySelector('h1')?.innerText,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      firstPropertyCardTop: document.querySelector('a[href^="/properties/"]')?.getBoundingClientRect().top,
      propertyCards: [...document.querySelectorAll('a[href^="/properties/"]')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.slice(0, 220) })),
      nestedButtonsInPropertyLinks: document.querySelectorAll('a[href^="/properties/"] button').length,
    })) });
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(out, 'browser-audit.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
