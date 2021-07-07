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
