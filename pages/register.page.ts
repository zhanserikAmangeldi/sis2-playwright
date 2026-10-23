import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { User } from '../data/user.factory';
import { IS_BUGGY_BUILD } from '../env';

export class RegisterPage extends BasePage {
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly dob: Locator;
  private readonly country: Locator;
  private readonly postalCode: Locator;
  private readonly houseNumber: Locator;
  private readonly street: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly phone: Locator;
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dob = page.getByTestId('dob');
    this.country = page.getByTestId('country');
    // The older (buggy) build has one "address" field and calls the postal code "postcode".
    this.postalCode = page.getByTestId('postal_code').or(page.getByTestId('postcode'));
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street').or(page.getByTestId('address'));
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('register-submit');
  }

  async open() {
    await this.goto('/auth/register');
  }

  async register(user: User) {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.dob.fill(user.dob);
    await this.country.selectOption({ label: user.address.country });
    await this.postalCode.fill(user.address.postalCode);
    if (IS_BUGGY_BUILD) {
      await this.street.fill(`${user.address.street} ${user.address.houseNumber}`);
    } else {
      await this.houseNumber.fill(user.address.houseNumber);
      // Postcode lookup may pre-fill this; we set our own value afterwards either way.
      await this.street.fill(user.address.street);
    }
    await this.city.fill(user.address.city);
    await this.state.fill(user.address.state);
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }
}
