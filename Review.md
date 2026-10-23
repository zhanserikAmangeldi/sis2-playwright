# Review of the AI output

> Draft written with the AI from the session log. **Read it, and change anything that does not
> match how you reviewed the work** — this section is graded as *your* review.

## What the AI produced

- A summary of the assignment (task.md + week 6 slides), including two contradictions between
  them (deadline: Oct 23 vs "week 8"; submission: Google Form vs course chat).
- Clarifying questions before starting and at each decision point (see Prompt.md).
- Exploration scripts that opened the live site and listed the real `data-test` attributes,
  messages and API calls for every flow. These were throw-away and are not in the repository.
- The suite: config, data factory, API helper, 9 page objects, a fixture file, an auth setup
  and 5 specs, then README / Description / this file.

## How I reviewed it

1. **Ran everything, repeatedly.** Not "it ran once": the full suite on 3 browsers with
   `--repeat-each=3` (64 runs, 0 failures) and again `--repeat-each=2` after the last change
   (43/43).
2. **Checked the grading rules mechanically** with grep: no `getBy…`/`locator(` in any spec, no
   `waitForTimeout` anywhere, no CSS classes or XPath in page objects.
3. **Ran the suite against the buggy build** to see whether the assertions catch real bugs or
   just pass.
4. **Read every assertion** and asked: could this ever fail? Is it checking what the test name
   claims?

## Problems found and corrected

Each of these was found by running the tests or inspecting the live app, not by reading the code.

| # | Problem | How it showed up | Correction | Why |
|---|---|---|---|---|
| 1 | The seeded account from the slides (`customer@…`) was **locked** by other students' failed logins. The first exploration script also tried a wrong password on it, which was a mistake on a shared account. | Login returned *Account locked, too many failed attempts* | Every test creates its own user via the API (`registeredUser` fixture); `auth.setup.ts` creates its own buyer | A suite that depends on a shared, lockable account fails for reasons outside our control, which would score zero if it happens while grading |
| 2 | **Password reset really changes the password** on this app | After a reset in exploration, logging in with the old password returned 401 | The reset test uses its own fresh user, never a shared or setup user | Otherwise TC-05 would break TC-02/TC-03 when run in parallel |
| 3 | TC-04 first version checked the catalogue price **while on the product page** | Spotted in code review before the first run | Re-open the catalogue and search before asserting; moved the comparison bar to `BasePage` because it is on every page | The assertion would have been looking at the wrong page |
| 4 | Buy test used *Thor Hammer* with quantity 2 | Toast *You can only have one Thor Hammer in the cart* | Excluded products with a one-per-cart rule | It is a business rule of the shop, not a bug |
| 5 | **Flaky checkout** in Firefox/WebKit (passed in Chromium) | Stuck after *Payment was successful*. The trace showed `POST /invoices` → 422: *The city does not belong to the selected country* | The address step runs a **postcode lookup** that overwrites street/city/state, and the API accepts only those values. The first fix (type our own address) raced with the lookup. The second (catch the page's lookup request) failed in WebKit, which sometimes fires it before the step is visible. Final version: the page object asks the same deterministic lookup endpoint itself and waits until the form shows that answer | Removes the timing dependency entirely: 15/15, then 64/64 runs green |
| 6 | Failing checkout gave no reason ("element not found") | Diagnosing #5 | `confirmOrder()` returns the invoice API status + body; the spec asserts `201` with the body as message | The next failure explains itself in one line |
| 7 | **Hard-coded product sold out** (shared stock) | Quantity input disabled, *Out of stock* | Buy test picks the first in-stock product from the catalogue and uses its captured name/price | A live public shop's stock changes; the test must not depend on one product |
| 8 | TypeScript 7 rejected `moduleResolution: node` | `tsc` error TS5108 | `module: esnext`, `moduleResolution: bundler` | Keeps `npm run typecheck` clean |
| 9 | Buggy build could not even start: setup failed | Register API 422: names with digits rejected, address must be a string | Letters-only last-name suffix; older flat address payload for that build | Needed to see what the assertions catch there |
| 10 | Buggy build is an **older version** of the app (hash routes, renamed fields, no comparison) | 7/7 tests failed on missing locators, which proves nothing about our assertions | `BasePage.goto()` adds the `#` prefix; `.or()` locators for renamed elements; TC-04 skipped there with a stated reason | After this, every remaining failure on that build is a real bug (table below) |

## Decisions I made deliberately

- **Reset confirmation text.** Production shows the untranslated key `page.forgot-password.confirm`
  instead of a sentence — a real (small) bug. I chose to assert *success* (HTTP 200, a message is
  visible, it is not an error) rather than the exact text. Pinning the broken key would make the
  test pass *because of* the bug; asserting the "correct" text would make the suite red on
  production for a cosmetic issue. Documented here instead.
- **Assertions on the API response** in TC-03 (invoice 201) and TC-05 (200 / 422): the UI message
  alone was not enough to tell success from failure (see #5 and the reset bug).
- **Registering preconditions through the API, but TC-01 through the UI.** Registration via UI is
  what TC-01 tests; for every other test it is only setup, and the API is faster and not flaky.
- **TC-01 also signs in with the new account.** "Redirected to login" alone does not prove the
  account was created.
- **Exposing locators from page objects for assertions** (e.g. `loginPage.error`). Specs contain no
  locator definitions; they only assert on what the page object offers.

## Proof the assertions assert: the buggy build

`npm run test:bugs` → 4 failed, 3 passed, 1 skipped. Every failure is a genuine bug:

| Test | Bug caught | Screenshot |
|---|---|---|
| TC-01 | *Kazakhstan* selected but *Country is required*; labels Country/State swapped | 03 |
| TC-02a | Header shows *User Data not found* instead of the user's name | 05 |
| TC-03 | *Oeps, something went wrong.* when adding to cart; line total `$00.00` while the cart total is `$28.30` | 04 |
| TC-05b | Unknown email → *Your password is successfully updated!* (HTTP 200) | 06 |

Other bugs noticed in that build while exploring, not covered by these five tests: the register
API **returns the password hash** in its response (security issue); search for *Combination Pliers*
returns 26 products; typos *Sorth* and *Serch*; a menu item labelled *UNDEFINED*.

## What the AI got wrong or I would not accept blindly

- It ran a wrong-password login on the shared seeded account during exploration (#1). On a
  shared system that is not harmless.
- Its first two fixes for the checkout flakiness were timing-dependent (#5); only repeated runs
  across browsers exposed that.
- It initially hard-coded products (#4, #7) and only switched after the live shop proved the
  assumption wrong.

None of these would have been visible from a single green run in Chromium. Repeated runs, three
browsers and the buggy build were what made the review meaningful.
