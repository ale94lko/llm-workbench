# Hardening

Hardening mechanisms used so defects are less likely to become security issues.

| Mechanism | Where |
| --- | --- |
| Content-Security-Policy, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` | `nuxt.config.ts` (`app.head` + Nitro `routeRules`) |
| Input allowlist (Valibot) | `app/lib/validateStreamRequest.ts`, `app/lib/schemas/` |
| Secret redaction in logs | `app/lib/logger.ts` |
| Vault AES-256-GCM + PBKDF2 | `app/lib/crypto.ts` |
| TypeScript + ESLint in CI | `npm run typecheck`, `npm run lint` |
| CodeQL | GitHub default setup (Settings → Code security). Do not add `.github/workflows/codeql.yml` while default setup is on — SARIF upload is rejected. |
| OpenSSF Scorecard | `.github/workflows/scorecard.yml` |
| `npm audit --audit-level=moderate` | `.github/workflows/ci.yml` `quality` job |
| Dependabot | `.github/dependabot.yml` |
| Pinned Actions SHAs | `.github/workflows/*` |
| Coverage floor | `vitest.config.ts` (≥ 90% statements/lines/functions, ≥ 80% branches) |
| DCO sign-off | `scripts/check-dco.mjs` + CI `dco` job |

Least privilege is documented separately in [GOVERNANCE.md](../GOVERNANCE.md) and workflow `permissions:` blocks; it is not counted as a hardening compiler flag here.

See also [assurance-case.md](assurance-case.md).
