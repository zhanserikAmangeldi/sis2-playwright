# Description

## Goal

Build an automated UI regression suite for the Toolshop demo shop
(https://practicesoftwaretesting.com) that covers the five business-critical flows from the SIS 2
brief, is structured like a real suite (page objects, fixtures, data factory), and keeps working
on a shared, public application that other people use at the same time.

## Tooling

- **Playwright Test** with **TypeScript** — the reference implementation; runner, fixtures and
  docs are first-class there.
- Browsers: **Chromium, Firefox, WebKit**.
- AI assistant: Claude Code (see [Prompt.md](Prompt.md)), reviewed and corrected as described in
  [Review.md](Review.md).

## Approach

1. **Explore before automating.** Walk every flow on the live site and record the real
   `data-test` attributes, messages and API responses (login, register, reset, cart, checkout,
   comparison).
2. **One page object per screen**, one spec per test case, one fixture file, one data factory.
3. **Independent tests.** Each test creates the data it needs (fresh users via the API), so tests
   pass in any order and in parallel.
4. **Every test asserts something that can fail**, on what the user sees and, where it matters,
   on the API response behind it.
5. **Prove the assertions work** by running the suite against the deliberately buggy build.

## Test cases to automate

### TC-01 Register a new customer — `tests/register.spec.ts`

| | |
|---|---|
| Precondition | Fresh user data with an email that has never been used (data factory) |
| Steps | 1. Open `/auth/register` 2. Fill first/last name, date of birth, country, postal code, house number, street, city, state, phone, email, password 3. Click **Register** 4. Sign in with the new email and password |
| Expected | After step 3 the user is on the login page. After step 4 the user is on *My account* and the header shows their full name |

### TC-02 Log in — `tests/login.spec.ts`

**TC-02a Valid credentials**

| | |
|---|---|
| Precondition | A registered user (created through the API) |
| Steps | 1. Open `/auth/login` 2. Enter the user's email and password 3. Click **Login** |
| Expected | URL is `/account`, page title *My account*, header shows the user's full name |

**TC-02b Wrong password**

| | |
|---|---|
| Precondition | A registered user |
| Steps | 1. Open `/auth/login` 2. Enter the user's email and a wrong password 3. Click **Login** |
| Expected | Error *Invalid email or password*; URL stays `/auth/login`; *Sign in* link visible; no user menu |

### TC-03 Buy a product — `tests/buy-product.spec.ts`

| | |
|---|---|
| Precondition | Signed in as a buyer (session saved once by `auth.setup.ts`) |
| Steps | 1. Open the catalogue and the first in-stock product 2. Note name and unit price 3. Set quantity 2, **Add to cart** 4. Open the cart 5. Proceed → continue as signed-in user → confirm the saved billing address 6. Choose *Cash on Delivery*, check payment 7. Confirm |
| Expected | Toast *Product added to shopping cart*; cart badge 2; cart row shows the product name, quantity 2 and line total = 2 × unit price; cart total matches; *Payment was successful*; invoice API returns 201; confirmation *Thanks for your order! Your invoice number is INV-…* |

### TC-04 Compare two products — `tests/compare-products.spec.ts`

| | |
|---|---|
| Precondition | None (anonymous visitor) |
| Steps | 1. Open *Combination Pliers*, capture name and price, click **Compare** 2. Open *Bolt Cutters*, capture name and price, click **Compare** 3. Search the catalogue for Bolt Cutters 4. Click **Compare Now** |
| Expected | Comparison bar says *2 product(s) selected*; **stated comparison: Bolt Cutters cost more than Combination Pliers**; the catalogue card price equals the product page price; the *Product Comparison* table lists both names and both prices in the order added |

### TC-05 Reset a password — `tests/reset-password.spec.ts`

**TC-05a Known email**

| | |
|---|---|
| Precondition | A registered user of its own (a reset really changes the password) |
| Steps | 1. Open `/auth/forgot-password` 2. Enter the user's email 3. Click **Set New Password** |
| Expected | API answers 200; a confirmation message is shown; it contains no error |

**TC-05b Unknown email**

| | |
|---|---|
| Precondition | An email that was never registered |
| Steps | Same as TC-05a with the unknown email |
| Expected | API answers 422; message *The selected email is invalid.* |

## Out of scope

Other payment methods, guest checkout, reading the reset email, favourites, invoices page,
language switching, visual and performance testing.
