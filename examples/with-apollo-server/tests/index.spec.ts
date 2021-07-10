import { expect } from '@playwright/test';
import test from './setup';
import { queryHub } from '../../../';

const query = `
  { 
    products {
      slug
      name
    }
  }
  `;

test('lists products', async ({ page, server, api }) => {
  await queryHub({ server, url: /graphcms.com/, name: 'products' });
  const { data } = await api.executeOperation({ query });

  expect(data?.products[0]?.name).toContain('Long Sleeve Tee 2');
  expect(data?.products[1]?.name).toContain('Short Sleeve Tee');
  expect(data?.products[2]?.name).toContain('Cap');
});
