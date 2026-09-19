# Security design review — 2026-09

**Date:** 2026-09-19  
**Scope:** llm-workbench (https://github.com/ale94lko/llm-workbench), as deployed on GitHub Pages and as run via `npm run dev` / Docker Compose.  
**Reviewers:** maintainers [@ale94lko](https://github.com/ale94lko) and [@leoflavio1989](https://github.com/leoflavio1989) (CODEOWNERS).  
**Method:** design review against [docs/assurance-case.md](assurance-case.md) and [docs/hardening.md](hardening.md), plus current CodeQL default setup, OpenSSF Scorecard, `npm audit --audit-level=moderate`, and the Vitest suite.

This document satisfies OpenSSF Gold `security_review`: at least one documented security review of the design in the last year.

## What was reviewed

1. **Trust boundaries** — browser vault, this SPA, LLM provider HTTPS APIs, optional loopback Ollama, GitHub distribution (git + Pages).
2. **Key custody** — AES-256-GCM vault (`app/lib/crypto.ts`); session CryptoKey never written to `localStorage`; exporters use env placeholders.
3. **Network crypto** — cloud providers over TLS 1.2+ via browser/Node `fetch`; no custom TLS; certificate verification is the platform default.
4. **Injection / unexpected input** — Valibot allowlists for `/api/stream`, prompt backup, and `.prompt` files.
5. **XSS / clickjacking / mixed content** — Vue default escaping, CSP and related headers in `nuxt.config.ts`, no `v-html` of model output.
6. **Supply chain** — lockfile `npm ci`, Dependabot, pinned Actions SHAs, Scorecard, CodeQL javascript-typescript, DCO on PRs.
7. **Authn of maintainers** — GitHub 2FA required (TOTP/passkeys preferred); two-person review on `main`.

## Findings

No high-severity design defects were identified that would require an embargoed advisory.

Residual risks (accepted, already documented in the assurance case):

- GitHub Pages has no app server; API keys leave the browser toward the chosen provider after TLS.
- Users who share an unlocked browser profile, or paste secrets into prompts, are outside the threat model.
- Optional Ollama/LM Studio on loopback HTTP is local-only; CORS must be configured by the operator (`OLLAMA_ORIGINS`).

## Follow-ups (non-blocking)

- Keep Scorecard and CodeQL green on `main`.
- Re-run this review at least annually, or after a major change to vault crypto, the stream proxy, or hosting.

## Sign-off

The design is consistent with SECURITY.md user expectations. Evidence: this file, [assurance-case.md](assurance-case.md), CI on `main`, and https://www.bestpractices.dev/projects/14694.
