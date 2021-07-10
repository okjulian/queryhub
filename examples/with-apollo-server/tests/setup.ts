import { test as base } from '@playwright/test';
import { setupServer } from 'msw/node';
import server from '../server';
import { ApolloServer } from 'apollo-server';

const test = base.extend<
  {},
  {
    port: number;
    server: any;
    api: ApolloServer;
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

  api: [
    async ({ port }, use) => {
      console.log('Starting server...');
      await new Promise(f => {
        server.listen(port, f);
      });
      console.log('Server ready');

      // Use the server in the tests.
      await use(server);
      //   // Cleanup.
      console.log('Stopping server...');
      await server.stop();
      console.log('Server stopped');
    },
    { scope: 'worker', auto: true },
  ],
});

export default test;
