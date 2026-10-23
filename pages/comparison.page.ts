import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ComparisonPage extends BasePage {
  readonly title: Locator;
  /** Product names across the table header, left to right. */
  readonly productNames: Locator;
  /** The "Price" row, one cell per compared product, same order as the names. */
  readonly prices: Locator;

  constructor(page: Page) {
    super(page);
    const table = page.getByTestId('comparison-table');
    this.title = page.getByTestId('comparison-title');
    this.productNames = table.getByTestId('product-name');
    this.prices = table.getByTestId('compare-price');
  }
}
