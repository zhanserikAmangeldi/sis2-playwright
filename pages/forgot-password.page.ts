import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  /** The success or error banner rendered inside the form after submitting. */
  readonly message: Locator;
  private readonly email: Locator;
  private readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    const form = page.getByTestId('forgot-password-form');
    this.email = form.getByTestId('email');
    this.submit = form.getByTestId('forgot-password-submit');
    this.message = form.getByRole('alert');
  }

  async open() {
    await this.goto('/auth/forgot-password');
  }

  /** Submits the form and returns the HTTP status the API answered with. */
  async requestReset(email: string): Promise<number> {
    await this.email.fill(email);
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.url().endsWith('/users/forgot-password') && r.request().method() === 'POST'),
      this.submit.click(),
    ]);
    return response.status();
  }
}
