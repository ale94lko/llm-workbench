# <img src="public/favicon.svg" width="32" height="32" alt="" /> LLM Workbench

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/ale94lko/llm-workbench?display_name=tag&sort=semver)](https://github.com/ale94lko/llm-workbench/releases/latest)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/14694/badge)](https://www.bestpractices.dev/projects/14694)
[![Health Score](https://github.com/ale94lko/llm-workbench/blob/output/badge.svg)](https://github.com/ale94lko/repo-health-score)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)

Source-available **multi-LLM workbench** for developers (**v1.0**). Design prompts with dynamic variables, run them in parallel against up to 4 models, and compare responses with real-time metrics — all **local-first** in your browser.

**Live app:** [https://ale94lko.github.io/llm-workbench/](https://ale94lko.github.io/llm-workbench/)

## Screenshots

### Compare — run models in parallel

![Workbench with prompt variables and model selection](docs/screenshots/playground.png)

Write system and user prompts with `{{variables}}`, pick up to 4 providers, and run them side-by-side.

### Metrics — charts and detailed comparison

![Metrics dashboard with latency, TTFT, cost charts and comparison table](docs/screenshots/metrics.png)

Track latency, TTFT, tokens, and cost. Toggle between **Latest run** and **Historical avg**, with a latency timeline across executions.

### History — past runs and saved prompts

![History page with past prompt executions](docs/screenshots/history.png)

Browse previous comparisons and reload any run back into the workbench.

### Settings — encrypted vault and API keys

![Settings page with encrypted vault and provider API keys](docs/screenshots/settings.png)

Store API keys locally with AES-256-GCM encryption and an optional master password vault.

## Features

- **Multi-provider support** — OpenAI, Anthropic, Google Gemini, Groq, and local Ollama
- **Parallel execution** — Compare up to 4 models side-by-side in a responsive grid
- **Variable engine** — Use `{{variable_name}}` syntax with auto-generated input fields
- **Real-time metrics** — Latency, TTFT, token counts, and estimated cost per model
- **Metrics dashboard** — Bar charts, latency timeline, and detailed comparison table
- **Local-first API keys** — Encrypted with AES-256-GCM + master password before localStorage
- **Code exporter** — Fetch, official TypeScript SDKs, Vercel AI SDK, LangChain, cURL, and PHP (env placeholders only)
- **`.prompt` files** — Export and import Git-friendly Markdown with YAML frontmatter (no API keys)
- **Prompt version diff** — Highlight drift between the editor and a saved or history version
- **History & library** — Save prompts with versioning and browse past executions
- **MCP tools** — Connect HTTP, SSE, or local stdio Model Context Protocol servers and run live tools from Compare (stdio needs Node/Docker)
- **LLM-as-a-Judge** — Optional evaluator model + rubrics on Compare and bulk dataset runs; scores stay local
- **RAG documents** — Upload TXT/MD/PDF, embed locally (or via Ollama), retrieve top-K chunks into Compare prompts
- **SDK export** — Official TypeScript clients, Vercel AI SDK, and LangChain snippets (plus existing fetch/cURL/PHP)
- **Mobile-friendly** — Hamburger navigation menu on small screens

## Quick Start

```bash
git clone https://github.com/ale94lko/llm-workbench.git
cd llm-workbench
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env.example` documents the supported variables:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `NUXT_APP_BASE_URL` | `/` | Public path prefix. GitHub Pages uses `/llm-workbench/`. |
| `NUXT_DEVTOOLS` | `false` | Enable Nuxt DevTools. Set `true` locally if you want the overlay. |
| `CI` | _(unset)_ | Set automatically by GitHub Actions. Signals non-interactive CI to Node/Vitest/Playwright. Leave unset locally. |
| `BASE` | _(unset)_ | CI-only base commit value used by the DCO check. Leave unset locally. |
| `HEAD` | _(unset)_ | CI-only head commit value used by the DCO check. Leave unset locally. |
| `GITHUB_ACTIONS` | _(unset)_ | Set automatically by GitHub Actions for CI-only behavior. Leave unset locally. |
| `HOST` | `0.0.0.0` (Compose) | Bind address for the Nitro server in Docker. Documented commented in `.env.example`; Compose/Dockerfile set it. |
| `PORT` | `3000` (Compose) | Listen port for the Nitro server in Docker. Documented commented in `.env.example`; Compose/Dockerfile set it. |
| `NODE_ENV` | _(unset locally)_ | Docker sets `production`. Leave unset for `npm run dev`. |
| `NUXT_PUBLIC_SENTRY_DSN` | _(empty)_ | Optional. Sentry DSN for production browser and Nitro server error tracking. Leave empty to disable remote tracking. |
| `OPENAI_API_KEY` | _(empty)_ | Optional. Used by exporter snippets / local tooling. Get a key at [platform.openai.com](https://platform.openai.com/api-keys). |
| `ANTHROPIC_API_KEY` | _(empty)_ | Optional. Same as above for Anthropic ([console.anthropic.com](https://console.anthropic.com/settings/keys)). |
| `GEMINI_API_KEY` | _(empty)_ | Optional. Same as above for Google Gemini ([aistudio.google.com](https://aistudio.google.com/apikey)). |
| `GROQ_API_KEY` | _(empty)_ | Optional. Same as above for Groq ([console.groq.com](https://console.groq.com/keys)). |

The browser **Settings vault** is the primary place for API keys. Leave the provider env vars empty for a normal local run; `npm run dev` does not require them.
### Docker (one command)

Copy env defaults (provider keys stay empty — not required for boot):

```bash
cp .env.example .env
docker compose up --build
```

Compose sets `NUXT_APP_BASE_URL=/`, `NUXT_DEVTOOLS=false`, `HOST=0.0.0.0`, and `PORT=3000`. The production server listens on [http://localhost:3000](http://localhost:3000) and exposes:

- `GET /api/health` — liveness (also used by the image `HEALTHCHECK`)
- `GET /api/metrics` — process uptime and stream counters
- `POST /api/stream` — LLM stream proxy (no CORS)

Smoke check after boot:

```bash
curl -fsS http://localhost:3000/api/health
```

Optional local Ollama:

```bash
docker compose --profile ollama up --build
```

CI also gates a clean-machine install via the `fresh` job (`npm run verify:fresh`) and this Compose boot via the `docker-smoke` job (`.env.example` → `.env`, `/api/health`). See [docs/dev-notes.md](docs/dev-notes.md).

### Configure providers

1. Go to **Settings** and create an encrypted vault with a master password
2. Unlock the vault and add your API keys (or Ollama URL for local models)
3. Select models on the **Compare** page
4. Write your prompt with optional `{{variables}}`
5. Click **Run All**

> **Ollama tip:** Install [Ollama](https://ollama.com) and run `ollama pull llama3.2` — no API key needed. On Compare, use **Refresh Ollama** to load models from `{OLLAMA_URL}/api/tags` (falls back to the built-in list if the daemon is unreachable). For browser access, set `OLLAMA_ORIGINS=*` if required.

## Streaming architecture

The app is a **static SPA** (`ssr: false`) designed to run on GitHub Pages without a backend.

| Environment | How streaming works |
| :--- | :--- |
| **Production** (GitHub Pages) | Calls LLM provider APIs **directly from the browser** |
| **Local dev** (`npm run dev`) | Uses the Nitro proxy at `/api/stream` (all providers, no CORS issues) |
| **Custom proxy** (optional) | Set **Stream proxy URL** in Settings to forward requests to your own server |

### Provider notes for browser deployment

| Provider | Browser support |
| :--- | :--- |
| **Groq** | Works out of the box |
| **Gemini** | Works — restrict your API key by HTTP referrer (e.g. `https://ale94lko.github.io/*`) in [Google AI Studio](https://aistudio.google.com/apikey) |
| **Anthropic** | Works with direct browser access header |
| **OpenAI** | May be blocked by CORS — use local dev, Groq/Gemini, or a stream proxy |
| **Ollama** | Local only — requires a running Ollama instance on your machine |

## Deploy

### GitHub Pages (recommended)

The repo deploys via GitHub Actions after **CI** succeeds on `main` (deploy does not re-run lint/tests on that path).

1. Go to **Settings → Pages → Build and deployment**
2. Set **Source** to **GitHub Actions**
3. Push to `main` — `ci.yml` runs the quality gate and uploads the `pages-site` artifact; on success, `deploy-pages.yml` publishes that artifact (no privileged rebuild from `workflow_run` checkout)

See [CONTRIBUTING.md](CONTRIBUTING.md) for the CI ↔ deploy relationship.

The site is published at:

```text
https://<username>.github.io/<repo-name>/
```

For this repo: [https://ale94lko.github.io/llm-workbench/](https://ale94lko.github.io/llm-workbench/)

Build locally:

```bash
NUXT_APP_BASE_URL=/llm-workbench/ npm run generate
npx serve .output/public
```

### Vercel / Node hosting

For full provider support including OpenAI without CORS limitations, deploy to a platform with a Node server (Vercel, Netlify, etc.) so `/api/stream` is available:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ale94lko/llm-workbench)

```bash
npm run build
```

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | Nuxt 4 (Vue 3 Composition API, SPA mode) |
| Styling | Tailwind CSS v4 |
| State | Pinia + pinia-plugin-persistedstate |
| Icons | Lucide Vue |
| Streaming | Browser-direct (prod) + Nitro proxy (dev) |
| Tests | Vitest + coverage (`@vitest/coverage-v8`) |
| Lint | ESLint via `@nuxt/eslint` |
| Observability | Structured JSON logs, `/api/health`, `/api/metrics` |

## Project Structure

```text
app/
├── components/
│   ├── ui/              # Base UI components
│   ├── playground/      # Prompt editor, model selector, response cards
│   ├── metrics/         # Bar charts and latency timeline
│   ├── settings/        # API key manager, encrypted vault
│   └── layout/          # Header with desktop nav + mobile menu
├── composables/         # LLM streaming, cost calculator, code exporter, i18n
├── i18n/                # English message catalog (localization-ready)
├── lib/                 # Crypto, errors, metrics, stream providers, provider models, logger, validation
├── pages/               # Compare, history, metrics, settings
├── stores/              # Provider & prompt state (persisted)
└── plugins/             # Vault bootstrap + client error tracking
server/api/              # Stream proxy, health, and metrics (local dev / Node / Docker)
docs/
├── architecture.md  # High-level design and trust boundaries
├── assurance-case.md
├── roadmap.md
└── screenshots/     # README example images
```

## Development

```bash
cp .env.example .env
npm run dev          # Start dev server (uses /api/stream proxy)
npm run build        # Production build (Node server)
npm run generate     # Static export for GitHub Pages
npm run lint         # ESLint
npm run typecheck    # vue-tsc via Nuxt
npm test             # Run unit tests
npm run test:coverage
npm run verify:fresh # Clean install → build → coverage (also CI `fresh` job)
npm run test:watch   # Watch mode
docker compose up --build
curl -fsS http://localhost:3000/api/health
```

## Security

API keys are encrypted client-side using **AES-256-GCM** with a key derived from your master password (PBKDF2, 100k iterations). Only the encrypted payload (plus salt/verifier metadata) is persisted in localStorage.

The derived AES CryptoKey is kept in memory and mirrored in **sessionStorage for the current browser tab session only**. It is **not** written to localStorage. After a cold browser restart you must unlock with the master password before decrypted API keys are available again.

Locking the vault **only hides key values in Settings** — within an already-unlocked session, the workbench keeps working with keys already loaded in memory / sessionStorage.

While the vault is unlocked you can **Change master password** in Settings. That rotates the salt/verifier, re-encrypts stored API keys, and replaces the session CryptoKey (the previous session key is cleared first).

> **Note:** In production (GitHub Pages), API keys are sent directly from your browser to the LLM provider. This is intentional for a local-first workbench, but never share your machine or browser session with untrusted parties.

The **code exporter** never embeds stored API keys. Generated fetch, official SDK, Vercel AI SDK, LangChain, cURL, and PHP snippets always read credentials from the environment (`process.env.OPENAI_API_KEY`, `os.environ['OPENAI_API_KEY']`, `$OPENAI_API_KEY`, `getenv('OPENAI_API_KEY')`).

Client and stream failures use a typed `StreamError` (`app/lib/errors.ts`). Before anything is written by the structured logger (`app/lib/logger.ts`), sensitive fields (`apiKey`, `authorization`, `password`, `secret`, `token`, …) are redacted, and `StreamError.toLogFields()` only serializes safe summaries (never raw `cause` objects).

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md), and the [Code of Conduct](CODE_OF_CONDUCT.md). Open an issue first to discuss what you'd like to change.

Project docs: [architecture](docs/architecture.md), [roadmap](docs/roadmap.md), [security assurance case](docs/assurance-case.md), [OpenSSF Silver](docs/openssf-silver.md), [OpenSSF Gold](docs/openssf-gold.md).

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run `npm run lint`, `npm run typecheck`, and `npm test`
4. Commit your changes in small, focused commits (tests with the feature)
5. Push and open a Pull Request

## License

**llm-workbench** is released under the [MIT License](LICENSE).
