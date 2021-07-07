import { expect } from '@playwright/test';
import test from './setup';
import { queryHub } from '../../../';

test('lists products', async ({ page, server }) => {
  await queryHub({ server, url: /graphcms.com/, name: 'products' });
  await page.goto('http://localhost:3000');
  const textContent = await page.innerText('ul');

  expect(textContent).toContain('Long Sleeve Tee 2');
  expect(textContent).toContain('Short Sleeve Tee');
  expect(textContent).toContain('Cap');
});
