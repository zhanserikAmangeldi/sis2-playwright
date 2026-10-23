# Prompts

## AI tool used

| | |
|---|---|
| Tool | **Claude Code** (Anthropic's CLI coding agent), Windows terminal |
| Model | **Claude Opus 5.5** (`claude-opus-5-5`) |
| Effort | **Medium** |
| Date | 2026-10-23 |
| AI usage level | Level 1 — allowed, with prompts and corrections disclosed (this file + Review.md) |

The agent could read files, run shell commands (npm, Playwright) and open the live site in a
headless browser. It did not have access to GitHub; the repository was pushed by me.

## Prompts, exactly as typed

The conversation was in Russian. Prompts are copied verbatim, with an English translation below
each.

### Prompt 1

```
Прочитай файл task.md и скажи что нужно сделать по нему
```
> *Read task.md and tell me what needs to be done.*

### Prompt 2

```
прочитай файл week_6_masters_st (1).pptx
```
> *Read the file week_6_masters_st (1).pptx* (the week 6 lecture slides with the SIS 2 brief).

### Prompt 3

```
здавай вопросы мне для полного понимания задачи что надо и потом только начинай, но в моменте разработки так же задавай вопросы для уточнения
```
> *Ask me questions so you fully understand the task — what is needed and how — and then start;
> keep asking clarifying questions during development too.*

### Prompt 4

(the session was interrupted once; this resumed it)

```
продолжай работу
```
> *Continue the work.*

## My answers to the AI's clarifying questions

The AI asked multiple-choice questions before and during development. My choices:

| Question | My answer |
|---|---|
| Language for the tests | TypeScript |
| Language for the documentation | English |
| GitHub repository | Local git only — I create and push the GitHub repo myself |
| AI tool to name in Prompt.md | Claude Code + Opus 5.5 |
| TC-04: what to assert | Catalogue prices = product page prices |
| Browsers | Chromium + Firefox + WebKit |
| Extras | Screenshots of the report; run against the with-bugs build |
| Project folder | Sub-folder `sis2-playwright` |
| Seeded account is locked — which user? | Our own user created through the API |
| The site has a comparison page — TC-04 design | Product pages + the comparison page |
| Reset confirmation shows an untranslated key | Assert success + no error; document the bug in Review.md |
| How far to adapt the suite to the with-bugs build | Full support for both builds |
| Buy test product can sell out on the shared stock | First in-stock product from the catalogue |

Why these prompts: I gave the AI the assignment documents themselves (task.md and the slides)
instead of paraphrasing them, so it worked from the real grading criteria. I asked it to question
me instead of guessing, so the decisions in the suite (which user, what to assert, which browsers)
are mine and I can defend them.
