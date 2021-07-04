// https://github.com/playwright-community/jest-playwright/#configuration
module.exports = {
  browsers: ['chromium'],
  serverOptions: {
    command: `npm start`,
    port: 3000,
    launchTimeout: 30000,
    debug: true,
  },
  launchOptions: {
    headless: true,
  },
  extends: ['plugin:playwright/jest-playwright'],
};
