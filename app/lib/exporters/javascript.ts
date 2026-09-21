// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { formatJsHeaders, getBaseUrl, sampling } from './shared'

export function exportJavaScript(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)

  if (opts.provider === 'ollama') {
    return `const response = await fetch('${opts.ollamaUrl ?? 'http://localhost:11434'}/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: '${opts.model}',
    messages: [
      { role: 'system', content: ${JSON.stringify(opts.systemPrompt)} },
      { role: 'user', content: ${JSON.stringify(opts.userPrompt)} },
    ],
    options: { temperature: ${temperature}, num_predict: ${maxTokens} },
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let result = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const lines = decoder.decode(value).split('\\n').filter(Boolean);
  for (const line of lines) {
    const chunk = JSON.parse(line);
    result += chunk.message?.content ?? '';
    process.stdout.write(chunk.message?.content ?? '');
  }
}`
  }

  if (opts.provider === 'lmstudio') {
    const baseUrl = getBaseUrl('lmstudio', opts.model, opts.lmStudioUrl)
    return `const response = await fetch('${baseUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ${LM_STUDIO_PLACEHOLDER_KEY}',
  },
  body: JSON.stringify({
    model: '${opts.model}',
    messages: [
      { role: 'system', content: ${JSON.stringify(opts.systemPrompt)} },
      { role: 'user', content: ${JSON.stringify(opts.userPrompt)} },
    ],
    temperature: ${temperature},
    max_tokens: ${maxTokens},
    stream: true,
  }),
});`
  }

  if (opts.provider === 'anthropic') {
    const baseUrl = getBaseUrl(opts.provider, opts.model)
    const headers = formatJsHeaders(opts.provider)
    return `const response = await fetch('${baseUrl}', {
  method: 'POST',
  headers: ${headers},
  body: JSON.stringify({
    model: '${opts.model}',
    max_tokens: ${maxTokens},
    temperature: ${temperature},
    system: ${JSON.stringify(opts.systemPrompt)},
    messages: [{ role: 'user', content: ${JSON.stringify(opts.userPrompt)} }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE chunks (data: {...})
  console.log(chunk);
}`
  }

  if (opts.provider === 'gemini') {
    const baseUrl = getBaseUrl(opts.provider, opts.model)
    const headers = formatJsHeaders(opts.provider)
    return `const response = await fetch('${baseUrl}', {
  method: 'POST',
  headers: ${headers},
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: ${JSON.stringify(opts.userPrompt)} }] }],
    systemInstruction: { parts: [{ text: ${JSON.stringify(opts.systemPrompt)} }] },
    generationConfig: { temperature: ${temperature}, maxOutputTokens: ${maxTokens} },
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE chunks (data: {...})
  console.log(chunk);
}`
  }

  const baseUrl = getBaseUrl(opts.provider, opts.model)
  const headers = formatJsHeaders(opts.provider)

  return `const response = await fetch('${baseUrl}', {
  method: 'POST',
  headers: ${headers},
  body: JSON.stringify({
    model: '${opts.model}',
    messages: [
      { role: 'system', content: ${JSON.stringify(opts.systemPrompt)} },
      { role: 'user', content: ${JSON.stringify(opts.userPrompt)} },
    ],
    temperature: ${temperature},
    max_tokens: ${maxTokens},
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE chunks (data: {...})
  console.log(chunk);
}`
}
