import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface Credentials {
  email: string;
  password: string;
}

export class LoginPage extends BasePage {
  readonly error: Locator;
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async open() {
    await this.goto('/auth/login');
  }

  async signIn(credentials: Credentials) {
    await this.email.fill(credentials.email);
    await this.password.fill(credentials.password);
    await this.submit.click();
  }
}
