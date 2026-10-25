// Run only against disposable development Postgres and S3 with a synthetic image.
// ADMIN_URL, ADMIN_USERNAME, ADMIN_PASSWORD, FIXTURE_PATH, and BASE_URL are required.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const adminUrl = process.env.ADMIN_URL;
const publicUrl = process.env.BASE_URL;
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const fixture = process.env.FIXTURE_PATH;
if (![adminUrl, publicUrl, username, password, fixture].every(Boolean)) {
  throw new Error('Set ADMIN_URL, BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD and FIXTURE_PATH');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.on('dialog', dialog => dialog.accept());
const consent = `SYNTHETIC-STORY10-${Date.now()}`;
const createdCaseIds = new Set();

async function createCase(order) {
  await page.goto(`${adminUrl}/admin/gallery`);
  await page.locator('#create-case').click();
  await page.waitForURL(/\/admin\/gallery\/[0-9a-f-]+$/);
  const id = page.url().split('/').at(-1);
  createdCaseIds.add(id);
  await page.locator('#case-form input[name="expected_revision"]').waitFor();
  await page.locator('#media-file').setInputFiles(fixture);
  await page.locator('#upload-media').click();
  await page.getByText('Image uploaded and normalized after server confirmation.').waitFor();

  await page.locator('input[name="signed_consent_id"]').fill(consent);
  await page.locator('input[name="consent_verified"]').check();
  await page.locator('select[name="procedure_tag"]').selectOption('synthetic-procedure');
  await page.locator('select[name="timeframe_badge"]').selectOption('synthetic-time');
  await page.locator('select[name="before_position"]').selectOption(order === 1 ? 'left' : 'right');
  await page.locator('input[name="display_order"]').fill(String(order));
  await page.locator('input[name="crop_attested"]').check();
  await page.locator('textarea[name="en_alt_text"]').fill(`Synthetic case ${order}, before and after`);
  await page.locator('textarea[name="ar_alt_text"]').fill(`حالة تجريبية ${order}، قبل وبعد`);
  await page.locator('select[name="en_approval"]').selectOption('approved');
  await page.locator('select[name="ar_approval"]').selectOption('approved');
  await page.locator('#save-case').click();
  await page.getByText('Changes saved after server confirmation.').waitFor();
  await page.locator('#publish-case').click();
  await page.getByText('Case published.').waitFor();
  return id;
}

async function publicList() {
  const response = await page.request.get(`${publicUrl}/api/v1/gallery?page=1&page_size=12`);
  assert.equal(response.status(), 200, 'public list status');
  assert.match(response.headers()['cache-control'] || '', /no-store/, 'public no-store');
  return response.json();
}

try {
  await page.goto(`${adminUrl}/admin/login`);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(`${adminUrl}/admin/gallery`);

  const first = await createCase(1);
  const firstList = await publicList();
  assert.ok(firstList.data.some(item => item.id === first), 'first case published');
  const oldMediaUrl = firstList.data.find(item => item.id === first).url;
  assert.equal((await page.request.get(new URL(oldMediaUrl, publicUrl).toString())).status(), 200,
    'published derivative is gated and available');

  await page.locator('#publish-case').click();
  await page.getByText('Case unpublished.').waitFor();
  assert.ok(!(await publicList()).data.some(item => item.id === first), 'unpublished case absent');
  assert.notEqual((await page.request.get(new URL(oldMediaUrl, publicUrl).toString())).status(), 200,
    'old bytes denied after unpublish');
  await page.locator('#publish-case').click();
  await page.getByText('Case published.').waitFor();

  const second = await createCase(2);
  assert.ok((await publicList()).data.some(item => item.id === second), 'second case published');
  await page.locator('#withdraw-consent').click();
  await page.getByText(/2 linked case\(s\) were removed/).waitFor();
  const afterWithdrawal = await publicList();
  assert.ok(!afterWithdrawal.data.some(item => item.id === first || item.id === second),
    'shared consent withdrawal removes both cases');
  assert.notEqual((await page.request.get(new URL(oldMediaUrl, publicUrl).toString())).status(), 200,
    'old bytes denied after shared withdrawal');

  for (const id of [second, first]) {
    await page.goto(`${adminUrl}/admin/gallery/${id}`);
    await page.locator('#delete-case').click();
    await page.waitForURL(`${adminUrl}/admin/gallery`);
    createdCaseIds.delete(id);
  }
  console.log('Synthetic operator lifecycle passed: create, upload, review, publish, unpublish, republish, shared withdrawal, gated bytes and delete.');
} finally {
  for (const id of createdCaseIds) {
    try {
      await page.goto(`${adminUrl}/admin/gallery/${id}`);
      await page.locator('#delete-case').click();
      await page.waitForURL(`${adminUrl}/admin/gallery`);
      createdCaseIds.delete(id);
    } catch {
      // Preserve the original assertion failure while reporting incomplete cleanup.
      console.error('Synthetic gallery cleanup could not delete a created case; inspect the isolated development dashboard.');
    }
  }
  await context.close();
  await browser.close();
}
