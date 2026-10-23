// Run from frontend/: BASE_URL=http://localhost:3001 node scripts/verify-treatment-services.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import en from '../messages/en.json' with { type: 'json' };
import ar from '../messages/ar.json' with { type: 'json' };

const screenshotDir = '/tmp/treatment-services-story3';
await mkdir(screenshotDir, { recursive: true });

const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let cases = 0;

async function measure(page) {
  return page.locator('#treatments').evaluate(section => {
    const rect = element => element.getBoundingClientRect().toJSON();
    const picture = section.querySelector('picture');
    const image = picture.querySelector('img');
    const profile = section.querySelector('article');
    const intro = section.querySelector('h2').parentElement;
    const services = [...section.querySelectorAll('[data-treatment-services] li')];
    const trust = section.querySelector('[data-treatment-trust]');
    const trustItems = [...trust.querySelectorAll('li')];
    const actions = [...section.querySelectorAll('[data-treatment-actions] a')];
    const scale = element => new DOMMatrix(getComputedStyle(element).transform).a *
      (parseFloat(getComputedStyle(element).scale) || 1);
    const fragments = element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].filter(part => part.width && part.height).map(part => part.toJSON());
    };
    const luminance = color => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(value => {
        const normalized = value / 255;
        return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const background = luminance(getComputedStyle(trust).backgroundColor);
    const contrast = element => {
      const foreground = luminance(getComputedStyle(element).color);
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    };
    return {
      trust: rect(trust),
      trustInteractive: trust.querySelectorAll('a, button, [tabindex]').length,
      trustItems: trustItems.map(element => ({
        bounds: rect(element), icon: rect(element.querySelector('svg')),
        textBounds: rect(element.querySelector('h3').parentElement),
        titleBounds: rect(element.querySelector('h3')), descriptionBounds: rect(element.querySelector('p')),
        title: element.querySelector('h3').textContent, description: element.querySelector('p').textContent,
        mirror: scale(element.querySelector('svg')),
        hidden: element.querySelector('svg').getAttribute('aria-hidden'),
        iconClass: element.querySelector('svg').getAttribute('class'),
        borderTop: parseFloat(getComputedStyle(element).borderTopWidth),
        borderStart: parseFloat(getComputedStyle(element).borderInlineStartWidth),
        alignment: getComputedStyle(element).direction,
        font: getComputedStyle(element.querySelector('h3')).fontFamily,
        textContrast: [...element.querySelectorAll('h3, p')].map(contrast),
        iconContrast: contrast(element.querySelector('svg')),
      })),
      section: rect(section), picture: rect(picture), profile: rect(profile), intro: rect(intro),
      width: innerWidth, scrollWidth: section.scrollWidth, clientWidth: section.clientWidth,
      currentSrc: image.currentSrc, loaded: image.complete && image.naturalWidth > 0,
      // Individual transforms may be represented by the modern CSS scale property.
      mirror: new DOMMatrix(getComputedStyle(image).transform).a *
        (parseFloat(getComputedStyle(image).scale) || 1),
      lang: section.lang, direction: getComputedStyle(section).direction,
      services: services.map(element => ({
        bounds: rect(element),
        iconBounds: rect(element.querySelector('img')),
        textBounds: rect(element.querySelector('h3').parentElement),
        loaded: element.querySelector('img').complete && element.querySelector('img').naturalWidth > 0,
        source: element.querySelector('img').currentSrc,
        mirror: scale(element.querySelector('img')),
      })),
      actions: actions.map(element => ({ bounds: rect(element), href: element.getAttribute('href'), mirror: scale(element.querySelector('svg')) })),
      text: [...section.querySelectorAll('h2, h3, p, a span')].map(element => ({
        bounds: rect(element.closest('li') ? element.parentElement : element.closest('article, a') || intro),
        cardBounds: element.closest('li') ? rect(element.closest('li')) : null,
        blockBounds: rect(element),
        lineHeight: parseFloat(getComputedStyle(element).lineHeight),
        fragments: fragments(element),
      })),
    };
  });
}

