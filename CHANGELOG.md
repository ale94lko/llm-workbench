# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenSSF Gold evidence: SPDX/copyright headers, two-person review, 2FA policy, small tasks, dated security review, reproducible-build notes, and coverage floors ≥90% statements / ≥80% branches
- OpenSSF Silver project docs: governance, roadmap, architecture, assurance case, hardening, accessibility, achievements, and evidence map
- English i18n catalog (`app/i18n/en.ts`) with skip-to-content and `html lang="en"`
- CSP and related security headers in `nuxt.config.ts`
- Signed-release process (`git tag -s`) documented in `docs/releasing.md`
- Hotspot unit tests for `sessionStore`, exporters (all providers), provider-store edges, streamClient failures, and History UI ([#71](https://github.com/ale94lko/llm-workbench/issues/71))
- Optional Sentry browser error tracking via `NUXT_PUBLIC_SENTRY_DSN` ([#69](https://github.com/ale94lko/llm-workbench/issues/69))
- Documented that Vitest coverage thresholds fail CI (`perFile: false` + ci.yml comment) ([#68](https://github.com/ale94lko/llm-workbench/issues/68))
- CI `fresh` job gates `npm run verify:fresh`; Docker Compose boot docs aligned ([#67](https://github.com/ale94lko/llm-workbench/issues/67))
- Sustained paired feature+test history guidance (`docs/maintenance.md` + PR checklist) ([#66](https://github.com/ale94lko/llm-workbench/issues/66))
- Stream API malformed-input tests and contributor note for POST boundary validation ([#59](https://github.com/ale94lko/llm-workbench/issues/59))

### Changed
- Lower CI `npm audit` gate from `--audit-level=high` to `--audit-level=moderate` ([#91](https://github.com/ale94lko/llm-workbench/issues/91))
- Raised Vitest coverage gates to lines/functions/statements ≥90% and branches ≥80% for OpenSSF Gold
- Raised Vitest coverage gates to lines/functions/statements ≥80% and branches ≥65% for OpenSSF Silver (`test_statement_coverage80`)
- Pin GitHub Actions to commit SHAs; add OpenSSF Scorecard and DCO CI jobs (CodeQL stays on GitHub default setup)
- Upgrade Code of Conduct to Contributor Covenant 2.1 at the repository root
- Revert to MIT License to meet OpenSSF Best Practices FLOSS requirements
- Add OpenSSF Best Practices badge to README
- Audited transitive deps: `npm dedupe` on the lockfile; kept `@emnapi/*` direct pins (required for Linux `npm ci` / Oxide lock sync) ([#70](https://github.com/ale94lko/llm-workbench/issues/70))

## [0.2.0] - 2026-09-17

Second tagged milestone: Compare power tools, vault UX, local discovery, CI/docs hardening, and file-size refactors.

### Changed
- Split oversized `useCodeExporter` into `app/lib/exporters/*` and extract Compare run orchestration into `useCompareRunner` so both stay under ~500 LOC ([#57](https://github.com/ale94lko/llm-workbench/issues/57))
- Pages deploy waits on successful CI for `main` instead of re-running the quality gate; Vitest uses shared-thread pool; branch coverage threshold ≥50% ([#29](https://github.com/ale94lko/llm-workbench/issues/29))
- Rename repository and product branding from `llm-playground-os` / LLM Playground OS to **`llm-workbench` / LLM Workbench** (avoids demo/template naming for buyers and Pages base path `/llm-workbench/`)

### Fixed
- Abort mid-stream marks slots as cancelled and skips misleading history entries ([#27](https://github.com/ale94lko/llm-workbench/issues/27))
- Stop persisting the vault AES CryptoKey in `localStorage`; session-only key + cold-start unlock ([#21](https://github.com/ale94lko/llm-workbench/issues/21))
- Derive vault AES keys as extractable so session/persisted key storage can export them ([#20](https://github.com/ale94lko/llm-workbench/issues/20))

### Removed
- Unused direct dependency `class-variance-authority` ([#11](https://github.com/ale94lko/llm-workbench/issues/11))

### Added
- Documented release cadence and maintainer cut steps ([#60](https://github.com/ale94lko/llm-workbench/issues/60))
- Merge requirements in CONTRIBUTING (required `quality` + `commitlint`, optional smoke) ([#58](https://github.com/ale94lko/llm-workbench/issues/58))
- Fresh-clone verify script (`npm run verify:fresh`) and clean-install notes ([#56](https://github.com/ale94lko/llm-workbench/issues/56))
- Mock tool/function results for multi-turn Compare follows ([#33](https://github.com/ale94lko/llm-workbench/issues/33))
- One-click local LLM discovery (Ollama + LM Studio) and air-gapped mode ([#34](https://github.com/ale94lko/llm-workbench/issues/34))
- Declarative response assertions with PASS/FAIL badges on Compare and History ([#31](https://github.com/ale94lko/llm-workbench/issues/31))
- Structured JSON preview (Raw / Structured tabs) on Compare response cards ([#32](https://github.com/ale94lko/llm-workbench/issues/32))
- Optional Playwright smoke E2E on static `generate` output (nightly / non-blocking) ([#30](https://github.com/ale94lko/llm-workbench/issues/30))
- Settings UI to change the vault master password; `clearSessionCryptoKey` used on password rotation ([#28](https://github.com/ale94lko/llm-workbench/issues/28))
- Broader Vitest coverage for prompt store history edges, History/Compare UI paths, and `useLLMStream` routing ([#26](https://github.com/ale94lko/llm-workbench/issues/26))
- Side-by-side / unified response diff for completed Compare runs (lightweight line LCS) ([#25](https://github.com/ale94lko/llm-workbench/issues/25))
- Export/import history and saved prompts as versioned JSON (merge or replace, no API keys) ([#24](https://github.com/ale94lko/llm-workbench/issues/24))
- Discover local Ollama models via `/api/tags` with Refresh control and static fallback ([#23](https://github.com/ale94lko/llm-workbench/issues/23))
- Per-run temperature and max tokens controls on Compare, wired through providers and code export ([#22](https://github.com/ale94lko/llm-workbench/issues/22))
- Bulk CSV/JSON dataset runs on Compare with column→variable mapping, capped results table, and export ([#35](https://github.com/ale94lko/llm-workbench/issues/35))
- Git-friendly `.prompt` Markdown export/import with YAML frontmatter, prompt revision diffs, and secret stripping ([#36](https://github.com/ale94lko/llm-workbench/issues/36))
- Weekly `npm outdated` freshness workflow (non-failing summary + artifact) ([#11](https://github.com/ale94lko/llm-workbench/issues/11))
- Unit tests for Nitro `/api/stream`, `/api/health`, and `/api/metrics` handlers ([#19](https://github.com/ale94lko/llm-workbench/issues/19))
- Unit tests for `useSecurityStore` and crypto session persistence helpers ([#20](https://github.com/ale94lko/llm-workbench/issues/20))

## [0.1.0] - 2026-09-16

First tagged milestone after env onboarding docs, Vue coverage, typed stream errors, and contributor process.

### Changed
- Switch from MIT to a source-available license with an AI-training restriction
- Document optional provider API keys in `.env.example` and the README env table ([#8](https://github.com/ale94lko/llm-workbench/issues/8))
- Raise Vitest coverage thresholds to 60% for lines, functions, and statements ([#9](https://github.com/ale94lko/llm-workbench/issues/9))
- Stream client `onError` callbacks now receive typed `StreamError` values instead of raw strings ([#10](https://github.com/ale94lko/llm-workbench/issues/10))
- `NUXT_DEVTOOLS=false` actually disables DevTools (previously only `0` was treated as off)

### Added
- Conventional Commits requirement, feature+test pairing guidance, and commitlint on pull requests ([#12](https://github.com/ale94lko/llm-workbench/issues/12))
- Typed `StreamError` helper with log-safe serialization ([#10](https://github.com/ale94lko/llm-workbench/issues/10))
- Vue page/component tests for the playground run path, metrics page, and `LatencyTimeline` ([#9](https://github.com/ale94lko/llm-workbench/issues/9))
- ESLint (`@nuxt/eslint`) and `nuxt typecheck` gates on every push and pull request
- Dedicated CI workflow with `npm audit --audit-level=high`, lint, typecheck, and coverage
- Vitest coverage report (`npm run test:coverage`) with a 60% line/function/statement threshold
- Unit tests for `useProviderStore`, `usePromptStore`, `streamClient`, request validation, and structured logging
- `/api/health` and `/api/metrics` endpoints for Node/Docker deployments
- Structured JSON logger with secret redaction and a client error-tracking plugin
- Input validation for stream proxy and browser-direct requests
- Docker image, `docker-compose.yml`, and a Dev Container for one-command startup
- `.env.example` documenting `NUXT_APP_BASE_URL`, `NUXT_DEVTOOLS`, and optional provider API keys
- Dependabot weekly updates for npm and GitHub Actions
- Root `CONTRIBUTING.md`

### Security
- Code exporter now emits environment-variable placeholders (`process.env.*`, `os.environ[...]`, `$VAR`, `getenv(...)`) instead of interpolating API keys into snippets
- Stream/client failures use typed `StreamError` with log-safe serialization; logger redaction documented in the README ([#10](https://github.com/ale94lko/llm-workbench/issues/10))

[Unreleased]: https://github.com/ale94lko/llm-workbench/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ale94lko/llm-workbench/releases/tag/v0.2.0
[0.1.0]: https://github.com/ale94lko/llm-workbench/releases/tag/v0.1.0
