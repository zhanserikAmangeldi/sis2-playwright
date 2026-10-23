import { test, expect } from '../fixtures/pages.fixture';
import { formatPrice } from '../pages/base.page';
import { AUTH_FILE } from '../env';

// Starts already signed in as the buyer created by auth.setup.ts.
test.use({ storageState: AUTH_FILE });

const QUANTITY = 2;
// The shop allows only one of these per cart, so they cannot be bought twice.
const ONE_PER_CART = ['Thor Hammer'];

test.describe('TC-03 Buy a product', () => {
  test('a signed-in customer buys two of an in-stock product and gets an invoice', async ({
    catalogPage, productPage, cartPage, checkoutPage,
  }) => {
    await catalogPage.open();
    await catalogPage.openFirstAvailableProduct(ONE_PER_CART);
    const product = await productPage.details();

    await productPage.setQuantity(QUANTITY);
    await productPage.addToCart();
    await expect(productPage.toast).toContainText('Product added to shopping cart');
    await expect(productPage.cartQuantity).toHaveText(String(QUANTITY));

    await cartPage.open();
    const line = cartPage.item(product.name);
    await expect(line.title).toHaveText(product.name);
    await expect(line.quantity).toHaveValue(String(QUANTITY));
    await expect(line.lineTotal).toHaveText(formatPrice(product.price * QUANTITY));
    await expect(cartPage.total).toHaveText(formatPrice(product.price * QUANTITY));

    await cartPage.proceed();
    await checkoutPage.continueWithSavedAddress();
    await checkoutPage.pay('Cash on Delivery');
    await expect(checkoutPage.paymentSuccess).toHaveText('Payment was successful');

    const invoice = await checkoutPage.confirmOrder();
    expect(invoice.status, invoice.body).toBe(201);
    await expect(checkoutPage.orderConfirmation).toHaveText(/Your invoice number is INV-\d+/);
  });
});
