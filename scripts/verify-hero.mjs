/* Run from frontend/: HERO_URL=http://localhost:3001 HERO_BROWSER_PATH=/path/to/chromium node scripts/verify-hero.mjs
 * Optional HERO_EVIDENCE_DIR chooses the evidence directory. Uses installed Playwright only.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const serverUrl = process.env.HERO_URL || 'http://localhost:3000';
const evidenceDir = path.resolve(process.env.HERO_EVIDENCE_DIR || path.join(scriptDir, '../../_bmad-output/specs/spec-clinic-landing-hero/evidence/story-3'));
const launchOptions = { headless: true };
if (process.env.HERO_BROWSER_PATH) launchOptions.executablePath = process.env.HERO_BROWSER_PATH;
const results = [];
const reservationResults = [];

async function measure(page) {
  return page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    const heading = document.querySelector('h1');
    const colorPixels = color => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const fragments = element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].filter(rect => rect.width && rect.height).map(rect => rect.toJSON());
    };
    const rgba = color => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const pixels = [...context.getImageData(0, 0, 1, 1).data];
      return [...pixels.slice(0, 3), pixels[3] / 255];
    };
    const composite = (front, back) => front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
    const contrastSample = element => {
      const ancestors = [];
      for (let current = element; current && !current.classList.contains('hero'); current = current.parentElement) ancestors.push(current);
      let background = colorPixels(getComputedStyle(document.querySelector('.hero')).backgroundColor);
      for (const ancestor of ancestors.reverse()) background = composite(rgba(getComputedStyle(ancestor).backgroundColor), background);
      return { text: element.textContent, foreground: composite(rgba(getComputedStyle(element).color), background), background };
    };
    const labelBounds = [...document.querySelectorAll('.hero-actions a > span, .hero-trust [data-slot="card"] > span')].map(element => ({
      text: element.textContent,
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      container: element.parentElement.getBoundingClientRect().toJSON(),
      fragments: fragments(element),
    }));
    const contrastSamples = [...document.querySelectorAll('.hero-actions a > span, .hero-trust [data-slot="card"] > span')].map(contrastSample);
    const lines = {};
    for (let i = 0; i < heading.firstChild.length; i++) {
      const range = document.createRange();
      range.setStart(heading.firstChild, i);
      range.setEnd(heading.firstChild, i + 1);
      const y = range.getBoundingClientRect().y;
      lines[y] = (lines[y] || '') + heading.textContent[i];
    }
    const textBounds = [...document.querySelectorAll('.hero-copy p, .hero-copy h1')].flatMap(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].map(rect => rect.toJSON());
    });
    return {
      width: innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      h1: rect('h1'), hero: rect('.hero'), image: rect('.hero-artwork'),
      heroEyebrow: rect('.hero-eyebrow'),
      headerLogo: rect('[data-slot="site-header-desktop"] > a'),
      headingFragments: fragments(heading),
      artworkTransform: getComputedStyle(document.querySelector('.hero-artwork img')).transform,
      otherTransforms: [...document.querySelectorAll('.hero *')]
        .filter(element => !element.matches('.hero-artwork img, [data-hero-arrow]') && getComputedStyle(element).transform !== 'none')
        .map(element => element.className?.baseVal ?? element.className ?? element.tagName.toLowerCase()),
      headerTransform: getComputedStyle(document.querySelector('header')).transform,
      copy: rect('.hero-copy'), description: rect('.hero-description'),
      textBounds,
      labelBounds,
      contrastSamples,
      actions: [...document.querySelectorAll('.hero-actions a')].map(element => ({ ...element.getBoundingClientRect().toJSON(), href: element.getAttribute('href'), text: element.textContent })),
      trust: rect('.hero-trust'),
      trustCards: [...document.querySelectorAll('.hero-trust-item')].map(element => element.getBoundingClientRect().toJSON()),
      lines: Object.values(lines).map(line => line.trim()),
      currentSrc: document.querySelector('.hero img').currentSrc,
      imageLoaded: document.querySelector('.hero img').naturalWidth > 0,
      font: getComputedStyle(heading).fontFamily,
      background: getComputedStyle(document.querySelector('.hero')).backgroundColor,
      foreground: getComputedStyle(heading).color,
      foregroundPixels: colorPixels(getComputedStyle(heading).color),
      backgroundPixels: colorPixels(getComputedStyle(document.querySelector('.hero')).backgroundColor),
      mutedPixels: colorPixels(getComputedStyle(document.querySelector('.hero-description')).color),
      themeDark: document.documentElement.classList.contains('dark'),
      muted: getComputedStyle(document.querySelector('.hero-description')).color,
      headerHeight: document.querySelector('header').getBoundingClientRect().height,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      heroDirection: getComputedStyle(document.querySelector('.hero')).direction,
    };
  });
}

function assertComposition(result) {
  assert.equal(result.overflow, false, `${result.case}: overflow at ${result.width}`);
  assert.equal(result.heroDirection, result.lang === 'ar' ? 'rtl' : 'ltr', `${result.case}: locale direction`);
  assert.equal(result.artworkTransform, result.lang === 'ar' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none', `${result.case}: Arabic artwork alone is horizontally mirrored`);
  assert.deepEqual(result.otherTransforms, [], `${result.case}: non-artwork hero elements remain untransformed`);
  assert.equal(result.headerTransform, 'none', `${result.case}: header remains untransformed`);
  if (result.lang === 'ar') {
    const placement = result.width >= 1024 ? 'desktop' : 'mobile';
    assert.ok(result.headingFragments.length > 0, `${result.case}: Arabic ${placement} heading has rendered text`);
    for (const fragment of result.headingFragments) {
      assert.ok(fragment.left >= result.h1.left - 1 && fragment.right <= result.h1.right + 1,
        `${result.case}: Arabic ${placement} heading text escapes its heading box`);
    }
  }
  assert.ok(result.description.bottom <= result.hero.bottom + 1, `${result.case}: description clipped`);
  assert.deepEqual(result.actions.map(action => action.href), ['#contact', '#treatments']);
  for (const action of result.actions) {
    assert.ok(action.height >= 48, `${result.case}: action below 48px`);
    assert.ok(action.bottom <= result.hero.bottom + 1, `${result.case}: action clipped`);
  }
  for (const label of result.labelBounds) {
    const verticalOverhang = result.lang === 'ar' ? label.fontSize * 0.4 : 1;
    assert.ok(label.fragments.length > 0, `${result.case}: label has visible text: ${label.text}`);
    for (const fragment of label.fragments) {
      assert.ok(fragment.left >= label.container.left - 1 && fragment.right <= label.container.right + 1 && fragment.top >= label.container.top - verticalOverhang && fragment.bottom <= label.container.bottom + verticalOverhang,
        `${result.case}: text escapes its link/Card: ${label.text}`);
    }
  }
  if (result.width < 1024) {
    assert.ok(result.actions[1].top >= result.actions[0].bottom, `${result.case}: actions should stack`);
    assert.ok(Math.abs(result.actions[0].width - result.actions[1].width) < 1, 'mobile links equally full width');
    assert.ok(result.trustCards[0].left >= result.trust.left && result.trustCards[0].right <= result.trust.right, 'first card fits inside the trust row');
    assert.ok(result.trustCards[1].left < result.trust.right && result.trustCards[1].right > result.trust.left, 'second card intersects the trust row');
  }
  if (result.width >= 1024) {
    const alignmentOffset = result.lang === 'ar'
      ? Math.abs(result.heroEyebrow.right - result.headerLogo.right)
      : Math.abs(result.heroEyebrow.left - result.headerLogo.left);
    assert.ok(alignmentOffset <= 1, `${result.case}: header logo and hero copy share the same container gutter`);
    // The supplied desktop profile begins around 60% of the artwork width.
    // Check actual rendered text fragments, so a region can exist without masking overlap.
    const arabic = result.lang === 'ar';
    const boundary = result.image.left + result.image.width * (arabic ? 0.42 : 0.60);
    for (const rect of [...result.textBounds, ...result.actions, ...result.trustCards]) {
      assert.ok(arabic ? rect.left >= boundary : rect.right <= boundary, `${result.case}: text overlaps portrait`);
    }
  }
}

function assertContrast(foreground, background, label) {
  const luminance = pixels => pixels.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const front = luminance(foreground);
  const back = luminance(background);
  const ratio = (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
  assert.ok(ratio >= 4.5, `${label}: contrast ${ratio.toFixed(2)}:1 below 4.5:1`);
}

function assertPalette(result) {
  assert.equal(result.background, 'rgb(248, 250, 248)', JSON.stringify({ case: result.case, ...result }));
  assert.equal(result.foreground, 'rgb(11, 19, 43)');
  for (const pixels of [result.foregroundPixels, result.mutedPixels]) {
    assertContrast(pixels, result.backgroundPixels, 'hero text on its stable light surface');
  }
  for (const sample of result.contrastSamples) assertContrast(sample.foreground, sample.background, `${result.case}: ${sample.text}`);
  if (result.dark !== undefined) assert.equal(result.themeDark, result.dark, 'requested theme active');
}

async function open(browser, width, { locale = 'en', dark = false, zoom = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: zoom ? Math.round(width / 2) : width, height: zoom ? 512 : 1024 },
    deviceScaleFactor: zoom ? 2 : 1,
  });
  await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: serverUrl }]);
  if (dark) await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('dark')));
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  return { context, page };
}

async function load(page) {
  await page.goto(serverUrl);
  await page.evaluate(() => document.fonts.ready);
}

async function capture(page, name, extra = {}) {
  const result = { case: name, ...await measure(page), ...extra };
  assertComposition(result);
  assertPalette(result);
  // Exercise settled hover fills as well as normal text colors in every captured shell.
  result.hoverContrastSamples = [];
  for (const index of [0, 1]) {
    await page.locator('.hero-actions a').nth(index).hover();
    await page.waitForTimeout(250);
    const sample = (await measure(page)).contrastSamples[index];
    assertContrast(sample.foreground, sample.background, `${name}: hovered ${sample.text}`);
    result.hoverContrastSamples.push(sample);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  results.push(result);
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: name.includes('expanded') || name.includes('zoom') || name.includes('text-size') });
  return result;
}

async function run() {
  fs.mkdirSync(evidenceDir, { recursive: true });
  const browser = await chromium.launch(launchOptions);
  try {
    for (const locale of ['en', 'ar']) for (const width of [360, 390, 572, 768, 1024, 1440, 1986]) {
      const { context, page } = await open(browser, width, { locale });
      const requests = [];
      page.on('request', request => { if (request.url().includes('hero-section')) requests.push(request.url()); });
      await load(page);
      const result = await capture(page, `${locale}-${width}`, { requests });
      if (locale === 'ar') assert.ok(await page.locator('h1').isVisible(), `${locale}-${width}: Arabic heading is visible`);
      assert.equal(requests.length, 1, 'exactly one matching artwork request');
      assert.ok(requests[0].includes(width >= 1024 ? 'desktop' : 'mobile'));
      assert.ok(result.currentSrc.includes(width >= 1024 ? 'desktop' : 'mobile'));
      assert.ok(result.imageLoaded, 'artwork loaded');
      if (locale === 'en' && width === 572) assert.deepEqual(result.lines, ['Natural, Functional', 'Rhinoplasty and', 'ENT Care']);
      if (locale === 'en' && width === 1986) assert.deepEqual(result.lines, ['Natural, Functional', 'Rhinoplasty and ENT Care']);
      // Native overflow scrolling stays local and supports arrow keys without JS state.
      if (width < 1024) {
        const row = page.locator('.hero-trust');
        await row.focus();
        await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
        await page.waitForTimeout(250);
        assert.ok(await row.evaluate(element => getComputedStyle(element).direction === 'rtl' ? element.scrollLeft < 0 : element.scrollLeft > 0), 'directional key scrolls trust row');
        for (let attempt = 0; attempt < 60; attempt++) {
          const reachedLast = await row.evaluate(element => {
          const last = [...element.querySelectorAll('.hero-trust-item')].at(-1).getBoundingClientRect();
            const bounds = element.getBoundingClientRect();
            return last.right <= bounds.right + 1;
          });
          if (reachedLast) break;
          await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
          await page.waitForTimeout(100);
        }
        const last = await page.locator('.hero-trust-item').last().boundingBox();
        const bounds = await row.boundingBox();
        assert.ok(last.x + last.width <= bounds.x + bounds.width + 1, 'last trust card reachable through arrow keys');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'keyboard scrolling stays local');
        await row.evaluate(element => element.scrollLeft = 0);
      }
      for (const href of ['#contact', '#treatments']) {
        const action = page.locator(`.hero-actions a[href="${href}"]`);
        await action.focus();
        assert.ok(await action.evaluate(element => getComputedStyle(element).boxShadow !== 'none'), 'visible action focus ring');
        await page.keyboard.press('Enter');
        await page.waitForFunction(id => location.hash === id && document.querySelector(id).getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().height - 1 && document.querySelector(id).getBoundingClientRect().top < innerHeight, href);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await context.close();
    }

    {
      const { context, page } = await open(browser, 390);
      await load(page);
      const trigger = page.getByRole('button', { name: 'Open navigation menu' });
      const sheet = page.locator('[data-slot="sheet-content"]');
      await trigger.click();
      await sheet.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await sheet.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.matches('[data-slot="mobile-nav-trigger"]'));
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true, 'Escape restores focus to the mobile menu trigger');

      await trigger.click();
      await sheet.waitFor({ state: 'visible' });
      await page.locator('[data-slot="mobile-nav"] a[href="#treatments"]').click();
      await sheet.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => location.hash === '#treatments' && document.querySelector('#treatments').getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().height - 1 && document.querySelector('#treatments').getBoundingClientRect().top < innerHeight);
      assert.equal(await page.locator('#treatments').evaluate(element => element.getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().height - 1), true, 'mobile menu anchor clears the fixed header');
      results.push({ case: 'mobile-menu-escape-anchor', focusRestored: true, menuClosedAfterAnchor: true, anchor: '#treatments' });
      await context.close();
    }

    for (const width of [390, 1440]) {
      for (const locale of ['en', 'ar']) {
        for (const dark of [false, true]) {
          if (locale === 'en' && !dark) continue;
          const { context, page } = await open(browser, width, { locale, dark });
          await load(page);
          await capture(page, `${dark ? 'dark-' : ''}${locale === 'ar' ? 'ar-shell' : 'en'}-${width}`, { dark });
          await context.close();
        }
      }
    }

    {
      const { context, page } = await open(browser, 572);
      await page.route('**/*hero-section*', route => route.abort());
      await load(page);
      const result = await capture(page, 'image-unavailable');
      assert.equal(result.imageLoaded, false);
      assert.ok(await page.locator('h1').isVisible());
      assert.ok(await page.locator('.hero-description').isVisible());
      await context.close();
    }

    {
      const { context, page } = await open(browser, 390);
      await load(page);
      await page.locator('.hero-description').evaluate(element => element.textContent = element.textContent.repeat(9));
      await page.locator('.hero-actions span, .hero-trust [data-slot="card"] > span').evaluateAll(elements => elements.forEach(element => element.textContent = element.textContent.repeat(4)));
      await capture(page, 'expanded-copy');
      await context.close();
    }

    // Reflow consequences of 200% browser zoom: halve CSS viewport, double density.
    for (const width of [390, 1440]) {
      const { context, page } = await open(browser, width, { zoom: true });
      await load(page);
      await capture(page, `zoom-200-${width}`, { physicalWidth: width, zoomEmulation: true });
      await context.close();
    }

    // Distinct accessibility stress case: retain breakpoint/viewport, double all copy font sizes.
    for (const width of [390, 1440]) {
      const { context, page } = await open(browser, width);
      await load(page);
      const before = await measure(page);
      await page.locator('.hero-copy').evaluate(element => {
        for (const child of element.querySelectorAll('p, h1, a, .hero-trust-item')) child.style.fontSize = `${parseFloat(getComputedStyle(child).fontSize) * 2}px`;
      });
      const after = await capture(page, `text-size-200-${width}`);
      assert.deepEqual(after.image, before.image, 'text growth must not resize artwork');
      await context.close();
    }

    for (const width of [572, 1986]) {
      const { context, page } = await open(browser, width);
      await load(page); // Warm fonts before independently delaying the image.
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/*hero-section*', async route => { await gate; await route.continue(); });
      await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });
      const before = await measure(page);
      release();
      await page.waitForFunction(() => document.querySelector('.hero img').complete && document.querySelector('.hero img').naturalWidth > 0);
      const after = await measure(page);
      for (const key of ['hero', 'h1', 'image']) assert.deepEqual(after[key], before[key], `image shifted ${key}`);
      reservationResults.push({ width, before, after, imageInducedGeometryShift: false });
      await context.close();
    }

    {
      const { context, page } = await open(browser, 1440);
      await load(page);
      const englishHeading = await page.locator('.hero-heading').textContent();
      await page.getByRole('button', { name: /Change language/ }).click();
      await page.locator('[data-lang="ar"]').click();
      await page.waitForFunction(() => document.documentElement.lang === 'ar');
      assert.notEqual(await page.locator('.hero-heading').textContent(), englishHeading, 'hero heading updates when the locale changes');
      assert.equal(await page.locator('.hero-heading').textContent(), 'جراحة أنف بنتائج طبيعية ورعاية متخصصة', 'live hero heading matches the Arabic message');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
      assert.equal((await context.cookies()).find(cookie => cookie.name === 'NEXT_LOCALE')?.value, 'ar');
      assert.equal(new URL(page.url()).pathname, '/');
      await page.getByRole('main').getByRole('link', { name: 'العلاجات', exact: true }).click();
      await page.waitForFunction(() => Math.abs(document.querySelector('#treatments').getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().height) < 1);
      const result = await measure(page);
      assertComposition({ case: 'locale-switch', ...result });
      results.push({ case: 'locale-anchor', url: page.url(), lang: result.lang, localeCookie: 'ar', anchorTop: await page.locator('#treatments').evaluate(element => element.getBoundingClientRect().top), headerHeight: result.headerHeight });
      await context.close();
    }

    fs.writeFileSync(path.join(evidenceDir, 'browser-results.json'), JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'image-reservation.json'), JSON.stringify(reservationResults, null, 2));
    console.log(`Hero checks passed: ${results.length} cases plus ${reservationResults.length} delayed-image checks. Evidence: ${evidenceDir}`);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
