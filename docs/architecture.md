# Architecture

High-level design of **llm-workbench** (**v1.0**), a local-first Nuxt 4 / Vue 3 SPA for designing prompts, running them in parallel against up to four LLM providers, and comparing latency/cost metrics.

## Components

```text
Browser (SPA, ssr: false)
    │  Pinia stores (prompt, providers, vault, history, MCP)
    │  AES-256-GCM vault  ── localStorage (ciphertext) + sessionStorage (tab key)
    │
    ├─ Production (GitHub Pages)
    │     └─ HTTPS fetch ──► OpenAI / Anthropic / Gemini / Groq / local Ollama
    │     └─ HTTP/SSE MCP ──► user-configured MCP servers (no stdio)
    │
    └─ Dev / Docker / Node (`npm run dev` or `npm run build`)
          └─ POST /api/stream (Nitro) ── allowlist Valibot schema ──► provider HTTPS
          └─ GET  /api/health
          └─ GET  /api/metrics
          └─ GET  /api/mcp/status
          └─ POST /api/mcp/stdio (allowlisted spawn, @modelcontextprotocol/sdk)
          └─ POST /api/mcp/http  (allowlisted URL proxy)
```

| Area | Location | Role |
| --- | --- | --- |
| Pages | `app/pages/` | Compare, History, Metrics, Settings |
| UI | `app/components/` | Prompt editor, response cards, charts, vault UI, layout |
| State | `app/stores/` | Pinia + persistedstate (never persists raw API keys) |
| Crypto | `app/lib/crypto.ts` | PBKDF2 + AES-256-GCM vault (versioned payload `v: 1`) |
| Streaming | `app/lib/streamProviders.ts`, `app/composables/useLLMStream.ts` | Browser-direct or proxy stream |
| Validation | `app/lib/validateStreamRequest.ts`, `app/lib/schemas/` | Allowlist schemas (Valibot) |
| Exporters | `app/lib/exporters/` | Fetch, official SDK, Vercel AI, and LangChain snippets (env keys only) |
| Proxy | `server/api/stream.post.ts` | Dev/Node stream proxy; fail-closed on invalid input |
| MCP | `app/lib/mcp/`, `app/stores/useMcpStore.ts`, `server/api/mcp/` | Live MCP tools (HTTP/SSE in browser; stdio via Nitro) |
| Judge | `app/lib/judge.ts`, `PlaygroundJudgePanel` | Optional LLM-as-a-Judge rubrics on Compare / bulk runs |
| RAG | `app/lib/rag/`, `useRagStore`, `PlaygroundRagDocumentsPanel` | In-browser document chunking, local/Ollama embeddings, prompt injection |
| i18n | `app/i18n/en.ts` | English message catalog (localization-ready) |


## Input Validation Coverage

llm-workbench uses [Valibot](https://valibot.dev/) to strictly validate all external data entering the application boundaries. Malformed input is rejected with typed errors before processing.

| Entry Point | Validation Schema / Module | Rejection Behavior |
| --- | --- | --- |
| **Stream requests** | `app/lib/validateStreamRequest.ts` | 400 Bad Request at Nitro proxy or UI stream abort |
| **Prompt backups** | `app/lib/schemas/promptBackup.ts` | Import fails; modal shows schema error |
| **.prompt files** | `app/lib/schemas/promptFile.ts` | File load fails; modal shows schema error |
| **Dataset JSON/CSV** | `app/lib/schemas/dataset.ts` | Import is aborted; malformed rows skipped/rejected |
| **MCP proxy payloads** | `app/lib/mcp/validate.ts` | 400 Bad Request at proxy; client logs validation error |
## Trust boundaries

1. **User's browser** — the only place decrypted API keys exist. The vault ciphertext may sit in `localStorage`; the derived CryptoKey is tab-scoped (`sessionStorage`).
2. **This application** — validates stream payloads with an allowlist before any upstream call. Loggers redact secrets.
3. **LLM providers** — untrusted networks; production talks to them over HTTPS from the browser (or from Nitro in Docker/Node). Certificate verification is the platform TLS stack (browser / Node).
4. **Local Ollama / LM Studio** — optional HTTP to loopback; user-configured URLs must pass `http:`/`https:` allowlist checks.
5. **GitHub Pages / npm / git** — distribution over HTTPS. Release tags are cryptographically signed (see [releasing.md](releasing.md)).
6. **MCP servers** — user-configured. HTTP/SSE URLs must be `http:`/`https:`. stdio commands are allowlisted (`npx`, `node`, `python`, …) and spawned with argv (no shell). Auth headers stay in tab memory, never in `localStorage`. GitHub Pages has no stdio proxy.

See [SECURITY.md](../SECURITY.md) and [assurance-case.md](assurance-case.md) for the security argument.

## Build

- Source of truth is TypeScript/Vue under `app/` and `server/`.
- `npm ci` (lockfile) → `npm run build` (Node) or `npm run generate` (static Pages).
- Repeatable install: committed `package-lock.json`. CI `fresh` re-runs `npm ci` → build → coverage on a clean runner.

## Non-goals

This is not a multi-tenant cloud that stores customer secrets. Distribution is the git repo, GitHub Pages SPA, and optional Docker image — not a hosted key vault.
