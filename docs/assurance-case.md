# Security assurance case

This document argues that the security expectations in [SECURITY.md](../SECURITY.md) are met for **llm-workbench**.

## Security requirements (what users can and cannot expect)

**Users can expect:**

- Provider API keys are encrypted in the browser with AES-256-GCM before `localStorage`. The derived CryptoKey is not written to `localStorage`.
- The master password is never persisted in plaintext; the verifier uses a per-vault salt.
- `/api/stream` (dev/Docker/Node) rejects non-allowlisted bodies via Valibot (`app/lib/validateStreamRequest.ts`).
- Exported code snippets never embed stored API keys (environment-variable placeholders only).
- Structured logs redact secret-shaped fields; `StreamError` does not serialize raw `cause` objects.
- Site and repo URLs are HTTPS. Browser/Node TLS verifies certificates before sending provider requests that include keys.

**Users cannot expect:**

- Protection if they share an unlocked browser profile, or paste keys into a prompt.
- A guarantee that upstream LLM providers are free of defects or will not log prompts.
- Server-side key custody on GitHub Pages (there is no app server; keys leave the browser only toward the chosen provider).
- Perfect confidentiality of prompts against the selected provider.

## Threat model

| Threat | Mitigation |
| --- | --- |
| Keys stolen from disk/`localStorage` | AES-256-GCM ciphertext; session-only CryptoKey; cold start requires master password |
| XSS reading the vault | SPA hardening (CSP, `X-Content-Type-Options`, no `innerHTML` of untrusted model output as HTML); Vue text interpolation by default |
| Malformed `/api/stream` body | Allowlist schema; 400 on failure; logs omit `apiKey` |
| Secret leakage in logs / exporters | Logger redaction; exporters use env placeholders |
| MITM of provider traffic | HTTPS to providers; platform TLS certificate verification |
| Dependency compromise | `npm ci` lockfile, `npm audit --audit-level=moderate`, Dependabot, CodeQL |
| Supply-chain of git tags | Signed tags (`git tag -s`); verify with `git verify-tag` |

## Trust boundaries

Documented in [architecture.md](architecture.md): browser vault ↔ this app ↔ LLM providers / loopback Ollama ↔ GitHub distribution.

## Secure design principles applied

- **Fail-safe defaults:** empty vault, no keys in the repo, stream handler denies invalid input.
- **Complete mediation:** every `/api/stream` body goes through `validateStreamRequest` before `fetch`.
- **Least privilege:** GitHub Actions default to `contents: read`; write only on jobs that publish Pages or badges.
- **Economy of mechanism:** Web Crypto only; versioned vault payload (`v: 1`) rather than a custom protocol.
- **Psychological acceptability:** local-first; users keep keys on their machine.

## Common implementation weaknesses countered

| Weakness class (OWASP / CWE) | How countered |
| --- | --- |
| Using components with known vulns | `npm audit` in CI; Dependabot; lockfile |
| Injection / unexpected input | Valibot allowlists for stream, backup, and `.prompt` files |
| XSS | Vue default escaping; CSP; no `v-html` of model output |
| Sensitive data exposure | Vault encryption; redaction; no keys in exporters or git |
| CSRF on Pages | Static SPA; mutating API is local Nitro or third-party provider CORS |
| Broken TLS | No custom TLS; browser/Node defaults (TLS 1.2+) |
| Memory-unsafe code in *this* repo | TypeScript / Vue (no C/C++) |

## Evidence

- Vitest suite (`npm run test:coverage`) with statement coverage **≥ 90%** and branch coverage **≥ 80%**.
- Dated security design review: [security-review-2026-09.md](security-review-2026-09.md).
- ESLint + `nuxt typecheck` + GitHub CodeQL default setup.
- OpenSSF Scorecard on `main`.
- OpenSSF Best Practices: https://www.bestpractices.dev/projects/14694
