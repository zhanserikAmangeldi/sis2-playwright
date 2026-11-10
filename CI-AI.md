# AI usage — SIS 2 CI pipeline

The first part of SIS 2 (the test suite) is documented in [Prompt.md](Prompt.md) and
[Review.md](Review.md). This file covers only the CI part.

## AI tool used

| | |
|---|---|
| Tool | **Claude Code** (Anthropic's CLI coding agent), macOS terminal |
| Model | **Claude Opus 5.5** (`claude-opus-5-5`) |
| Date | 2026-11-09 |

## Prompts, exactly as typed

### Prompt 1

```
Summarize and give instructions with proper structure.
``` 

The AI summarised the six requirements and the plan.


### Prompt 2

```
Проверь причину падения тестов: [вставил все логи]
```

The log of shard 4 pasted from GitHub Actions: `auth.setup.ts` timed out waiting for
`getByTestId('email')`, three times.

### Prompt 3

```
Посмотри этот `error-context.md` с ошибкой
```

The AI read the `error-context.md` files inside it: the page snapshot was Cloudflare's
*"Performing security verification"* page. It offered three options (run the Toolshop in Docker
in CI / a self-hosted runner on my Mac / leave it red and explain); **I chose Docker**.

### Prompt 4

```
можешь помочь с шардами, долго все в ручную запускать, тебе нужно все автоматом запускать по одному(конечно же меняя конфу)
```

The AI then switched the matrix to 1 shard, pushed, triggered `workflow_dispatch` three times
**one after another** (the workflow's `concurrency: cancel-in-progress` would cancel parallel
runs on the same branch), restored 4 shards and repeated. Durations were read from the GitHub
API (job and step start/finish times), and the medians written into the README.

### Prompt 5 

```
Распиши все что мы сделали в md файлы
```

The AI made changes in markdown files.

## What the AI done

- Report what I need to do step by step.
- Helped with fixing bugs that not connected directly to the task
- Automated process of running with diff shards

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
