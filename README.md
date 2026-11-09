# SIS 2 — Playwright test suite for the Toolshop

[![Playwright Tests](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/workflows/playwright.yml)

Automated UI tests for **https://practicesoftwaretesting.com** (the Toolshop demo shop), written in
**TypeScript** with **Playwright Test**. Five test cases from the SIS 2 brief, run in
Chromium, Firefox and WebKit.

| Document | What it contains |
|---|---|
| [Description.md](Description.md) | Goal, scope and the list of test cases with steps and expected results |
| [Prompt.md](Prompt.md) | The exact prompts given to the AI tool, and which tool/model was used |
| [Review.md](Review.md) | What the AI produced, how it was reviewed and corrected, and why |
| [screenshots/](screenshots) | Run reports and evidence of bugs found in the buggy build |
| [CI-AI.md](CI-AI.md) | CI part: AI tool, model, prompts, and how the AI output was checked |

## How to run

Requires Node.js 18+.

```bash
npm install
npx playwright install          # browsers, first time only
npx playwright test             # all 5 test cases × 3 browsers
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run test:chromium` | Chromium only (fastest) |
| `npm run test:ui` | Playwright UI mode — watch, time-travel, pick locators |
| `npm run test:bugs` | Runs the suite against the deliberately buggy build (`with-bugs.practicesoftwaretesting.com`) |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | TypeScript type check |

No account setup is needed: every test creates the users it needs.

## CI

[![Playwright Tests](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/workflows/playwright.yml)

**CI system:** GitHub Actions. It is built into GitHub, where the repository already lives, needs
no server of its own, is free for public repositories and supports matrices for sharding.

**Pipeline** (`.github/workflows/playwright.yml`):
- runs on every push and pull request (no branch filter), plus manual runs (`workflow_dispatch`);
- `npm ci` with the npm cache (`actions/setup-node`, `cache: npm`), then
  `npx playwright install --with-deps` (Chromium, Firefox, WebKit + system libraries);
- the full suite, no `--grep` / `--project` filters, split into 4 shards (`--shard=i/4`) running in
  parallel, `fail-fast: false`;
- the `merge-reports` job merges the shards' blob reports into one HTML report and one JUnit file
  (`merge.config.ts`);
- artefacts: `playwright-report` (HTML), `test-results-N` (traces, screenshots, videos, per-shard
  JUnit), `junit-report` (merged JUnit); kept for 14 days. They are uploaded even when tests fail.

**CI settings** (`playwright.config.ts`, when `CI=true`): `forbidOnly: true`, `retries: 2`,
`workers: 2`, reporters `list`, `blob`, `junit`; always `trace: 'on-first-retry'`,
`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

**Evidence runs** (on demo branches that are never merged):
- [`demo/forbid-only`](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42695457176): a forgotten `test.only` fails CI with
  *"item focused with '.only' is not allowed due to the 'forbidOnly' option"*.
- [`demo/flaky-trace`](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42703046471): a test that fails on its first attempt passes on the
  retry; the run stays green, the test is reported as *flaky*, and `test-results-2…4` contain
  the `trace.zip` of the failed attempt (opens in [trace.playwright.dev](https://trace.playwright.dev)).
  Green runs have no traces, by design: `trace: 'on-first-retry'`.

**Application under test in CI.** The public site `practicesoftwaretesting.com` is behind
Cloudflare, which answers GitHub-hosted runners with a *"Performing security verification"* page
instead of the shop (the first CI run failed on it: `auth.setup.ts` waited 60 s for the login
form, three times). Locally the same suite passed, because a home IP is not challenged. So in CI
every shard starts its own Toolshop from the official prebuilt images
(`testsmith/practice-software-testing-sprint5-api/ui:2.5` + the official `nginx` with the
project's own config, see `ci/toolshop.compose.yml`), seeds the
database (`ci/start-toolshop.sh`) and runs against `BASE_URL=http://localhost:4200`,
`API_URL=http://localhost:8091`. Bonus: each shard has its own clean database, and the run no
longer depends on a shared public site. Without these variables (on a dev machine) the tests
still target the public site.

**Note on shards.** `auth.setup.ts` is a project dependency, so it runs once in every shard that
contains browser tests (22 tests locally = 25 in CI across 4 shards). This is expected.

### Runtime

| Configuration | Total run time | Run tests step (slowest shard) | Run |
| --- | --- | --- | --- |
| 1 job, no sharding | 2 min 37 s | 45 s | [run](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42699808000) |
| 4 shards + merge | 2 min 29 s | 25 s | [run](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42700944189) |

Median of 3 runs via `workflow_dispatch` on GitHub-hosted `ubuntu-latest`, 22 tests
(setup + 7 tests × 3 browsers). All runs:

| Configuration | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- |
| 1 shard — total / tests | [3:03 / 45 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42698818834) | [2:28 / 38 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42699345264) | [2:37 / 48 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42699808000) |
| 4 shards — total / slowest tests | [2:29 / 28 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42700944189) | [2:42 / 19 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42701411089) | [2:13 / 25 s](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42701894152) |

**Conclusion:** sharding cut the test step by ~45 % (45 s → 25 s), but the whole run by only ~5 %
(2:37 → 2:29), because the suite is small and every shard pays the same ~80–90 s of fixed setup
(browsers ≈ 40 s, starting and seeding the Toolshop ≈ 40 s) plus a ~15 s merge job, while using
~4× the runner minutes. Sharding pays off once the test step, not the setup, dominates the run.

Two more observations from the runs:
- Shards are not perfectly even: the shard that gets the checkout and comparison tests takes
  ~25–30 s, the others ~13 s.
- One earlier push run took 19.5 min because a single shard's `apt` download of browser
  dependencies hung for 18 min ([run](https://github.com/zhanserikAmangeldi/sis2-playwright/actions/runs/42681408093)) — a runner hiccup, and the reason the
  table uses medians of `workflow_dispatch` runs.

### Running locally in CI mode

```bash
npm ci
npx playwright install --with-deps
./ci/start-toolshop.sh                       # needs Docker; same app as in CI
BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 CI=true npx playwright test
docker compose -f ci/toolshop.compose.yml down -v   # stop and wipe the app
```

Shards + merge, as in CI:

```bash
mkdir -p all-blob-reports
for i in 1 2 3 4; do BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 CI=true npx playwright test --shard=$i/4 && cp blob-report/*.zip all-blob-reports/; done
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
npx playwright show-report
```

## What is covered

| # | Spec | Test case | What it proves |
|---|---|---|---|
| TC-01 | `tests/register.spec.ts` | Register a new customer | A unique account is created through the UI, the user lands on the login page and **can sign in with the new credentials** |
| TC-02 | `tests/login.spec.ts` | Log in | Valid credentials open *My account* showing the user's name; a wrong password shows *Invalid email or password* and the user stays signed out |
| TC-03 | `tests/buy-product.spec.ts` | Buy a product | Quantity 2 of an in-stock product → cart shows the right item, quantity, line total and cart total → checkout completes with an `INV-…` invoice number |
| TC-04 | `tests/compare-products.spec.ts` | Compare two products | Name and price captured on two product pages match the catalogue card and the app's *Product Comparison* table; stated comparison: *Bolt Cutters cost more than Combination Pliers* |
| TC-05 | `tests/reset-password.spec.ts` | Reset a password | A known email gets a confirmation (HTTP 200, no error); an unknown email gets *The selected email is invalid.* (HTTP 422) |

Result on the production build: **22/22 passed** (setup + 7 tests × 3 browsers); also repeated
3× in a row with no failures. See [screenshots/01-report-production-all-browsers.png](screenshots/01-report-production-all-browsers.png).

## Project structure

```
tests/                     one spec per test case, plus auth.setup.ts
  auth.setup.ts            registers a buyer once and saves the signed-in session
  register.spec.ts  login.spec.ts  buy-product.spec.ts
  compare-products.spec.ts  reset-password.spec.ts
pages/                     one page object per screen
  base.page.ts             header, toasts, comparison bar, routing, price helpers
  login / register / account / forgot-password / catalog / product
  comparison / cart / checkout .page.ts
fixtures/pages.fixture.ts  page objects + newUser / registeredUser fixtures
data/user.factory.ts       fresh, unique user for every call
data/users.api.ts          creates accounts through the REST API (preconditions only)
env.ts                     target URLs (production or buggy build)
playwright.config.ts
```

## Design decisions

**Page objects hold every locator.** Specs never call `getBy…`; they call business actions
(`loginPage.signIn(user)`, `checkoutPage.continueWithSavedAddress()`) and assert on locators the
page object exposes. The test says *what*, the page object says *how*.

**Fixtures instead of `new XxxPage(page)`.** `fixtures/pages.fixture.ts` hands every page object to
the tests, plus two data fixtures: `newUser` (does not exist yet) and `registeredUser` (created via
the API before the test).

**`data-test` attributes.** `testIdAttribute: 'data-test'` in the config makes `getByTestId` use
the app's own test hooks. All attribute names were taken from the live app, not from tutorials.
Where no test id exists, role-based locators are used (`getByRole('link')`, `getByRole('alert')`).
No CSS classes, no XPath.

**No shared seeded accounts.** The brief suggests `customer@practicesoftwaretesting.com`, but
that account was **locked** ("Account locked, too many failed attempts") because many students
type wrong passwords into it. A suite that depends on it fails for reasons outside our control.
Every test therefore creates its own user through the API — fast, isolated, and safe to run in
parallel.

**Log in once.** `auth.setup.ts` runs before the browser projects: it registers a buyer, signs in
through the UI and saves the session to `playwright/.auth/buyer.json`. The buy test starts
already signed in. The login test still logs in through the UI, because login is its subject.

**Unique data every run.** `createUser()` builds an email from a timestamp plus a random suffix,
so registration never hits "email already exists".

**No `waitForTimeout`.** Every wait is a web-first assertion, `waitForURL`, or a wait for a
specific network response.

**Robust against a shared, live shop.**
- The buy test picks the **first in-stock product** instead of a hard-coded one: stock is shared
  by everyone and a fixed product eventually sells out (this happened during development).
- Products with a "one per cart" rule (Thor Hammer) are excluded from the buy test.
- The reset-password test uses its own fresh account, because on this app a reset **really
  changes the password** — running it on a shared account would lock others out.

**Checkout address.** The address step runs a postcode lookup that overwrites street/city/state,
and the invoice API accepts *only* the looked-up values. The page object does not type over
them: it asks the same (deterministic) lookup endpoint and waits until the form shows that answer.

**Diagnosable failures.** `confirmOrder()` returns the invoice API status and body, so a failing
checkout prints the server's reason instead of just "element not found".

## Running against the buggy build

`npm run test:bugs` targets `with-bugs.practicesoftwaretesting.com`. That build is an **older
version** of the app (hash routing, older register form and API, no comparison feature), so the
suite supports both: routing goes through `BasePage.goto()`, renamed elements use `.or()`
locators, and the comparison test is skipped there with a stated reason.

Result: **4 failed, 3 passed, 1 skipped**, and every failure is a real bug in that build:

| Test | Bug caught |
|---|---|
| TC-01 Register | Country *Kazakhstan* is selected but the form says *Country is required*; labels *Country* and *State* are swapped |
| TC-02 Log in (valid) | Header shows *User Data not found* instead of the user's name |
| TC-03 Buy | Adding to cart shows *Oeps, something went wrong.*; the cart line total shows `$00.00` |
| TC-05 Reset (unknown email) | An unknown email gets *Your password is successfully updated!* (HTTP 200) instead of an error |

Evidence: [screenshots/](screenshots) 02–06.

## What is deliberately not automated

- **Payment methods other than Cash on Delivery** — they only add form fields; one method proves the flow.
- **Guest checkout** — the brief's buy case is about a customer; guest flow is a separate case.
- **Email delivery of the reset link** — the app is a demo with no mailbox we can read.
- **Exact text of the reset confirmation** — production shows an untranslated key
  (`page.forgot-password.confirm`), a bug. The test asserts success (HTTP 200, a visible message,
  no error) rather than pinning the broken text. See Review.md.
