import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { API_URL, IS_BUGGY_BUILD } from '../env';

export type PaymentMethod = 'Bank Transfer' | 'Cash on Delivery' | 'Credit Card' | 'Buy Now Pay Later' | 'Gift Card';

/** Steps 2-4 of the checkout wizard: sign-in check, billing address, payment. */
export class CheckoutPage extends BasePage {
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;
  private readonly proceedSignedIn: Locator;
  private readonly country: Locator;
  private readonly postalCode: Locator;
  private readonly houseNumber: Locator;
  private readonly street: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly proceedAddress: Locator;
  private readonly paymentMethod: Locator;
  private readonly finish: Locator;

  constructor(page: Page) {
    super(page);
    this.proceedSignedIn = page.getByTestId('proceed-2');
    this.country = page.getByTestId('country');
    // The older (buggy) build names these "postcode" and "address".
    this.postalCode = page.getByTestId('postal_code').or(page.getByTestId('postcode'));
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street').or(page.getByTestId('address'));
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.proceedAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.getByText(/Thanks for your order!/);
  }

  /**
   * Continues as the signed-in customer with the address saved in their profile.
   *
   * Entering the address step pre-fills country, postal code and house number from the
   * profile and immediately runs a postcode lookup that overwrites street, city and state.
   * The invoice API accepts only the looked-up values, so we ask the same (deterministic)
   * lookup ourselves and wait until the form shows its answer - never typing over it.
   * Asking ourselves, instead of catching the page's request, makes this independent of
   * when the page fires it (WebKit sometimes fires it before the step is even shown).
   */
  async continueWithSavedAddress() {
    await this.proceedSignedIn.click();
    if (IS_BUGGY_BUILD) {
      // The older build has no postcode lookup: the saved address is used as it is.
      await expect(this.street).not.toHaveValue('');
      await this.proceedAddress.click();
      return;
    }
    await expect(this.postalCode).not.toHaveValue('');
    await expect(this.houseNumber).not.toHaveValue('');

    const lookup = await this.page.request.get(`${API_URL}/postcode-lookup`, {
      params: {
        country: await this.country.inputValue(),
        postcode: await this.postalCode.inputValue(),
        house_number: await this.houseNumber.inputValue(),
      },
    });
    expect(lookup.ok(), 'postcode lookup').toBeTruthy();
    const found = await lookup.json();
    await expect(this.street).toHaveValue(found.street);
    await expect(this.city).toHaveValue(found.city);
    await expect(this.state).toHaveValue(found.state);
    await this.proceedAddress.click();
  }

  /** Chooses a method that needs no extra details and submits the payment check. */
  async pay(method: PaymentMethod) {
    await this.paymentMethod.selectOption({ label: method });
    await this.finish.click();
  }

  /** Places the order; returns the invoice API status and body so a failure explains itself. */
  async confirmOrder(): Promise<{ status: number; body: string }> {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.url().endsWith('/invoices') && r.request().method() === 'POST'),
      this.finish.click(),
    ]);
    return { status: response.status(), body: await response.text() };
  }
}
