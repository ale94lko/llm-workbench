// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { envVarName, sampling } from './shared'

/** Vercel AI SDK (`ai` + `@ai-sdk/*`) streaming snippet for the active provider. */
export function exportVercelAi(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)
  const system = JSON.stringify(opts.systemPrompt)
  const user = JSON.stringify(opts.userPrompt)

  switch (opts.provider) {
    case 'openai':
      return `import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({ apiKey: process.env.${envVarName('openai')} });

const result = streamText({
  model: openai('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`

    case 'anthropic':
      return `import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({ apiKey: process.env.${envVarName('anthropic')} });

const result = streamText({
  model: anthropic('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`

    case 'gemini':
      return `import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({ apiKey: process.env.${envVarName('gemini')} });

const result = streamText({
  model: google('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`

    case 'groq':
      return `import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
  apiKey: process.env.${envVarName('groq')},
  baseURL: 'https://api.groq.com/openai/v1',
});

const result = streamText({
  model: groq('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`

    case 'ollama': {
      const base = (opts.ollamaUrl ?? 'http://localhost:11434').replace(/\/+$/, '')
      return `import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const ollama = createOpenAI({
  baseURL: '${base}/v1',
  apiKey: 'ollama',
});

const result = streamText({
  model: ollama('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`
    }

    case 'lmstudio': {
      const base = (opts.lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')
      return `import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const lmstudio = createOpenAI({
  baseURL: '${base}/v1',
  apiKey: '${LM_STUDIO_PLACEHOLDER_KEY}',
});

const result = streamText({
  model: lmstudio('${opts.model}'),
  system: ${system},
  prompt: ${user},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}`
    }
  }
}
