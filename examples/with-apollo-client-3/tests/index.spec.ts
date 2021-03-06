import { expect } from '@playwright/test';
import { queryHub } from '../../../';
import test from './setup';

test('lists products', async ({ page, port }) => {
  const hub = await queryHub({ page, name: 'products', url: /graphcms.com/ });
  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
  const textContent = await page.innerText('ul');

  expect(textContent).toContain('Long Sleeve Tee 2');
  expect(textContent).toContain('Short Sleeve Tee');
  expect(textContent).toContain('Cap');
  await hub.stop();
});
