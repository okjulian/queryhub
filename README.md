# QueryHub

Records your GraphQL queries and replays them during consequent test runs

## Benefits

- Fast, offline tests
- Deterministic responses

## Use cases

- [x] End to end testing with single page apps using Playwright
- [ ] Mock server side requests
  - [x] NextJS apps
  - [] NodeJS APIs

## Installation

`yarn add queryhub`

## Usage

### Playwright + Create React App

Call `await queryHub({ page, name: 'products', url: /graphcms.com/ })` with the GraphQL API URL you want to record/replay, a Playwright `page` object and the `name` of the file that will store the mocks. QueryHub will store all queries against that endpoint. On subsequent test runs, it will return the mocked values instead of hitting that API.

```js
import { test, expect } from '@playwright/test';
import { queryHub } from 'queryhub';

test('lists products', async ({ page }) => {
  const hub = await queryHub(page, name: 'products', url: /graphcms.com/ });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const textContent = await page.innerText('ul');

  expect(textContent).toContain('Long Sleeve Tee 2');
  expect(textContent).toContain('Short Sleeve Tee');
  expect(textContent).toContain('Cap');
  await hub.stop();
});
```

### Playwright + NextJS

```js
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
```

```ts
import { test as base } from '@playwright/test';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { setupServer } from 'msw/node';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const test = base.extend<
  {},
  {
    port: number;
    server: any;
    next: any;
  }
>({
  port: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(3000 + workerInfo.workerIndex);
    },
    { scope: 'worker' },
  ],

  server: [
    async ({}, use) => {
      let mockServer;
      mockServer = await setupServer();
      mockServer.listen();

      // Use the server in the tests.
      await use(mockServer);

      // Cleanup.
      mockServer.close();
    },
    { scope: 'worker', auto: true },
  ],

  next: [
    async ({ port }, use) => {
      await app.prepare();
      let server;
      console.log('Starting server...');
      await new Promise(f => {
        server = createServer((req, res) => {
          // Be sure to pass `true` as the second argument to `url.parse`.
          // This tells it to parse the query portion of the URL.
          const parsedUrl = parse(req.url, true);
          handle(req, res, parsedUrl);
          //   @ts-ignore
        }).listen(port, f);
      });
      console.log('Server ready');

      // Use the server in the tests.
      await use(server);

      // Cleanup.
      console.log('Stopping server...');
      await new Promise(f => server.close(f));
      console.log('Server stopped');
    },
    { scope: 'worker', auto: true },
  ],
});

export default test;
```

## References

- https://github.com/vcr/vcr
- https://playwright.dev/
- https://github.com/nock/nock
- https://github.com/HLTech/mockiavelli
- https://github.com/piglovesyou/graphql-let
- https://github.com/GraphCMS/graphcms-examples
