import { test, expect } from '../fixtures/pages.fixture';
import { fullName } from '../data/user.factory';

test.describe('TC-01 Register a new customer', () => {
  test('a new customer can register and then sign in with the new account', async ({
    registerPage, loginPage, accountPage, newUser, page,
  }) => {
    await registerPage.open();
    await registerPage.register(newUser);

    // The app sends a freshly registered customer to the login page.
    await expect(page).toHaveURL(/\/auth\/login/);

    // Proof that the account really exists: its credentials work.
    await loginPage.signIn(newUser);
    await expect(page).toHaveURL(/\/account/);
    await expect(accountPage.title).toHaveText('My account');
    await expect(accountPage.userMenu).toHaveText(fullName(newUser));
  });
});
