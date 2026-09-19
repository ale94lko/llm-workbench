# Contributing to LLM Workbench

Thanks for helping improve this project. Please also read the [Code of Conduct](CODE_OF_CONDUCT.md) and [GOVERNANCE.md](GOVERNANCE.md).

## Development setup

```bash
git clone https://github.com/ale94lko/llm-workbench.git
cd llm-workbench
cp .env.example .env
npm install
npm run dev
```

Or start the production-like stack with Docker:

```bash
cp .env.example .env
docker compose up --build
curl -fsS http://localhost:3000/api/health
```

The app is then available at [http://localhost:3000](http://localhost:3000).

### Fresh clone verification

To validate a clean checkout (lockfile install → build → coverage) without relying on a dirty workspace:

```bash
npm run verify:fresh
```

Wrappers: `scripts/verify-fresh-clone.sh` (Unix) and `scripts/verify-fresh-clone.ps1` (Windows). See [docs/dev-notes.md](docs/dev-notes.md).

**Unit tests do not need live providers or Ollama.** The default Vitest suite uses happy-dom and mocked `fetch` (no API keys, no local LLM server).

## Quality checks

Run these before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run check:headers
npm test
```

Coverage report:

```bash
npm run test:coverage
```

CI runs lint, typecheck, tests with coverage, `npm audit --audit-level=moderate`, and **commitlint** on every pull request.

### CI vs GitHub Pages deploy

- **`CI`** (`.github/workflows/ci.yml`) is the quality gate on pull requests and pushes to `main`: `quality` (audit, lint, typecheck), a dedicated `test` job (`npm run test:coverage`), `fresh` (`npm run verify:fresh` on a clean runner), plus `docker-smoke` (Compose boot + `/api/health`).
- **`Deploy to GitHub Pages`** (`.github/workflows/deploy-pages.yml`) does **not** re-run that gate on push to `main`. It starts via `workflow_run` after a successful **CI** run that was a **push to `main`**, checks out that exact commit, then only generates and publishes the static site.
- Failed CI on `main` blocks deploy. Manual `workflow_dispatch` on the deploy workflow still runs the full quality steps before `npm run generate`, so a broken site cannot be published that way either.
- Vitest uses `pool: 'threads'` with `isolate: false` to cut happy-dom startup cost; `tests/setup.ts` resets storage per test. Prefer not to rely on order-dependent global state.
- Coverage thresholds enforce lines/functions/statements (≥90%) and branches (≥80%) via `vitest.config.ts` (`perFile: false`). Unmet thresholds make `npm run test:coverage` exit non-zero, so the CI `test` / `fresh` jobs fail. Do not lower thresholds just to pass.

### Smoke E2E (static Pages output)

Optional browser smoke against the static site (does **not** block PR merge):

```bash
npm run generate
npx playwright install chromium   # first time only
npm run test:e2e:smoke
```

- Workflow: `.github/workflows/smoke-e2e.yml` (nightly + `workflow_dispatch` + path-filtered PRs) uses `continue-on-error: true`.
- Covers Compare home, Settings vault copy, and History empty state on `.output/public`.
- Provider / local LLM hosts are aborted in the browser so the smoke never makes live model calls.

## Commit style (Conventional Commits)

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(optional-scope): <short summary>

[optional body]
```

Allowed types:

| Type | Use when |
| :--- | :--- |
| `feat` | A new user-facing capability |
| `fix` | A bug fix |
| `test` | Adding or updating tests only |
| `docs` | Documentation-only changes |
| `chore` | Maintenance (deps, tooling, misc) |
| `ci` | CI/CD workflow changes |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `build` | Build system or packaging changes |
| `style` | Formatting with no code behavior change |

Examples:

- `feat: add typed StreamError for stream failures`
- `fix(stream): handle missing response body`
- `test: cover LatencyTimeline comparison bars`
- `docs: document conventional commits in CONTRIBUTING`
- `ci: add commitlint on pull requests`

### Feature + test pairing

- Ship each **feature** or **fix** with the **tests that pin it** in the same PR (and preferably the same focused commit). Example: `app/lib/*.ts` with `tests/*.test.ts`.
- Prefer small, reviewable PRs. Do **not** mix bulk formatting, unrelated refactors, and features in one change.
- If a change is docs- or CI-only, a `docs:` / `ci:` commit without new product tests is fine.
- **Sustained history:** keep this pairing over weeks and months so the repo shows incremental, testable maintenance — not a one-sprint burst. Do **not** farm artificial commits or fake co-authors. See [`docs/maintenance.md`](docs/maintenance.md).

Pull request commits are checked by the `commitlint` CI job (Dependabot PRs are exempt).

## Coding standards

Primary languages are TypeScript, Vue 3 SFC, and JavaScript:

- **TypeScript / Vue / JavaScript** — ESLint flat config [`eslint.config.mjs`](eslint.config.mjs) via `@nuxt/eslint` (`npm run lint`). CI fails on lint errors.
- **Types** — `npm run typecheck` (`nuxt typecheck` / vue-tsc). Treat new type errors as failures, not as something to `as any` away.
- **User-facing strings** — add chrome copy to [`app/i18n/en.ts`](app/i18n/en.ts) and read it through `useI18n()` so the UI stays localizable.

Contributions must generally comply with these tools. Do not disable rules to hide new issues without maintainer review. Rare exceptions MUST be documented at the location (ESLint comment with a reason).

## Developer Certificate of Origin (DCO)

By contributing, you certify that you have the right to submit the work under the project license. Include a Signed-off-by line in each commit (see the [DCO](https://developercertificate.org/)):

```text
Signed-off-by: Your Name <you@example.com>
```

Example: `git commit -s -m "feat: …"`.

The CI `dco` job runs [`scripts/check-dco.mjs`](scripts/check-dco.mjs) on pull request commits (Dependabot PRs are exempt).

## Formal test policy

As **major new functionality** is added, tests for that functionality **MUST** be added to the automated suite (Vitest under `tests/**/*.test.ts`). Ship each feature or fix with the tests that pin the new behavior in the **same** focused commit or PR.

Prefer **regression tests** when fixing bugs. Target: at least **50%** of bugs fixed in any six-month window get an automated regression test. Do not rewrite old history to invent that pairing.

Statement coverage is enforced at **≥ 90%** statements/lines/functions (and **≥ 80%** branches) via Vitest thresholds in [`vitest.config.ts`](vitest.config.ts) (`npm run test:coverage`).

## Small tasks

The project keeps an ongoing set of **small, self-contained** tasks so new contributors can land a first change without a large design discussion.

- Browse issues labeled [`good first issue`](https://github.com/ale94lko/llm-workbench/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
- Open a new one with the [Good first issue](https://github.com/ale94lko/llm-workbench/issues/new?template=good_first_issue.yml) form when you spot a docs typo, missing test, or tiny UI fix.
- Maintainers should keep at least a few of these open (or quickly replace them when they are completed).

## Code review standards

Every pull request that changes product, test, or CI behavior is reviewed against this checklist before merge:

1. **Scope** — the PR is focused; unrelated refactors are split out.
2. **Tests** — new behavior has tests in the same PR; bug fixes include a regression test when reasonably possible.
3. **Security** — no secrets in git or exporters; user input stays on allowlists; CSP/headers and vault crypto are not weakened.
4. **License** — new source files include `Copyright (c) YYYY` and `SPDX-License-Identifier: MIT` (see `npm run check:headers`).
5. **Commits** — Conventional Commits + DCO `Signed-off-by`.
6. **Docs** — user-visible or process changes update README / CONTRIBUTING / `docs/` in the same PR.

Reviewers leave comments on the GitHub PR. Authors should not merge until required checks are green and the review below is satisfied.

## Two-person review

Modifications reach `main` only through a pull request. **At least one maintainer who is not the author** must approve before merge (GitHub: require 1 approving review + require review from Code Owners; [`.github/CODEOWNERS`](.github/CODEOWNERS)).

- Dependabot and other bots still need a human approval.
- Trivial typo-only docs PRs follow the same rule so the history stays uniformly reviewed.
- Direct pushes to `main` are forbidden.

## Project docs

- [GOVERNANCE.md](GOVERNANCE.md) — decision model, roles, access continuity, DCO, 2FA
- [docs/roadmap.md](docs/roadmap.md) — next-year plans
- [docs/architecture.md](docs/architecture.md) — high-level design
- [docs/assurance-case.md](docs/assurance-case.md) — security assurance case
- [docs/hardening.md](docs/hardening.md) — hardening mechanisms
- [docs/accessibility.md](docs/accessibility.md) — WCAG-oriented practices and i18n
- [docs/achievements.md](docs/achievements.md) — public badges
- [docs/openssf-silver.md](docs/openssf-silver.md) — OpenSSF Silver evidence map
- [docs/openssf-gold.md](docs/openssf-gold.md) — OpenSSF Gold evidence map
- [docs/reproducible-build.md](docs/reproducible-build.md) — how to rebuild a tagged release
- [docs/security-review-2026-09.md](docs/security-review-2026-09.md) — latest dated security design review
- [SECURITY.md](SECURITY.md) — vulnerability reporting and response

## Merge requirements

Merges into `main` go through a pull request. Do not push directly to `main`.

### Required status checks

These CI jobs from [`.github/workflows/ci.yml`](.github/workflows/ci.yml) must be green before merge:

| Check | What it enforces |
| :--- | :--- |
| `quality` | `npm audit --audit-level=moderate`, lint, and typecheck |
| `test` | `npm run test:coverage` (Vitest thresholds fail the job) |
| `fresh` | Clean-runner `npm run verify:fresh` (`npm ci` → build → coverage); fails the workflow on error |
| `docker-smoke` | Compose boot from `.env.example` → `.env`; fails if `/api/health` never becomes ready |
| `commitlint` | Conventional Commits on PR commits (Dependabot PRs are exempt; see [Commit style](#commit-style-conventional-commits)) |
| `dco` | Developer Certificate of Origin `Signed-off-by` on PR commits (Dependabot PRs are exempt) |

Also follow [Feature + test pairing](#feature--test-pairing): ship behavior changes with the tests that pin them in the same PR.

### Optional / non-blocking

- **`smoke`** (`.github/workflows/smoke-e2e.yml`) — Playwright smoke against static `generate` output. Uses `continue-on-error: true` and must **not** be a required status check until it is promoted.
- **Dependency freshness** — weekly `npm outdated` summary; never blocks merge.

### Maintainer: branch protection on `main`

Branch protection / rulesets are configured in GitHub **Settings → Rules** (not fully expressible in-repo). Maintainers should keep:

- [x] Require a pull request before merging
- [x] Require at least **1** approving review from a Code Owner other than the author
- [x] Require status checks to pass before merging: `quality`, `test`, `fresh`, `docker-smoke`, `commitlint`, `dco`
- [x] Do **not** require `smoke` (optional / `continue-on-error`)
- [x] Prefer squash merges so `main` history stays linear and changelog-friendly

Settings UI: [Rulesets](https://github.com/ale94lko/llm-workbench/settings/rules).

## Workflow

1. Search [existing issues](https://github.com/ale94lko/llm-workbench/issues) before opening a new one. Use an [issue form](https://github.com/ale94lko/llm-workbench/issues/new/choose) when creating one.
2. Fork the repository and create a focused branch.
3. Add or update tests for the behavior you change (same PR as the source change).
4. Use Conventional Commit messages (`feat:`, `fix:`, `test:`, …) and **sign off** (`git commit -s`).
5. Open a pull request and [link it to the issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue).
6. Enable [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) so the branch can be updated for a merge.

## Releases

This project uses [Semantic Versioning](https://semver.org/). Notable changes live in [`CHANGELOG.md`](CHANGELOG.md).

**Cadence:** cut a tag when a meaningful batch has landed on `main` (for example `v0.2.0`, `v0.3.0`, …). Prefer small focused PRs between cuts; do not farm artificial commits for history.

**Process (summary):**

1. Move `[Unreleased]` entries into a dated `## [X.Y.Z] - YYYY-MM-DD` section in `CHANGELOG.md`; leave an empty `[Unreleased]`.
2. Bump `"version"` in `package.json` to `X.Y.Z`.
3. Merge that release PR to `main`, then create a **signed** annotated tag `vX.Y.Z` (`git tag -s`) and push it.
4. Publish a GitHub Release whose notes are the matching changelog section.

Full maintainer steps and checklist: [`docs/releasing.md`](docs/releasing.md).

## Dependencies

- Reproducible installs rely on the committed `package-lock.json` (`npm ci`). Do not hand-pin transitive packages.
- Dependabot opens weekly grouped PRs for npm and GitHub Actions.
- A weekly **Dependency freshness** workflow runs `npm outdated --long`, writes the result to the job summary, and uploads an artifact. It uses `continue-on-error: true` so outdated packages never fail the build.
- Direct packages that look unused to static scanners but are required:
  - `@pinia/nuxt` and `pinia-plugin-persistedstate` — loaded as Nuxt modules in `nuxt.config.ts`
  - `vue-router` — Nuxt peer / runtime router (not imported directly in app code)
  - `@emnapi/core` and `@emnapi/runtime` — direct pins so Linux `npm ci` can resolve Tailwind Oxide / WASI optional natives in the lockfile (do not remove without verifying CI on ubuntu-latest)

## Security reports

Please do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
