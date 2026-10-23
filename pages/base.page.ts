import { Page, Locator } from '@playwright/test';
import { ROUTE_PREFIX } from '../env';

/** What every screen of the Toolshop shares: header navigation, toasts and the comparison bar. */
export abstract class BasePage {
  readonly userMenu: Locator;
  readonly signInLink: Locator;
  readonly cartQuantity: Locator;
  readonly toast: Locator;
  readonly comparisonBar: Locator;
  private readonly compareLink: Locator;

  constructor(protected readonly page: Page) {
    // Named differently in the older (buggy) build.
    this.userMenu = page.getByTestId('nav-menu').or(page.getByTestId('nav-user-menu'));
    this.signInLink = page.getByTestId('nav-sign-in');
    this.cartQuantity = page.getByTestId('cart-quantity');
    this.toast = page.getByRole('alert');
    this.comparisonBar = page.getByTestId('comparison-bar');
    this.compareLink = page.getByTestId('compare-link');
  }

  /** Navigates to an app route, whichever routing style the target build uses. */
  protected async goto(route: string) {
    await this.page.goto(`${ROUTE_PREFIX}${route}`);
  }

  async openComparison() {
    await this.compareLink.click();
    await this.page.waitForURL(/\/comparison/);
  }
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function parsePrice(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ''));
}
