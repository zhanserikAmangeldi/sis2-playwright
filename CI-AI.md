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

## What the AI produced

- `playwright.config.ts`: a CI branch on `process.env.CI` (`forbidOnly`, `retries: 2`,
  `workers: 2`, reporters `list` + `blob` + `junit`, `video: 'retain-on-failure'`); the local
  reporters are unchanged.
- `merge.config.ts`: HTML + merged JUnit reporters for `playwright merge-reports`.
- `.github/workflows/playwright.yml`: push / pull_request / workflow_dispatch, npm cache, browsers
  with system deps, 4-shard matrix, artefact uploads (14 days), a `Merge reports` job.
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

## What only GitHub can verify (done by me)

- Runs for a push to a feature branch and for the PR.
- "Cache restored" in the `setup-node` log of the second run.
- Artefacts on the run page; a trace opened in trace.playwright.dev.
- Timing table: 1 shard vs 4 shards, median of 3 `workflow_dispatch` runs.
- Badge on `main` after the merge.
