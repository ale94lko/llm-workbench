// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { envVarName, sampling } from './shared'

/** Official provider TypeScript / Node SDK snippets (no API keys inlined). */
export function exportSdkTypescript(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)
  const system = JSON.stringify(opts.systemPrompt)
  const user = JSON.stringify(opts.userPrompt)

  switch (opts.provider) {
    case 'openai':
      return `import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.${envVarName('openai')} });

const stream = await client.chat.completions.create({
  model: '${opts.model}',
  messages: [
    { role: 'system', content: ${system} },
    { role: 'user', content: ${user} },
  ],
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`

    case 'anthropic':
      return `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.${envVarName('anthropic')} });

const stream = client.messages.stream({
  model: '${opts.model}',
  max_tokens: ${maxTokens},
  temperature: ${temperature},
  system: ${system},
  messages: [{ role: 'user', content: ${user} }],
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}`

    case 'gemini':
      return `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.${envVarName('gemini')} });

const stream = await ai.models.generateContentStream({
  model: '${opts.model}',
  contents: ${user},
  config: {
    systemInstruction: ${system},
    temperature: ${temperature},
    maxOutputTokens: ${maxTokens},
  },
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text ?? '');
}`

    case 'groq':
      return `import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.${envVarName('groq')} });

const stream = await client.chat.completions.create({
  model: '${opts.model}',
  messages: [
    { role: 'system', content: ${system} },
    { role: 'user', content: ${user} },
  ],
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`

    case 'ollama': {
      const base = (opts.ollamaUrl ?? 'http://localhost:11434').replace(/\/+$/, '')
      return `import OpenAI from 'openai';

// Ollama OpenAI-compatible endpoint (no API key required locally)
const client = new OpenAI({
  baseURL: '${base}/v1',
  apiKey: 'ollama',
});

const stream = await client.chat.completions.create({
  model: '${opts.model}',
  messages: [
    { role: 'system', content: ${system} },
    { role: 'user', content: ${user} },
  ],
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`
    }

    case 'lmstudio': {
      const base = (opts.lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')
      return `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${base}/v1',
  apiKey: '${LM_STUDIO_PLACEHOLDER_KEY}',
});

const stream = await client.chat.completions.create({
  model: '${opts.model}',
  messages: [
    { role: 'system', content: ${system} },
    { role: 'user', content: ${user} },
  ],
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}`
    }
  }
}
