import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './env';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,               // 4. retry in CI only
  // A shared public application: keep the load polite and the run stable.
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,                            // 1. relative goto()
    testIdAttribute: 'data-test',                 // 2. getByTestId maps to data-test
    trace: 'on-first-retry',                      // 3. a recording when it fails
    screenshot: 'only-on-failure',
  },

  projects: [
    // Registers a dedicated buyer once and saves the signed-in session.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    { name: 'chromium', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', dependencies: ['setup'], use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', dependencies: ['setup'], use: { ...devices['Desktop Safari'] } },
  ],
});
