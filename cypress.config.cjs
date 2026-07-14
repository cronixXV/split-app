const { defineConfig } = require('cypress');

module.exports = defineConfig({
  allowCypressEnv: false,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    testIsolation: true,
  },
  viewportWidth: 1440,
  viewportHeight: 900,
  retries: {
    openMode: 0,
    runMode: process.env.CI ? 2 : 0,
  },
  screenshotOnRunFailure: true,
  video: Boolean(process.env.CI),
});
