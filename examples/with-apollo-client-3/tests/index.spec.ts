import { test, expect } from '@playwright/test';
import { queryHub } from 'queryhub';

let hub;

test.beforeEach(async ({ page }) => {
  hub = await queryHub({ page, name: 'products', url: /graphcms.com/ });
});

test.afterEach(async () => {
  await hub.stop();
});

test('lists products', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const textContent = await page.innerText('ul');

  expect(textContent).toContain('Long Sleeve Tee 2');
  expect(textContent).toContain('Short Sleeve Tee');
  expect(textContent).toContain('Cap');
});
