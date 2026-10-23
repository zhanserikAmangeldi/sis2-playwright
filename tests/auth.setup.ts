import { test as setup, expect } from '../fixtures/pages.fixture';
import { registerViaApi } from '../data/users.api';
import { createUser } from '../data/user.factory';
import { AUTH_FILE } from '../env';

// Runs once before every browser project. Creates our own buyer (the shared seeded
// accounts get locked by other students' failed logins) and saves the signed-in session.
setup('sign in a dedicated buyer once', async ({ loginPage, page }) => {
  const buyer = createUser();
  await registerViaApi(buyer);

  await loginPage.open();
  await loginPage.signIn(buyer);
  await expect(page).toHaveURL(/\/account/);

  await page.context().storageState({ path: AUTH_FILE });
});
