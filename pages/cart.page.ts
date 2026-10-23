import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Step 1 of the checkout wizard: the cart contents. */
export class CartPage extends BasePage {
  readonly total: Locator;
  private readonly navCart: Locator;
  private readonly rows: Locator;
  private readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.navCart = page.getByTestId('nav-cart');
    this.rows = page.getByRole('row').filter({ has: page.getByTestId('product-title') });
    this.total = page.getByTestId('cart-total');
    this.proceedButton = page.getByTestId('proceed-1');
  }

  async open() {
    await this.navCart.click();
    await this.page.waitForURL(/\/checkout/);
  }

  item(productName: string) {
    const row = this.rows.filter({ hasText: productName });
    return {
      row,
      title: row.getByTestId('product-title'),
      quantity: row.getByTestId('product-quantity'),
      lineTotal: row.getByTestId('line-price'),
    };
  }

  async proceed() {
    await this.proceedButton.click();
  }
}
