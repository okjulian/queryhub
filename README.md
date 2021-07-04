# QueryHub

Records your GraphQL queries and replays them during consequent test runs

## Benefits

- Fast tests
- Deterministic responses

## Use cases

- [x] End to end testing with single page apps using Playwright
- [ ] Mock server side requests
  - NextJS apps
  - NodeJS APIs

## Installation

`yarn add queryhub`

## Usage

Call `await queryHub({ page, name: 'products', url: /graphcms.com/ })` with the GraphQL API URL you want to record/replay, a Playwright `page` object and the `name` of the file that will store the mocks. QueryHub will store all queries against that endpoint. On subsequent test runs, it will return the mocked values instead of hitting that API.

```js
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
```

## References

- https://github.com/vcr/vcr
- https://playwright.dev/
- https://github.com/nock/nock
- https://github.com/HLTech/mockiavelli
- https://github.com/piglovesyou/graphql-let
- https://github.com/GraphCMS/graphcms-examples
