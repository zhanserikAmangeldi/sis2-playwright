import { test, expect } from '../fixtures/pages.fixture';
import { createUser } from '../data/user.factory';

test.describe('TC-05 Reset a password', () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.open();
  });

  // Uses its own fresh account: on this application a reset really changes the password,
  // so running it against a shared account would lock other tests out.
  test('a known email gets a confirmation', async ({ forgotPasswordPage, registeredUser }) => {
    const status = await forgotPasswordPage.requestReset(registeredUser.email);

    expect(status).toBe(200);
    await expect(forgotPasswordPage.message).toBeVisible();
    await expect(forgotPasswordPage.message).not.toContainText(/invalid|error/i);
  });

  test('an unknown email gets an error', async ({ forgotPasswordPage }) => {
    const nobody = createUser();

    const status = await forgotPasswordPage.requestReset(nobody.email);

    expect(status).toBe(422);
    await expect(forgotPasswordPage.message).toHaveText('The selected email is invalid.');
  });
});