function check(result, locale, label) {
  const { section, picture, intro, profile, width } = result;
  const within = (inner, outer) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 &&
    inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  assert.equal(result.lang, locale, `${label}: locale`);
  assert.equal(result.direction, locale === 'ar' ? 'rtl' : 'ltr', `${label}: direction`);
  assert.equal(result.mirror, locale === 'ar' ? -1 : 1, `${label}: artwork mirror`);
  assert.ok(result.loaded, `${label}: artwork decoded`);
  const source = decodeURIComponent(new URL(result.currentSrc).searchParams.get('url') || new URL(result.currentSrc).pathname);
  assert.ok(source.endsWith(`/treatment-and -services-${width >= 1024 ? 'desktop' : 'mobile'}-image.png`), `${label}: selected artwork ${source}`);
  assert.ok(result.scrollWidth <= result.clientWidth + 1, `${label}: section horizontal overflow`);
  assert.ok(section.left >= -1 && section.right <= width + 1, `${label}: section within viewport`);
  assert.ok(within(profile, section), `${label}: profile within section bounds`);
  assert.ok(within(intro, section), `${label}: intro within section bounds`);
  for (const text of result.text) {
    assert.ok(text.fragments.length, `${label}: live text rendered`);
    if (text.cardBounds) {
      assert.ok(text.blockBounds.top >= text.cardBounds.top - 1 && text.blockBounds.bottom <= text.cardBounds.bottom + 1,
        `${label}: service text block fits vertically inside its card`);
    }
    for (const fragment of text.fragments) {
      const bounds = text.bounds;
      assert.ok(fragment.left >= bounds.left - 1 && fragment.right <= bounds.right + 1,
        `${label}: text wraps inside its container`);
      if (text.cardBounds) {
        // Range includes font ascent/descent beyond the CSS line box (notably Noto Arabic).
        const halfLeadingOverhang = Math.max(0, (fragment.height - text.lineHeight) / 2);
        const top = fragment.top + halfLeadingOverhang;
        const bottom = fragment.bottom - halfLeadingOverhang;
        assert.ok(top >= text.cardBounds.top - 1 && bottom <= text.cardBounds.bottom + 1,
          `${label}: service text line fits vertically inside its card`);
        assert.ok(top >= text.blockBounds.top - 1 && bottom <= text.blockBounds.bottom + 1,
          `${label}: service text line fits vertically inside its text block`);
      }
    }
  }
  const copy = (locale === 'ar' ? ar : en).treatmentServices;
  assert.equal(result.trustItems.length, 3, `${label}: three trust messages`);
  assert.equal(result.trustInteractive, 0, `${label}: informational trust rows`);
  assert.ok(Math.abs(result.trust.width - section.width) < 1, `${label}: full-width trust strip`);
  assert.ok(picture.bottom <= result.trust.top + 1, `${label}: artwork ends above trust strip`);
  assert.ok(Math.max(...result.actions.map(action => action.bounds.bottom)) <= result.trust.top, `${label}: trust follows actions`);
  result.trustItems.forEach((item, index) => {
    const key = ['hospitals', 'specialist', 'concierge'][index];
    assert.equal(item.title, copy.trust[key].title, `${label}: localized trust title`);
    assert.equal(item.description, copy.trust[key].description, `${label}: localized trust description`);
    assert.ok(item.iconClass.includes(['lucide-shield-check', 'lucide-user-round', 'lucide-globe'][index]), `${label}: approved trust icon`);
    assert.equal(item.hidden, 'true', `${label}: decorative trust icon`);
    assert.equal(item.mirror, 1, `${label}: trust icon unmirrored`);
    assert.ok(within(item.bounds, result.trust) && within(item.icon, item.bounds), `${label}: contained trust row/icon`);
    assert.ok(within(item.textBounds, item.bounds), `${label}: trust text wrapper contained in row`);
    assert.ok(locale === 'ar' ? item.textBounds.right <= item.icon.left + 1 : item.textBounds.left >= item.icon.right - 1,
      `${label}: trust icon and text do not overlap in reading order`);
    assert.ok(within(item.titleBounds, item.textBounds) && within(item.descriptionBounds, item.textBounds),
      `${label}: trust text blocks contained in wrapper`);
    assert.ok(item.descriptionBounds.top >= item.titleBounds.bottom - 1, `${label}: trust description follows heading`);
    assert.equal(item.alignment, locale === 'ar' ? 'rtl' : 'ltr', `${label}: trust direction`);
    if (locale === 'ar') assert.ok(item.font.includes('Noto'), `${label}: Arabic title font`);
    item.textContrast.forEach(value => assert.ok(value >= 4.5, `${label}: trust title/body contrast`));
    // Decorative icons have no accessibility contrast requirement; this is a visibility design check.
    assert.ok(item.iconContrast >= 3, `${label}: decorative trust icon visibility design check`);
    if (index > 0) {
      const previous = result.trustItems[index - 1].bounds;
      if (width >= 1024) {
        assert.ok(Math.abs(previous.top - item.bounds.top) < 1, `${label}: horizontal trust items`);
        assert.ok(Math.abs(previous.width - item.bounds.width) < 1, `${label}: evenly spaced trust items`);
        assert.ok(locale === 'ar' ? item.bounds.right <= previous.left + 1 : item.bounds.left >= previous.right - 1, `${label}: trust reading order`);
      } else assert.ok(item.bounds.top >= previous.bottom - 1, `${label}: stacked trust rows`);
    }
    assert.equal(item.borderTop, index > 0 && width < 1024 ? 1 : 0, `${label}: mobile separators`);
    assert.equal(item.borderStart, index > 0 && width >= 1024 ? 1 : 0, `${label}: desktop separators`);
  });
  assert.equal(result.services.length, 4, `${label}: exactly four services`);
  const assets = ['rhInoplastv-icon.png', 'ent-treatment-icon.png', 'facial-rejuvenation-icon.png', 'functiona-reconstructive-surgery-icon.png'];
  result.services.forEach((service, index) => {
    assert.ok(service.loaded, `${label}: service icon decoded`);
    assert.ok(decodeURIComponent(service.source).includes(assets[index]), `${label}: supplied service icon`);
    assert.equal(service.mirror, 1, `${label}: service shape unmirrored`);
    assert.ok(within(service.bounds, section), `${label}: service within section`);
    assert.ok(locale === 'ar' ? service.textBounds.right <= service.iconBounds.left + 1 : service.textBounds.left >= service.iconBounds.right - 1,
      `${label}: compact service icon beside text`);
    if (width === 390 && !label.includes('text-200')) {
      assert.ok(service.bounds.height <= 128, `${label}: compact phone card height`);
    }
  });
  const [first, second, third] = result.services.map(service => service.bounds);
  assert.ok(Math.abs(first.top - second.top) < 1 && third.top >= first.bottom, `${label}: two column service grid`);
  assert.ok(locale === 'ar' ? first.left >= second.right : first.right <= second.left, `${label}: service reading order`);
  assert.equal(result.actions.length, 2, `${label}: two actions`);
  result.actions.forEach(action => {
    assert.equal(action.href, '#contact', `${label}: approved destination`);
    assert.equal(action.mirror, locale === 'ar' ? -1 : 1, `${label}: directional arrow`);
    assert.ok(within(action.bounds, section), `${label}: action within section`);
  });
  const [primary, secondary] = result.actions.map(action => action.bounds);
  assert.ok(primary.top >= result.services[3].bounds.bottom, `${label}: actions below service grid`);
  if (width >= 1024) {
    assert.ok(first.top >= intro.bottom, `${label}: desktop services below intro`);
    assert.ok(Math.abs(primary.top - secondary.top) < 1, `${label}: desktop actions beside each other`);
    assert.ok(locale === 'ar' ? first.left >= profile.right - 1 : second.right <= profile.left + 1, `${label}: services beside profile`);
    assert.ok(locale === 'ar' ? intro.left >= profile.right - 1 : intro.right <= profile.left + 1,
      `${label}: desktop intro and profile occupy mirrored columns`);
  } else {
    assert.ok(first.top >= profile.bottom, `${label}: mobile services follow profile`);
    assert.ok(secondary.top >= primary.bottom, `${label}: stacked mobile actions`);
    assert.ok(Math.abs(primary.width - (section.width - (width >= 481 ? 48 : 32))) < 1, `${label}: full-width mobile actions`);
    assert.ok(intro.bottom <= picture.top + 1, `${label}: intro precedes portrait`);
    assert.ok(Math.abs(picture.height / picture.width - 1.15) < 0.01, `${label}: stable mobile portrait aspect ratio`);
    assert.ok(profile.top < picture.bottom && profile.bottom > picture.bottom,
      `${label}: profile bridges lower portrait edge`);
  }
}

