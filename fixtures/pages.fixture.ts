import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { AccountPage } from '../pages/account.page';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { CatalogPage } from '../pages/catalog.page';
import { ProductPage } from '../pages/product.page';
import { ComparisonPage } from '../pages/comparison.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { createUser, User } from '../data/user.factory';
import { registerViaApi } from '../data/users.api';

type Fixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountPage: AccountPage;
  forgotPasswordPage: ForgotPasswordPage;
  catalogPage: CatalogPage;
  productPage: ProductPage;
  comparisonPage: ComparisonPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** Fresh customer data that does not exist in the application yet. */
  newUser: User;
  /** A fresh customer that already has an account (created through the API). */
  registeredUser: User;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  registerPage: async ({ page }, use) => { await use(new RegisterPage(page)); },
  accountPage: async ({ page }, use) => { await use(new AccountPage(page)); },
  forgotPasswordPage: async ({ page }, use) => { await use(new ForgotPasswordPage(page)); },
  catalogPage: async ({ page }, use) => { await use(new CatalogPage(page)); },
  productPage: async ({ page }, use) => { await use(new ProductPage(page)); },
  comparisonPage: async ({ page }, use) => { await use(new ComparisonPage(page)); },
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
  checkoutPage: async ({ page }, use) => { await use(new CheckoutPage(page)); },

  newUser: async ({}, use) => {
    await use(createUser());
  },

  registeredUser: async ({}, use) => {
    const user = createUser();
    await registerViaApi(user);
    await use(user);
  },
});

export { expect } from '@playwright/test';
