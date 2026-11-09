import { test, expect } from '@playwright/test';

// DEMO ONLY (branch demo/flaky-trace, never merged): fails on the first attempt and passes on
// the retry, to show that CI retries a flaky test and records a trace of the failed attempt.
test('demo: flaky test gets a trace on the first retry', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('nav-sign-in')).toBeVisible();
  expect(testInfo.retry, 'deliberately failing the first attempt').toBeGreaterThan(0);
});
