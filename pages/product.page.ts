import { Page, Locator, expect } from '@playwright/test';
import { BasePage, parsePrice } from './base.page';

export interface ProductDetails {
  name: string;
  price: number;
}

export class ProductPage extends BasePage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  private readonly quantity: Locator;
  private readonly addToCartButton: Locator;
  private readonly addToCompareButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.addToCompareButton = page.getByTestId('add-to-compare');
  }

  /** Reads what the shopper sees right now: name and unit price. */
  async details(): Promise<ProductDetails> {
    await expect(this.unitPrice).not.toBeEmpty();
    return {
      name: (await this.name.innerText()).trim(),
      price: parsePrice(await this.unitPrice.innerText()),
    };
  }

  async setQuantity(quantity: number) {
    await this.quantity.fill(String(quantity));
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async addToCompare() {
    await this.addToCompareButton.click();
  }
}
