import { test, expect } from '../fixtures/pages.fixture';
import { formatPrice } from '../pages/base.page';
import { IS_BUGGY_BUILD } from '../env';

const CHEAPER = 'Combination Pliers';
const PRICIER = 'Bolt Cutters';

test.describe('TC-04 Compare two products', () => {
  test.skip(IS_BUGGY_BUILD, 'The buggy build is an older version without the product comparison feature');

  test('the comparison shows both products with the prices from their pages, and bolt cutters cost more than pliers', async ({
    catalogPage, productPage, comparisonPage,
  }) => {
    await catalogPage.open();
    await catalogPage.openProduct(CHEAPER);
    const first = await productPage.details();
    await productPage.addToCompare();

    await catalogPage.open();
    await catalogPage.openProduct(PRICIER);
    const second = await productPage.details();
    await productPage.addToCompare();
    await expect(productPage.comparisonBar).toContainText('2 product(s) selected');

    // The statement this test makes about the two products.
    expect(first.name).toBe(CHEAPER);
    expect(second.name).toBe(PRICIER);
    expect(second.price).toBeGreaterThan(first.price);

    // The catalogue card shows the same price as the product page.
    await catalogPage.open();
    await catalogPage.search(PRICIER);
    await expect(catalogPage.priceOf(PRICIER)).toHaveText(formatPrice(second.price));

    await catalogPage.openComparison();
    await expect(comparisonPage.title).toHaveText('Product Comparison');
    await expect(comparisonPage.productNames).toHaveText([first.name, second.name]);
    await expect(comparisonPage.prices).toHaveText([formatPrice(first.price), formatPrice(second.price)]);
  });
});
