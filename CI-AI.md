# AI usage — SIS 2 CI pipeline

The first part of SIS 2 (the test suite) is documented in [Prompt.md](Prompt.md) and
[Review.md](Review.md). This file covers only the CI part.

## AI tool used

| | |
|---|---|
| Tool | **Claude Code** (Anthropic's CLI coding agent), macOS terminal |
| Model | **Claude Opus 5.5** (`claude-opus-5-5`) |
| Date | 2026-11-09 |

The agent could read files and run shell commands (npm, Playwright) on my machine. It did not have
access to GitHub: pushing, opening the PR and collecting run timings were done by me.

## Prompts, exactly as typed

### Prompt 1

```
прочитай файл и скажи что нам надо сделать
```
> *Read the file and tell me what we need to do.* (The file was the assignment PDF
> "SIS 2: CI pipeline for Playwright — step-by-step guide".)

The AI summarised the six requirements and the plan, and asked for the repository.

### Prompt 2

```
все добавил
```
> *I've added everything.* (I had copied the `sis2-playwright` repository into the folder.)

### Prompt 3

```
норм если тесты падают?
```
> *Is it OK if the tests fail?* (After the first push, CI was red.) The AI answered no — the
> guide requires a green run — and asked for the logs.

### Prompt 4

The log of shard 4 pasted from GitHub Actions: `auth.setup.ts` timed out waiting for
`getByTestId('email')`, three times.

### Prompt 5

```
добавил один блоб
```
> *I added one blob.* (I downloaded a `blob-report` artefact into the folder.)

The AI read the `error-context.md` files inside it: the page snapshot was Cloudflare's
*"Performing security verification"* page. It offered three options (run the Toolshop in Docker
in CI / a self-hosted runner on my Mac / leave it red and explain); **I chose Docker**.

### Prompt 6

The log of the next CI run, pasted: `./ci/start-toolshop.sh` failed with
`http://localhost:8091/status did not start` and `exec format error` for `web` and `cron`.

### Prompt 7

```
можешь с этим помочь
```
> *Can you help with this?* (about the timing step: 1 shard vs 4 shards, 2–3 runs each.)

The AI installed the GitHub CLI; I logged in myself (`gh auth login`) and wrote:

```
готово, работать разрешено только с этим репо, в другие даже не смей заглядывать
```
> *Done; you may work only with this repository, don't even look at the others.*

The AI then switched the matrix to 1 shard, pushed, triggered `workflow_dispatch` three times
**one after another** (the workflow's `concurrency: cancel-in-progress` would cancel parallel
runs on the same branch), restored 4 shards and repeated. Durations were read from the GitHub
API (job and step start/finish times), and the medians written into the README.

## What the AI produced

- `playwright.config.ts`: a CI branch on `process.env.CI` (`forbidOnly`, `retries: 2`,
  `workers: 2`, reporters `list` + `blob` + `junit`, `video: 'retain-on-failure'`); the local
  reporters are unchanged.
- `merge.config.ts`: HTML + merged JUnit reporters for `playwright merge-reports`.
- `.github/workflows/playwright.yml`: push / pull_request / workflow_dispatch, npm cache, browsers
  with system deps, 4-shard matrix, artefact uploads (14 days), a `Merge reports` job.
- `ci/toolshop.compose.yml` + `ci/start-toolshop.sh` + `ci/nginx.conf`: the Toolshop from the official
  prebuilt images, started and seeded in every shard (after the Cloudflare problem, below).
- `env.ts`: `??` → `||` for `BASE_URL` / `API_URL` (see below).
- `.gitignore`: `reports/`, `all-blob-reports/`, `.act-artifacts/`, `.secrets`.
- README: badge, the CI section and an empty timing table.

## How the output was checked (locally, before the first push)

1. `npm ci` from the lock file, `npx tsc --noEmit`: clean.
2. `CI=true npx playwright test --list --shard=i/4` for i = 1..4: every test lands in a shard.
3. All 4 shards run in CI mode, then `merge-reports`: 7 + 6 + 6 + 6 passed;
   `reports/junit-merged.xml` → `tests="25" failures="0"`.
4. `forbidOnly`: a temporary spec with `test.only` made the CI-mode run fail with
   *"item focused with '.only' is not allowed due to the 'forbidOnly' option"*. The file was
   deleted afterwards.

## Problems found and decisions

| # | Issue | Decision / fix | Why |
|---|---|---|---|
| 1 | The guide's workflow passes `BASE_URL: ${{ vars.BASE_URL }}`. If the variable is not set, GitHub passes an **empty string**, and `env.ts` used `??`, which only falls back on `undefined` → `baseURL` would be `''` and every test would fail. | `env.ts` uses `\|\|`, so an empty value falls back to production | Lets the workflow keep the variable hook without making it mandatory |
| 2 | The guide installs only Chromium, but this suite runs **Chromium, Firefox and WebKit**. Installing only Chromium would break the other projects; filtering with `--project` would break "full suite, no filters". | `npx playwright install --with-deps` (all browsers) | The full suite is the requirement; three browsers also make sharding more meaningful |
| 3 | `auth.setup.ts` is a project dependency. With sharding it runs in every shard that needs it (22 tests → 25 across 4 shards). | Kept and documented in the README | Each shard is a separate machine and needs its own signed-in session |
| 4 | The suite already had `fullyParallel`, `forbidOnly`, `retries` on `CI`. | Moved to one `isCI` constant; added the CI reporters | No behaviour change locally |
| 5 | **First CI run was red.** The blob report's page snapshot showed Cloudflare's *"Performing security verification"* page: the public site blocks GitHub-hosted runners. The API (not behind Cloudflare) worked, so the user was registered, but the login form never appeared. Locally (home IP) everything passed. | Every shard starts its own Toolshop in Docker (official images, pinned to `2.5`), seeds the DB and tests `localhost`. Checked locally first: stack up in ~16 s, then 22/22 passed in all 3 browsers. | Bypassing a site's bot protection is not acceptable; testing our own copy of the app is the clean fix and makes each shard independent |

| 6 | **Second CI run: API did not start.** `web` and `cron` failed with `exec format error`: their `latest` images on Docker Hub are built for **arm64 only** (it worked on my Apple Silicon Mac, not on GitHub's amd64 runners). | `web` is just `nginx:1.23.3-alpine` + their `vhost.conf`, so CI uses the official multi-arch nginx with a copy of that config (`ci/nginx.conf`). `cron` (background jobs) is dropped: no test depends on it. Verified 22/22 without it, and checked with `docker manifest inspect` that every remaining image exists for amd64. | Lesson: "works on my machine" also applies to CPU architecture |

Re-check after the Docker change: `./ci/start-toolshop.sh` from scratch, then
`CI=true npx playwright test` against `localhost` → 22/22 passed (Chromium, Firefox, WebKit).

## What only GitHub can verify

- Runs for a push to a feature branch and for the PR.
- "Cache restored" in the `setup-node` log of the second run.
- Artefacts on the run page; a trace opened in trace.playwright.dev.
- Timing table: 1 shard vs 4 shards, median of 3 `workflow_dispatch` runs (collected by the AI
  through `gh`, links in the README).
- Badge on `main` after the merge.
