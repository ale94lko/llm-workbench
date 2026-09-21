// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ProviderId, StreamRequest } from '~/types/llm'
import { resolveGenerationParams } from '~/lib/generation'
import { applyProviderTools } from '~/lib/mcp/providerTools'
import type { McpToolDefinition } from '~/lib/mcp/types'
import { LM_STUDIO_PLACEHOLDER_KEY } from '~/lib/exporters/constants'

export type StreamFormat = 'sse' | 'ollama'

export interface ProviderRequest {
  url: string
  headers: Record<string, string>
  body: string
  format: StreamFormat
}

function withTools(
  provider: ProviderId,
  body: Record<string, unknown>,
  tools: StreamRequest['mcpTools'],
): Record<string, unknown> {
  return applyProviderTools(body, tools as McpToolDefinition[] | undefined, provider)
}

export function buildProviderRequest(request: StreamRequest): ProviderRequest {
  const { provider, model, systemPrompt, userPrompt, apiKey, ollamaUrl, lmStudioUrl, mcpTools } = request
  const { temperature, maxTokens } = resolveGenerationParams(request)

  switch (provider) {
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey ?? ''}`,
        },
        body: JSON.stringify(withTools(provider, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }, mcpTools)),
        format: 'sse',
      }

    case 'lmstudio': {
      const base = (lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')
      return {
        url: `${base}/v1/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey || LM_STUDIO_PLACEHOLDER_KEY}`,
        },
        body: JSON.stringify(withTools(provider, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }, mcpTools)),
        format: 'sse',
      }
    }

    case 'groq':
      return {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey ?? ''}`,
        },
        body: JSON.stringify(withTools(provider, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }, mcpTools)),
        format: 'sse',
      }

    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(withTools(provider, {
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          stream: true,
        }, mcpTools)),
        format: 'sse',
      }

    case 'gemini':
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey ?? ''}`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withTools(provider, {
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }, mcpTools)),
        format: 'sse',
      }

    case 'ollama':
      return {
        url: `${ollamaUrl ?? 'http://localhost:11434'}/api/chat`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withTools(provider, {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          options: {
            temperature,
            num_predict: maxTokens,
          },
          stream: true,
        }, mcpTools)),
        format: 'ollama',
      }

    default:
      throw new Error(`Unknown provider: ${String(provider)}`)
  }
}

export function extractTextChunk(parsed: Record<string, unknown>, provider: ProviderId): string {
  switch (provider) {
    case 'anthropic':
      if (parsed.type === 'content_block_delta') {
        const delta = parsed.delta as { text?: string }
        return delta?.text ?? ''
      }
      return ''

    case 'gemini': {
      const candidates = parsed.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
      return candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    case 'ollama': {
      const message = parsed.message as { content?: string } | undefined
      return message?.content ?? (parsed.response as string | undefined) ?? ''
    }

    default: {
      const choices = parsed.choices as Array<{
        delta?: {
          content?: string
          tool_calls?: Array<{ function?: { name?: string, arguments?: string } }>
        }
      }> | undefined
      const delta = choices?.[0]?.delta
      if (delta?.content) return delta.content
      const call = delta?.tool_calls?.[0]?.function
      if (call?.name) {
        return JSON.stringify({
          tool_calls: [{ function: { name: call.name, arguments: call.arguments ?? '{}' } }],
        })
      }
      return ''
    }
  }
}

export async function parseProviderError(response: Response): Promise<string> {
  const errorText = await response.text()
  let message = response.statusText

  try {
    const parsed = JSON.parse(errorText) as {
      error?: { message?: string }
      message?: string
    }
    message = parsed.error?.message ?? parsed.message ?? errorText
  }
  catch {
    message = errorText || message
  }

  return message
}

export function corsHint(provider: ProviderId): string {
  if (provider === 'ollama') {
    return 'Check that Ollama is running and allows browser requests (OLLAMA_ORIGINS).'
  }
  if (provider === 'lmstudio') {
    return 'Check that LM Studio server is running (local server / OpenAI-compatible) and allows browser CORS.'
  }

  return 'Some providers block browser requests. Run locally with npm run dev, or set a stream proxy URL in Settings.'
}
