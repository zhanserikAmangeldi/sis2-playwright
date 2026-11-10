import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './env';

// All CI behaviour hangs on one variable: GitHub Actions sets CI=true automatically.
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,                            // shards split tests, not whole files
  forbidOnly: isCI,                               // a forgotten test.only fails CI
  retries: isCI ? 2 : 0,                          // a flaky test is marked flaky, not red
  // A shared public application: keep the load polite and the run stable.
  workers: isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [
        ['list'],
        ['blob'],                                 // one per shard, merged by merge.config.ts
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,                            // 1. relative goto()
    testIdAttribute: 'data-test',                 // 2. getByTestId maps to data-test
    trace: 'on-first-retry',                      // 3. a recording when it fails
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Registers a dedicated buyer once and saves the signed-in session.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    { name: 'chromium', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', dependencies: ['setup'], use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', dependencies: ['setup'], use: { ...devices['Desktop Safari'] } },
  ],
});
