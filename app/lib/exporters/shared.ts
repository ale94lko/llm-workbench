// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ProviderId } from '~/types/llm'
import { resolveGenerationParams } from '~/lib/generation'
import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'

export function envVarName(provider: Exclude<ProviderId, 'ollama' | 'lmstudio'>): string {
  switch (provider) {
    case 'openai': return 'OPENAI_API_KEY'
    case 'anthropic': return 'ANTHROPIC_API_KEY'
    case 'gemini': return 'GEMINI_API_KEY'
    case 'groq': return 'GROQ_API_KEY'
  }
}

export function sampling(opts: ExportOptions) {
  return resolveGenerationParams(opts)
}

export function getBaseUrl(provider: ProviderId, model?: string, lmStudioUrl?: string): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1/chat/completions'
    case 'lmstudio': return `${(lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')}/v1/chat/completions`
    case 'anthropic': return 'https://api.anthropic.com/v1/messages'
    case 'gemini': return `https://generativelanguage.googleapis.com/v1beta/models/${model ?? 'MODEL'}:streamGenerateContent?alt=sse`
    case 'groq': return 'https://api.groq.com/openai/v1/chat/completions'
    default: return ''
  }
}

export function formatJsHeaders(provider: Exclude<ProviderId, 'ollama' | 'lmstudio'>): string {
  const env = `process.env.${envVarName(provider)}`
  const lines = [`    'Content-Type': 'application/json'`]

  switch (provider) {
    case 'openai':
    case 'groq':
      lines.push(`    Authorization: 'Bearer ' + ${env}`)
      break
    case 'anthropic':
      lines.push(`    'x-api-key': ${env}`)
      lines.push(`    'anthropic-version': '2023-06-01'`)
      break
    case 'gemini':
      lines.push(`    'x-goog-api-key': ${env}`)
      break
  }

  return `{\n${lines.join(',\n')},\n  }`
}

export function formatCurlHeaders(provider: Exclude<ProviderId, 'ollama' | 'lmstudio'>): string {
  const env = `$${envVarName(provider)}`
  const headers: string[] = ['-H "Content-Type: application/json"']

  switch (provider) {
    case 'openai':
    case 'groq':
      headers.push(`-H "Authorization: Bearer ${env}"`)
      break
    case 'anthropic':
      headers.push(`-H "x-api-key: ${env}"`)
      headers.push('-H "anthropic-version: 2023-06-01"')
      break
    case 'gemini':
      headers.push(`-H "x-goog-api-key: ${env}"`)
      break
  }

  return headers.join(' \\\n  ')
}

export function phpHeadersArray(provider: ProviderId): string {
  const lines = [`    'Content-Type: application/json'`]

  if (provider === 'lmstudio') {
    lines.push(`    'Authorization: Bearer ${LM_STUDIO_PLACEHOLDER_KEY}'`)
  }
  else if (provider !== 'ollama') {
    const env = `getenv('${envVarName(provider)}')`
    switch (provider) {
      case 'openai':
      case 'groq':
        lines.push(`    'Authorization: Bearer ' . ${env}`)
        break
      case 'anthropic':
        lines.push(`    'x-api-key: ' . ${env}`)
        lines.push(`    'anthropic-version: 2023-06-01'`)
        break
      case 'gemini':
        lines.push(`    'x-goog-api-key: ' . ${env}`)
        break
    }
  }

  return '[\n' + lines.join(',\n') + ',\n]'
}
