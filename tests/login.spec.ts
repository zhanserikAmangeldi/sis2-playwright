import { test, expect } from '../fixtures/pages.fixture';
import { fullName } from '../data/user.factory';

test.describe('TC-02 Log in', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('valid credentials open the account page', async ({ loginPage, accountPage, registeredUser, page }) => {
    await loginPage.signIn(registeredUser);

    await expect(page).toHaveURL(/\/account/);
    await expect(accountPage.title).toHaveText('My account');
    await expect(accountPage.userMenu).toHaveText(fullName(registeredUser));
  });

  test('a wrong password shows an error and does not sign in', async ({ loginPage, registeredUser, page }) => {
    await loginPage.signIn({ email: registeredUser.email, password: `${registeredUser.password}-wrong` });

    await expect(loginPage.error).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(loginPage.signInLink).toBeVisible();
    await expect(loginPage.userMenu).toBeHidden();
  });
});
