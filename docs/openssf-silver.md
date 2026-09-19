# OpenSSF Best Practices — Silver evidence

Project entry: [https://www.bestpractices.dev/projects/14694](https://www.bestpractices.dev/projects/14694)

Passing is already **100%**. Fill the Silver (and leftover Passing `?`) fields with the answers below. Criterion names match the [Silver criteria list](https://www.bestpractices.dev/en/criteria/1).

## Passing leftovers (still `?` on the JSON)

| Criterion | Status | Justification / URL |
| --- | --- | --- |
| homepage_url | Met | https://ale94lko.github.io/llm-workbench/ |
| report_url | Met | https://github.com/ale94lko/llm-workbench/issues |
| installation_common | Met | `npm ci` / `npm run dev`, or `docker compose up --build`. README Quick Start. |
| build_reproducible | Met | `npm ci` from the committed lockfile; CI `fresh` repeats install → build → coverage. |
| hardening | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/hardening.md |
| crypto_used_network | Met | Provider calls use HTTPS; local Ollama is optional loopback HTTP. |
| crypto_tls12 | Met | TLS is the browser/Node stack (TLS 1.2+). No custom TLS. |
| crypto_certificate_verification | Met | Default `fetch` in browser/Node verifies certificates. |
| crypto_verification_private | Met | Keys are sent only after the platform TLS handshake. |
| hardened_site | Met | HTTPS GitHub / Pages; CSP and related headers in `nuxt.config.ts`. |

## Silver

| Criterion | Status | URL or justification |
| --- | --- | --- |
| achieve_passing | Met | Passing badge on 2026-09-18. |
| contribution_requirements | Met | https://github.com/ale94lko/llm-workbench/blob/main/CONTRIBUTING.md |
| dco | Met | https://github.com/ale94lko/llm-workbench/blob/main/CONTRIBUTING.md#developer-certificate-of-origin-dco |
| governance | Met | https://github.com/ale94lko/llm-workbench/blob/main/GOVERNANCE.md |
| code_of_conduct | Met | https://github.com/ale94lko/llm-workbench/blob/main/CODE_OF_CONDUCT.md |
| roles_responsibilities | Met | https://github.com/ale94lko/llm-workbench/blob/main/GOVERNANCE.md |
| access_continuity | Met | https://github.com/ale94lko/llm-workbench/blob/main/GOVERNANCE.md#access-continuity |
| bus_factor | Met | https://github.com/ale94lko/llm-workbench/blob/main/GOVERNANCE.md#bus-factor (2 maintainers) |
| documentation_roadmap | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/roadmap.md |
| documentation_architecture | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/architecture.md |
| documentation_security | Met | https://github.com/ale94lko/llm-workbench/blob/main/SECURITY.md and https://github.com/ale94lko/llm-workbench/blob/main/docs/assurance-case.md |
| documentation_quick_start | Met | https://github.com/ale94lko/llm-workbench/blob/main/README.md#quick-start |
| documentation_current | Met | README, CONTRIBUTING, and `docs/` are updated in the same PRs as behavior changes. Defects are tracked as issues. |
| documentation_achievements | Met | https://github.com/ale94lko/llm-workbench/blob/main/README.md (badge row) and https://github.com/ale94lko/llm-workbench/blob/main/docs/achievements.md |
| accessibility_best_practices | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/accessibility.md |
| internationalization | Met | English catalog `app/i18n/en.ts` + `useI18n()`; Unicode throughout. Localization of additional languages is enabled, not required. |
| sites_password_security | N/A | Project sites are GitHub and GitHub Pages; we do not store inbound user passwords. |
| maintenance_or_update | Met | Semver tags + CHANGELOG; vault payload is versioned (`v: 1`). Upgrade path is `git pull` / new Docker image. |
| report_tracker | Met | GitHub Issues. |
| vulnerability_report_credit | N/A | No vulnerabilities resolved in the last 12 months. Policy: SECURITY.md Credit. |
| vulnerability_response_process | Met | https://github.com/ale94lko/llm-workbench/blob/main/SECURITY.md |
| coding_standards | Met | https://github.com/ale94lko/llm-workbench/blob/main/CONTRIBUTING.md#coding-standards (`eslint.config.mjs`) |
| coding_standards_enforced | Met | `npm run lint` in CI `quality` job; ESLint errors fail the build. |
| build_standard_variables | N/A | No native binaries (TypeScript/Vue SPA). |
| build_preserve_debug | N/A | No native install that strips debug symbols. |
| build_non_recursive | N/A | Vite/Nuxt graph build, not recursive make. |
| build_repeatable | Met | `npm ci` + `npm run generate` / `npm run build` from a tagged commit. CI `fresh` repeats this. |
| installation_standard_variables | N/A | No POSIX DESTDIR installer. |
| installation_development_quick | Met | README Quick Start + `npm run verify:fresh` + Dev Container / Docker Compose. |
| external_dependencies | Met | npm lockfile; `npm update` / Dependabot PRs. |
| dependency_monitoring | Met | Dependabot + `npm audit --audit-level=moderate` on every PR. |
| updateable_reused_components | Met | Standard npm components; Dependabot grouped PRs. |
| interfaces_current | Met | Nuxt 4 / Vue 3 / current provider HTTPS APIs; we do not call known-deprecated Node APIs. |
| automated_integration_testing | Met | GitHub Actions CI on every PR/push (`test` job). |
| regression_tests_added50 | Met | CONTRIBUTING mandates regression tests for bug fixes; target ≥ 50% of bugs in a six-month window. |
| test_statement_coverage80 | Met | `vitest.config.ts` statements/lines/functions ≥ 80%. CI fails below the floor. |
| test_policy_mandated | Met | https://github.com/ale94lko/llm-workbench/blob/main/CONTRIBUTING.md#formal-test-policy |
| tests_documented_added | Met | Same section + PR template checklist. |
| warnings_strict | Met | ESLint + `nuxt typecheck` (vue-tsc) fail CI. |
| implement_secure_design | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/assurance-case.md |
| crypto_weaknesses | Met | AES-GCM, not SHA-1/CBC for the vault. |
| crypto_algorithm_agility | Met | Versioned vault payload (`v: 1` = AES-256-GCM + PBKDF2-SHA-256). A new `v` can introduce Argon2id or SHA-3 without rewriting stored blobs in place. |
| crypto_credential_agility | Met | Keys live in the encrypted vault (separate from config). Users replace keys in Settings or via env vars for exporters; no recompile. |
| crypto_used_network | Met | HTTPS to cloud providers. |
| crypto_tls12 | Met | Platform TLS 1.2+. |
| crypto_certificate_verification | Met | Default `fetch`. |
| crypto_verification_private | Met | Headers with API keys go out only after TLS verify. |
| signed_releases | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/releasing.md#verify-a-release — annotated tags signed with `git tag -s`; private key stays off GitHub Pages. |
| version_tags_signed | Met | Same process for `vX.Y.Z` tags. |
| input_validation | Met | Allowlist Valibot schemas for stream, backup, and prompt files. |
| hardening | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/hardening.md |
| assurance_case | Met | https://github.com/ale94lko/llm-workbench/blob/main/docs/assurance-case.md |
| static_analysis_common_vulnerabilities | Met | GitHub CodeQL default setup (javascript-typescript) + npm audit. |
| dynamic_analysis_unsafe | N/A | TypeScript/Vue only; no C/C++. |

After saving the form, confirm the badge on the README still points at project **14694**.
