import { Page } from 'playwright';
import nodeFetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

function fileName(name: string) {
  const directory = process.cwd();
  return path.join(directory, `fixtures/queryhub/${name}.json`);
}

async function createQueryHub(name: string) {
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

export async function queryHub({
  page,
  name,
  url,
}: {
  page: Page;
  name: string;
  url: string | RegExp | ((url: URL) => boolean);
}) {
  // Create fixtures/queryhub/${name} if not exists
  // if mock exists, route.fulfill() with mock
  // else, call api, store mock and route.continue()
  const queryHub = await createQueryHub(name);
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
    const response = await nodeFetch(route.request().url(), {
      method: 'POST',
      body,
    });
    if (!queryHub[url]) {
      queryHub[url] = {};
    }
    const headerEntries: [string, string][] = Array.from(
      response.headers.entries()
    );
    queryHub[url][body] = {
      headers: headerEntries.reduce(
        (accumulator, [key, value]) => ({
          ...accumulator,
          [key]: value,
        }),
        {}
      ),
      body: await response.json(),
      status: response.status,
    };
    await fs.writeFile(fileName(name), JSON.stringify(queryHub, null, 2));
    route.continue();
  });
  return {
    stop: () => {
      return page.unroute(url);
    },
  };
}
