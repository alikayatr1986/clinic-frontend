// Start Go with isolated Postgres/private storage and Next with API_BASE_URL.
// Run: BASE_URL=http://127.0.0.1:3000 node scripts/verify-gallery.mjs
// Screenshots and a redacted summary are written outside the repository.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const outputDir = process.env.GALLERY_EVIDENCE_DIR || join(tmpdir(), 'clinic-gallery-browser-evidence');
const widths = [320, 375, 390, 768, 1024, 1440, 1536];
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
let publicCount;

function safeMetric(value) {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
}

try {
  for (const locale of ['en', 'ar']) {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: baseUrl }]);
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      await page.addInitScript(() => {
        window.__galleryMetrics = { lcpMs: null, cls: 0 };
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__galleryMetrics.lcpMs = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__galleryMetrics.cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      const response = await page.goto(baseUrl, { waitUntil: 'networkidle' });
      assert.equal(response?.status(), 200, `${locale}/${width}: landing response`);
      await page.evaluate(() => document.fonts.ready);

      const api = await page.request.get(`${baseUrl}/api/v1/gallery?page=1&page_size=5`);
      assert.equal(api.status(), 200, `${locale}/${width}: same-origin gallery API`);
      assert.match(api.headers()['cache-control'] || '', /no-store/, `${locale}/${width}: API no-store`);
      const list = await api.json();
      assert.ok(Array.isArray(list.data), `${locale}/${width}: API data array`);
      if (publicCount === undefined) publicCount = list.total;
      assert.equal(list.total, publicCount, `${locale}/${width}: locale-independent membership`);

      const section = page.locator('#gallery');
      await section.waitFor();
      await page.waitForFunction(expected => {
        const element = document.querySelector('#gallery');
        return element?.getAttribute('lang') === expected &&
          !element.querySelector('[data-testid="gallery-loading"]');
      }, locale);
      const geometry = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        direction: getComputedStyle(document.querySelector('#gallery')).direction,
      }));
      assert.ok(geometry.scroll <= geometry.client + 1, `${locale}/${width}: horizontal overflow`);
      assert.equal(geometry.direction, locale === 'ar' ? 'rtl' : 'ltr');
      assert.equal(await page.locator('#gallery').count(), 1, 'one gallery anchor');
      assert.equal(await page.locator('h1').count(), 1, 'one landing h1');
      const landingMetrics = await page.evaluate(() => window.__galleryMetrics);

      const comparisons = section.locator('[data-testid="gallery-comparison"]');
      const populated = (await comparisons.count()) > 0;
      if (populated) {
        const first = comparisons.first();
        const position = await first.getAttribute('data-before-position');
        assert.ok(['left', 'right'].includes(position), 'recorded physical before side');
        const before = await first.locator('[data-testid="overlay-before"]').boundingBox();
        const after = await first.locator('[data-testid="overlay-after"]').boundingBox();
        assert.ok(before && after && (position === 'left' ? before.x < after.x : before.x > after.x),
          `${locale}/${width}: physical label order`);
        const image = first.locator('img');
        assert.ok(await image.evaluate(img => img.complete && img.naturalWidth > 0), `${locale}/${width}: media decoded`);
        assert.equal(await image.evaluate(img => getComputedStyle(img).objectFit), 'contain');
        const media = await page.request.get(new URL(await image.getAttribute('src'), baseUrl).toString());
        assert.equal(media.status(), 200, `${locale}/${width}: gated media`);
        assert.match(media.headers()['cache-control'] || '', /no-store/, `${locale}/${width}: media no-store`);
        const dots = section.getByRole('group').locator('button[aria-pressed]');
        if (await dots.count() > 1) {
          await dots.nth(1).focus();
          await page.keyboard.press('Enter');
          assert.equal(await dots.nth(1).getAttribute('aria-pressed'), 'true', 'keyboard selection');
          const box = await dots.nth(1).boundingBox();
          assert.ok(box && box.width >= 48 && box.height >= 48, 'dot touch target');
        }
        await section.getByRole('link', { name: /gallery|المعرض/i }).click();
        await page.waitForURL('**/gallery');
        assert.equal(await page.locator('[data-testid="gallery-browser"]').count(), 1);
        if (await page.locator('[data-testid="gallery-grid"] button').count()) {
          const trigger = page.locator('[data-testid="gallery-grid"] button').first();
          await trigger.focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.getByRole('dialog').count(), 1, 'lightbox opens by keyboard');
          await page.keyboard.press('Escape');
          assert.equal(await page.getByRole('dialog').count(), 0, 'lightbox closes by Escape');
          assert.ok(await trigger.evaluate(el => el === document.activeElement), 'focus restored');
        }
      } else {
        assert.equal(await section.locator('[data-testid="gallery-empty"]').count(), 1,
          `${locale}/${width}: honest empty state`);
        await page.goto(`${baseUrl}/gallery`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('[data-testid="gallery-browser"]').count(), 1);
        assert.equal(await page.locator('[data-testid="gallery-empty"]').count(), 1,
          `${locale}/${width}: gallery page empty state`);
      }

      if ([390, 1536].includes(width)) {
        await page.locator('[data-testid="gallery-browser"]').screenshot({
          path: join(outputDir, `${locale}-${width}-page.png`),
        });
        await page.goto(baseUrl, { waitUntil: 'networkidle' });
        await section.screenshot({ path: join(outputDir, `${locale}-${width}-light.png`) });
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        await section.screenshot({ path: join(outputDir, `${locale}-${width}-dark.png`) });
      }

      results.push({ locale, width, populated, lcpMs: safeMetric(landingMetrics.lcpMs), cls: safeMetric(landingMetrics.cls) });
      await context.close();
    }
  }
  const report = { publicCount, browser: 'Playwright Chromium', reducedMotion: true, results };
  await writeFile(join(outputDir, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Gallery browser verification passed: ${results.length} viewport/locale cases; public count ${publicCount}; evidence ${outputDir}`);
} finally {
  await browser.close();
}
