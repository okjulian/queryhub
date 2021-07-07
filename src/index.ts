import { Page } from 'playwright';
import { rest } from 'msw';
import { SetupServerApi } from 'msw/node';
import unfetch from 'isomorphic-unfetch';
import fs from 'fs/promises';
import path from 'path';
import { Mask } from 'msw/lib/types/setupWorker/glossary';

function fileName(name: string) {
  const directory = process.cwd();
  return path.join(directory, `fixtures/queryhub/${name}.json`);
}

export function queryHub({
  page,
  name,
  url,
}: {
  page: Page;
  name: string;
  url: Mask;
}): Promise<{ stop: () => Promise<void> }>;

export function queryHub({
  server,
  name,
  url,
}: {
  server: SetupServerApi;
  name: string;
  url: Mask;
}): Promise<SetupServerApi>;

export async function queryHub({
  page,
  server,
  name,
  url,
}: {
  page?: Page;
  server?: SetupServerApi;
  name: string;
  url: Mask;
}) {
  if (page) {
    return usePage({ page, name, url });
  } else if (server) {
    return useServer(server, url, name);
  }

  throw new Error('Either page or server is required');
}

export async function createQueryHub(name: string) {
  try {
    const file = await fs.readFile(fileName(name));
    return JSON.parse(file.toString());
  } catch (error) {
    if (error.code === 'ENOENT') {
      const dirname = path.dirname(fileName(name));
      await fs.mkdir(dirname, { recursive: true });
      await fs.writeFile(fileName(name), JSON.stringify({}));
      return {};
    }
    throw error;
  }
}

async function queryHandler(url: Mask, name: string) {
  const queryHub = await createQueryHub(name);
  return rest.post(url, async (req, res, ctx) => {
    // @ts-ignore
    const { query, variables } = req.body;
    const body = JSON.stringify({ query, variables });
    const requestUrl = req.url.toString();
    const storedResponse = queryHub[requestUrl]?.[body];
    if (storedResponse) {
      return res(ctx.json(storedResponse.body));
    }
    const response = await ctx.fetch(requestUrl, {
      method: 'POST',
      body,
    });
    if (!queryHub[requestUrl]) {
      queryHub[requestUrl] = {};
    }
    persist(queryHub, name, requestUrl, body, response);
    return res(ctx.json(await response.json()));
  });
}

async function persist(
  queryHub: any,
  name: string,
  url: string,
  body: string,
  response: Response
) {
  let headerEntries: [string, string][] = [];
  response.headers.forEach((value, key) => {
    headerEntries.push([key, value]);
  });
  const bodyJson = await response.json();
  queryHub[url][body] = {
    headers: headerEntries.reduce(
      (accumulator, [key, value]) => ({
        ...accumulator,
        [key]: value,
      }),
      {}
    ),
    body: bodyJson,
    status: response.status,
  };
  await fs.writeFile(fileName(name), JSON.stringify(queryHub, null, 2));
}

async function useServer(server: SetupServerApi, url: Mask, name: string) {
  const handler = await queryHandler(url, name);
  server.use(handler);
  return server;
}

async function usePage({
  page,
  name,
  url,
}: {
  page: Page;
  name: string;
  url: string | RegExp | ((url: URL) => boolean);
}) {
  // Create fixtures/queryhub/${name} if not exists
  const queryHub = await createQueryHub(name);
  // if mock exists, route.fulfill() with mock
  // else, call api, store mock and route.continue()
  page.route(url, async route => {
    const { query, variables } = route.request().postDataJSON();
    const body = JSON.stringify({ query, variables });
    const url = route.request().url();
    const storedResponse = queryHub[url]?.[body];
    if (storedResponse) {
      return route.fulfill({
        body: JSON.stringify(storedResponse.body),
        headers: {
          ...storedResponse.headers,
          // Playwright CORS fix
          // https://github.com/microsoft/playwright/pull/3336/files#diff-7f66e76df8e9a7e73ad6b3ba8aa09373514c467ec76a719aa99323ed6eb6ba38R478
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        status: storedResponse.status,
      });
    }
    const response = await unfetch(route.request().url(), {
      method: 'POST',
      body,
    });
    if (!queryHub[url]) {
      queryHub[url] = {};
    }
    persist(queryHub, name, url, body, response);
    route.continue();
  });
  return {
    stop: () => {
      return page.unroute(url);
    },
  };
}
