import { test as base } from '@playwright/test';
import handler from 'serve-handler';
import http from 'http';

const test = base.extend<
  {},
  {
    port: number;
    server: any;
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
    async ({ port }, use) => {
      let server;
      console.log('Starting server...');
      await new Promise(f => {
        server = http
          .createServer((request, response) =>
            handler(request, response, { public: 'build' })
          )
          .listen(port, () => f({}));
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
