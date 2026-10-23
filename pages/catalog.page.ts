import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The home page: product grid, search and sorting. */
export class CatalogPage extends BasePage {
  private readonly searchQuery: Locator;
  private readonly searchSubmit: Locator;
  private readonly searchCaption: Locator;
  private readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.searchQuery = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchCaption = page.getByTestId('search-caption');
    // Every product card is a link that contains a product name.
    this.productCards = page.getByRole('link').filter({ has: page.getByTestId('product-name') });
  }

  async open() {
    await this.goto('/');
  }

  async search(term: string) {
    await this.searchQuery.fill(term);
    await this.searchSubmit.click();
    await this.searchCaption.filter({ hasText: term }).waitFor();
  }

  card(productName: string): Locator {
    return this.productCards.filter({
      has: this.page.getByTestId('product-name').getByText(productName, { exact: true }),
    });
  }

  priceOf(productName: string): Locator {
    return this.card(productName).getByTestId('product-price');
  }

  /**
   * Opens the first product on the page that is in stock. Stock is shared by everyone who
   * uses this public shop, so a hard-coded product sells out sooner or later.
   * `except` skips products with special rules (e.g. "only one per cart").
   */
  async openFirstAvailableProduct(except: string[] = []) {
    let available = this.productCards.filter({ hasNot: this.page.getByTestId('out-of-stock') });
    for (const name of except) {
      available = available.filter({ hasNotText: name });
    }
    await available.first().click();
    await this.page.waitForURL(/\/product\//);
  }

  /** Finds the product by name through search, so pagination and sort order do not matter. */
  async openProduct(productName: string) {
    await this.search(productName);
    await this.card(productName).click();
    await this.page.waitForURL(/\/product\//);
  }
}
