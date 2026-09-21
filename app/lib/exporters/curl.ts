// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { formatCurlHeaders, getBaseUrl, sampling } from './shared'

export function exportCurl(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)

  if (opts.provider === 'ollama') {
    return `curl ${opts.ollamaUrl ?? 'http://localhost:11434'}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    options: { temperature, num_predict: maxTokens },
    stream: true,
  })}'`
  }

  if (opts.provider === 'lmstudio') {
    const url = getBaseUrl('lmstudio', opts.model, opts.lmStudioUrl)
    return `curl ${url} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${LM_STUDIO_PLACEHOLDER_KEY}" \\
  -d '${JSON.stringify({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  })}'`
  }

  if (opts.provider === 'gemini') {
    const url = `${getBaseUrl('gemini', opts.model)}&key=$GEMINI_API_KEY`
    return `curl "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: opts.userPrompt }] }],
    systemInstruction: { parts: [{ text: opts.systemPrompt }] },
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  })}'`
  }

  if (opts.provider === 'anthropic') {
    const baseUrl = getBaseUrl(opts.provider, opts.model)
    const headerFlags = formatCurlHeaders(opts.provider)
    return `curl ${baseUrl} \\
  ${headerFlags} \\
  -d '${JSON.stringify({
    model: opts.model,
    max_tokens: maxTokens,
    temperature,
    system: opts.systemPrompt,
    messages: [{ role: 'user', content: opts.userPrompt }],
    stream: true,
  })}'`
  }

  const baseUrl = getBaseUrl(opts.provider, opts.model)
  const headerFlags = formatCurlHeaders(opts.provider)

  return `curl ${baseUrl} \\
  ${headerFlags} \\
  -d '${JSON.stringify({
    model: opts.model,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    stream: true,
  })}'`
}