try {
  for (const locale of ['en', 'ar']) {
    for (const width of [320, 374, 375, 390, 480, 481, 639, 640, 768, 1023, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      try {
        await context.addCookies([{ name: 'NEXT_LOCALE', value: locale, url: baseUrl }]);
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        await page.goto(baseUrl);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('#treatments picture').scrollIntoViewIfNeeded();
        await page.locator('#treatments picture img').evaluate(image => image.decode());
        await page.locator('#treatments article img').evaluate(image => image.decode());
        await page.locator('#treatments [data-treatment-services] li img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        check(await measure(page), locale, `${locale}-${width}`);
        const links = page.locator('#treatments [data-treatment-actions] a');
        // Compare against the unfocused style so a permanent shadow cannot masquerade as focus.
        const unfocusedShadows = await links.evaluateAll(elements => elements.map(link => getComputedStyle(link).boxShadow));
        const visibleFocus = (link, unfocusedShadow) => {
          const style = getComputedStyle(link);
          const ring = style.boxShadow !== 'none' && style.boxShadow !== unfocusedShadow;
          const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 &&
            style.outlineColor !== 'transparent' && style.outlineColor !== 'rgba(0, 0, 0, 0)';
          return link === document.activeElement && link.matches(':focus-visible') && (ring || outline);
        };
        await links.first().focus();
        assert.ok(await links.first().evaluate(visibleFocus, unfocusedShadows[0]), `${locale}-${width}: primary visible focus`);
        await page.keyboard.press('Tab');
        assert.ok(await links.nth(1).evaluate(visibleFocus, unfocusedShadows[1]), `${locale}-${width}: secondary visible keyboard focus`);
        for (const [index, action] of ['primary', 'secondary'].entries()) {
          // Each activation starts without #contact and with the action in view.
          await page.evaluate(() => {
            history.replaceState(history.state, '', location.pathname + location.search);
          });
          await links.nth(index).scrollIntoViewIfNeeded();
          assert.equal(new URL(page.url()).hash, '', `${locale}-${width}: ${action} starts without a hash`);
          await links.nth(index).focus();
          assert.ok(await links.nth(index).evaluate(visibleFocus, unfocusedShadows[index]), `${locale}-${width}: ${action} activation focus visible`);
          await page.keyboard.press('Enter');
          await page.waitForURL('**/#contact');
          assert.ok(await page.locator('#contact').evaluate(target => target.getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom - 1), `${locale}-${width}: ${action} contact navigation clears header`);
        }
        await page.locator('#treatments').scrollIntoViewIfNeeded();
        cases++;
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        check(await measure(page), locale, `${locale}-${width}-dark`);
        cases++;
        if (width === 390 || width === 1440) {
          await page.locator('#treatments').screenshot({ style: "header, nextjs-portal { visibility: hidden !important; }", path: `${screenshotDir}/${locale}-${width}-dark.png` });
        }
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        if (width === 390 || width === 1440) {
          await page.locator('#treatments').screenshot({ style: "header, nextjs-portal { visibility: hidden !important; }", path: `${screenshotDir}/${locale}-${width}-light.png` });
          const otherLocale = locale === 'en' ? 'ar' : 'en';
          await page.locator('[data-slot="locale-pill"]:visible').click();
          await page.locator(`[data-slot="locale-menu"] [data-lang="${otherLocale}"]`).click();
          await page.waitForFunction(expected => document.querySelector('#treatments').lang === expected, otherLocale);
          await page.evaluate(() => document.fonts.ready);
          check(await measure(page), otherLocale, `${locale}-${width}-locale-switched`);
          assert.doesNotMatch(new URL(page.url()).pathname, /^\/(en|ar)(?:\/|$)/, 'locale switching keeps unprefixed URL');
          await page.reload();
          await page.waitForFunction(expected => document.querySelector('#treatments')?.lang === expected, otherLocale);
          await page.evaluate(() => document.fonts.ready);
          await page.locator('#treatments').scrollIntoViewIfNeeded();
          await page.locator('#treatments img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
          assert.doesNotMatch(new URL(page.url()).pathname, /^\/(en|ar)(?:\/|$)/, 'reloaded locale keeps unprefixed URL');
          check(await measure(page), otherLocale, `${locale}-${width}-locale-reloaded`);
          assert.equal(await page.locator('#treatments').count(), 1, 'one Treatments anchor');
          assert.equal(await page.locator('h1').count(), 1, 'one page h1');
          assert.ok(await page.locator('header').isVisible(), 'header remains visible');
          assert.equal(await page.locator('#why-turkey').count(), 1, 'Why Turkey preserved');
          await page.locator('[data-slot="locale-pill"]:visible').click();
          await page.locator(`[data-slot="locale-menu"] [data-lang="${locale}"]`).click();
          await page.waitForFunction(expected => document.querySelector('#treatments').lang === expected, locale);
        }
        if (width === 320 || width === 481 || width === 1024) {
          await page.locator('#treatments').evaluate(section => {
            for (const element of section.querySelectorAll('p, h2, h3, a span')) {
              element.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
            }
          });
          for (const theme of ['light', 'dark']) {
            await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), theme === 'dark');
            check(await measure(page), locale, `${locale}-${width}-${theme}-text-200`);
            cases++;
          }
        }
      } finally {
        await context.close();
      }
    }
  }
  console.log(`Treatment services browser checks passed: ${cases} cases.`);
} finally {
  await browser.close();
}
