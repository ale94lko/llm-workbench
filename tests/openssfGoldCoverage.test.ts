// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import {
  evaluateAssertion,
  evaluateAssertions,
  summarizeAssertionResults,
  summarizeResponses,
  validateJsonSchema,
} from '../app/lib/assertions'
import {
  colorForIndex,
  modelLabel,
  aggregateFromHistory,
  aggregateFromResponses,
  buildTimelineFromResponses,
  timelineSeries,
  toChartData,
} from '../app/lib/metrics'
import { firstSchemaIssue } from '../app/lib/schemas/promptBackup'
import { LM_STUDIO_PLACEHOLDER_KEY } from '../app/lib/exporters/constants'
import {
  createPromptBackup,
  mergePromptBackup,
  parsePromptBackup,
} from '../app/lib/promptBackup'
import {
  buildProviderRequest,
  corsHint,
  extractTextChunk,
  parseProviderError,
} from '../app/lib/streamProviders'
import {
  buildToolFollowUpMessages,
  createToolSignatureId,
  detectToolCalls,
  flattenMessagesForLegacyPrompt,
} from '../app/lib/toolCall'
import type { StreamError } from '../app/lib/errors'
import {
  streamCompletionDirect,
  streamCompletionViaProxy,
} from '../app/lib/streamClient'
import { useLLMStream } from '../app/composables/useLLMStream'
import { useCompareRunner } from '../app/composables/useCompareRunner'
import { usePromptStore } from '../app/stores/usePromptStore'
import { useProviderStore } from '../app/stores/useProviderStore'
import type { ExecutionHistoryEntry, ModelResponse, StreamRequest } from '../app/types/llm'

const streamCompletion = vi.fn()
vi.stubGlobal('useLLMStream', () => ({ streamCompletion }))

const openaiRequest: StreamRequest = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  systemPrompt: 'Sys',
  userPrompt: 'Hi',
  apiKey: 'sk-test',
}

function textStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

describe('OpenSSF Gold coverage gaps', () => {
  describe('streamProviders', () => {
    it('builds LM Studio requests and falls back to a local URL', () => {
      const req = buildProviderRequest({
        ...openaiRequest,
        provider: 'lmstudio',
        apiKey: '',
        lmStudioUrl: 'http://localhost:1234///',
      })
      expect(req.url).toBe('http://localhost:1234/v1/chat/completions')
      expect(req.headers.Authorization).toBe(`Bearer ${LM_STUDIO_PLACEHOLDER_KEY}`)

      const defaults = buildProviderRequest({
        ...openaiRequest,
        provider: 'lmstudio',
        apiKey: undefined,
        lmStudioUrl: undefined,
      })
      expect(defaults.url).toContain('localhost:1234')
    })

    it('throws on an unknown provider and extracts empty/fallback chunks', () => {
      expect(() => buildProviderRequest({
        ...openaiRequest,
        provider: 'unknown' as StreamRequest['provider'],
      })).toThrow(/unknown provider/i)

      expect(extractTextChunk({ type: 'message_start' }, 'anthropic')).toBe('')
      expect(extractTextChunk({ type: 'content_block_delta' }, 'anthropic')).toBe('')
      expect(extractTextChunk({}, 'gemini')).toBe('')
      expect(extractTextChunk({ candidates: [{ content: {} }] }, 'gemini')).toBe('')
      expect(extractTextChunk({ response: 'plain' }, 'ollama')).toBe('plain')
      expect(extractTextChunk({}, 'openai')).toBe('')
    })

    it('parses provider errors and CORS hints', async () => {
      expect(await parseProviderError(new Response(
        JSON.stringify({ error: { message: 'nope' } }),
        { status: 400, statusText: 'Bad Request' },
      ))).toBe('nope')
      expect(await parseProviderError(new Response(
        JSON.stringify({ message: 'top-level' }),
        { status: 400, statusText: 'Bad Request' },
      ))).toBe('top-level')
      expect(await parseProviderError(new Response('not-json', { status: 500, statusText: 'Err' }))).toBe('not-json')
      expect(await parseProviderError(new Response('', { status: 502, statusText: 'Bad Gateway' }))).toBe('Bad Gateway')

      expect(corsHint('ollama')).toMatch(/OLLAMA_ORIGINS/)
      expect(corsHint('lmstudio')).toMatch(/LM Studio/)
      expect(corsHint('openai')).toMatch(/stream proxy/)
    })
  })

  describe('toolCall', () => {
    it('covers detection fallbacks and follow-up flattening', () => {
      expect(createToolSignatureId()).toMatch(/^tool-/)
      expect(detectToolCalls('plain prose')).toEqual([])
      expect(detectToolCalls('prefix {not-json')).toEqual([])
      expect(detectToolCalls(JSON.stringify({ tool_calls: [null, { function: {} }] }))).toEqual([])
      expect(detectToolCalls(JSON.stringify({
        tool_calls: [{ name: 'direct', arguments: '{bad' }],
      }))[0]?.name).toBe('direct')
      expect(detectToolCalls(JSON.stringify({ tool: 'lookup', parameters: { a: 1 } }))[0]?.name).toBe('lookup')
      expect(detectToolCalls(JSON.stringify({ function: { name: 'fn', arguments: { z: 2 } } }))[0]?.name).toBe('fn')
      expect(detectToolCalls(JSON.stringify({ arguments: {} }))).toEqual([])

      const messages = buildToolFollowUpMessages({
        systemPrompt: 's',
        userPrompt: 'u',
        assistantContent: 'a',
        toolName: 't',
        mockResultJson: '  ',
      })
      expect(messages[3]?.content).toBe('{}')
      const invalid = buildToolFollowUpMessages({
        systemPrompt: 's',
        userPrompt: 'u',
        assistantContent: 'a',
        toolName: 't',
        mockResultJson: 'not-json',
      })
      expect(invalid[3]?.content).toBe('not-json')

      const flat = flattenMessagesForLegacyPrompt([
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'yo' },
        { role: 'tool', content: 'ok' },
      ])
      expect(flat.systemPrompt).toBe('')
      expect(flat.userPrompt).toContain('Assistant:')
      expect(flat.userPrompt).toContain('Tool (tool):')
    })
  })

  describe('promptBackup scrubbing', () => {
    it('drops invalid nested records and fills defaults', () => {
      const payload = createPromptBackup(
        [{
          id: 'h1',
          systemPrompt: 's',
          userPrompt: 'u',
          variables: { ok: 'yes', skip: 1 as unknown as string },
          models: [
            { slotId: 's1', provider: 'openai', modelId: 'm1' },
            { slotId: 'bad', provider: 'nope' as never, modelId: 'x' },
            null as never,
          ],
          responses: [
            {
              slotId: 's1',
              provider: 'openai',
              modelId: 'm1',
              content: 9 as unknown as string,
              status: 'weird' as never,
              metrics: {},
              assertionResults: [
                { ruleId: 'r', kind: 'jsonValid', pass: true, message: 'ok' },
                { ruleId: 1 } as never,
              ],
            },
            { slotId: 'x' } as never,
          ],
          createdAt: undefined as never,
          assertionSummary: 'maybe' as never,
        } as ExecutionHistoryEntry],
        [{
          id: 'p1',
          name: 'n',
          systemPrompt: 's',
          userPrompt: 'u',
          tags: ['a', 2 as unknown as string],
          version: 'x' as never,
          createdAt: undefined as never,
          updatedAt: undefined as never,
          variables: {},
          generation: { topP: 0.9 },
          revisions: [
            { systemPrompt: 's', userPrompt: 'u', variables: {}, savedAt: 't', version: 1 },
            { systemPrompt: 1 } as never,
          ],
        } as never],
      )
      expect(payload.history[0]?.models).toHaveLength(1)
      expect(payload.history[0]?.responses[0]?.status).toBe('idle')
      expect(payload.history[0]?.responses[0]?.metrics.latencyMs).toBe(0)
      expect(payload.history[0]?.assertionSummary).toBeUndefined()
      expect(payload.savedPrompts[0]?.generation).toEqual({ topP: 0.9 })
      expect(payload.savedPrompts[0]?.tags).toEqual(['a'])
      expect(payload.savedPrompts[0]?.revisions).toHaveLength(1)

      const parsed = parsePromptBackup(JSON.stringify({
        version: 1,
        history: [{ not: 'an entry' }],
        savedPrompts: [{ not: 'a prompt' }],
      }))
      expect(parsed.exportedAt).toEqual(expect.any(String))
      expect(parsed.history).toEqual([])
      expect(parsed.savedPrompts).toEqual([])

      expect(createPromptBackup(
        [{ not: 'valid' } as never],
        [{ not: 'valid' } as never],
      ).history).toEqual([])
      expect(firstSchemaIssue([])).toBe('Invalid input')
    })

    it('caps merged history at 100', () => {
      const current = {
        history: Array.from({ length: 80 }, (_, i) => ({
          id: `c${i}`,
          systemPrompt: 's',
          userPrompt: 'u',
          variables: {},
          models: [],
          responses: [],
          createdAt: `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
        })),
        savedPrompts: [],
      }
      const incoming = createPromptBackup(
        Array.from({ length: 40 }, (_, i) => ({
          id: `i${i}`,
          systemPrompt: 's',
          userPrompt: 'u',
          variables: {},
          models: [],
          responses: [],
          createdAt: `2026-02-01T00:00:${String(i).padStart(2, '0')}.000Z`,
        })),
        [],
      )
      expect(mergePromptBackup(current, incoming).history).toHaveLength(100)
    })
  })

  describe('metrics extras', () => {
    const idle: ModelResponse = {
      slotId: 's',
      provider: 'openai',
      modelId: 'unknown-model',
      content: '',
      status: 'idle',
      metrics: { latencyMs: 1, ttftMs: null, inputTokens: 0, outputTokens: 0, costUsd: 0 },
    }
    const done: ModelResponse = {
      ...idle,
      status: 'done',
      metrics: { latencyMs: 10, ttftMs: 2, inputTokens: 1, outputTokens: 2, costUsd: 0.1 },
    }
    const error: ModelResponse = {
      ...idle,
      modelId: 'gpt-4o-mini',
      status: 'error',
      metrics: { latencyMs: 5, ttftMs: null, inputTokens: 1, outputTokens: 0, costUsd: 0 },
    }

    it('skips idle rows, wraps chart colors, and groups timeline series', () => {
      expect(modelLabel('unknown-model')).toBe('unknown-model')
      expect(colorForIndex(8)).toBe(colorForIndex(0))
      const history = aggregateFromHistory([{
        id: 'h',
        systemPrompt: '',
        userPrompt: '',
        variables: {},
        models: [],
        responses: [idle, done, error],
        createdAt: '2026-01-01T00:00:00Z',
      }])
      expect(history.some(a => a.modelId === 'unknown-model' && a.successCount === 1)).toBe(true)
      expect(history.some(a => a.avgTtftMs === null)).toBe(true)

      const fromLatest = aggregateFromResponses([idle, error])
      expect(fromLatest).toHaveLength(1)
      expect(fromLatest[0]?.successCount).toBe(0)

      const chart = toChartData(fromLatest, a => a.avgLatencyMs, v => `x${v}`)
      expect(chart[0]?.sublabel).toBe('x5')

      expect(buildTimelineFromResponses([idle, done], 'd')).toHaveLength(1)
      const series = timelineSeries([
        { date: 'd', modelId: 'm', label: 'L', latencyMs: 1 },
        { date: 'd', modelId: 'm', label: 'L', latencyMs: 2 },
      ])
      expect(series.get('m')?.values).toEqual([1, 2])
    })
  })

  describe('assertions extras', () => {
    it('covers schema/array/disabled/unknown/empty-summary paths', () => {
      expect(validateJsonSchema(1, null)).toMatch(/json object/i)
      expect(validateJsonSchema(['a'], { type: 'array', items: { type: 'number' } })).toMatch(/items\[0\]/)
      expect(evaluateAssertion({ id: 's', kind: 'jsonSchema', schemaJson: '{bad' }, '{}').pass).toBe(false)
      expect(evaluateAssertion({ id: 'f', kind: 'forbiddenSubstring' }, 'x').pass).toBe(false)
      expect(evaluateAssertion({ id: 'l', kind: 'length', unit: 'words', min: 2 }, '   ').pass).toBe(false)
      expect(evaluateAssertion({ id: 'u', kind: 'nope' as never }, 'x').message).toMatch(/unknown/i)
      expect(evaluateAssertions([{ id: '1', kind: 'jsonValid', enabled: false }], '{}')).toEqual([])
      expect(summarizeAssertionResults([])).toBe('none')
      expect(summarizeResponses([{ assertionResults: undefined }, { assertionResults: [] }])).toBe('none')
    })
  })

  describe('streamClient extras', () => {
    it('skips malformed SSE chunks', async () => {
      const callbacks = {
        chunks: [] as string[],
        done: false,
        error: null as StreamError | null,
        onChunk: (text: string) => { callbacks.chunks.push(text) },
        onDone: () => { callbacks.done = true },
        onError: (error: StreamError) => { callbacks.error = error },
      }
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        textStream([
          'data: not-json\n',
          'data: {"choices":[{"delta":{"content":"ok"}}]}\n',
          'data: [DONE]\n',
        ]),
        { status: 200 },
      )))
      await streamCompletionDirect(openaiRequest, callbacks)
      expect(callbacks.chunks.join('')).toBe('ok')
      expect(callbacks.done).toBe(true)
    })

    it('skips malformed Ollama NDJSON chunks', async () => {
      const callbacks = {
        chunks: [] as string[],
        done: false,
        error: null as StreamError | null,
        onChunk: (text: string) => { callbacks.chunks.push(text) },
        onDone: () => { callbacks.done = true },
        onError: (error: StreamError) => { callbacks.error = error },
      }
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        textStream([
          '{bad\n',
          '{"message":{"content":"x"},"done":true}\n',
        ]),
        { status: 200 },
      )))
      await streamCompletionDirect({
        provider: 'ollama',
        model: 'llama3.2',
        systemPrompt: 'Sys',
        userPrompt: 'Hi',
        ollamaUrl: 'http://localhost:11434',
      }, callbacks)
      expect(callbacks.error).toBeNull()
      expect(callbacks.chunks.join('')).toBe('x')
    })

    it('ignores aborted fetches and maps proxy/unknown errors', async () => {
      const callbacks = {
        chunks: [] as string[],
        done: false,
        error: null as StreamError | null,
        onChunk: (text: string) => { callbacks.chunks.push(text) },
        onDone: () => { callbacks.done = true },
        onError: (error: StreamError) => { callbacks.error = error },
      }

      const controller = new AbortController()
      controller.abort()
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw new Error('aborted')
      }))
      await streamCompletionDirect(openaiRequest, callbacks, controller.signal)
      expect(callbacks.error).toBeNull()

      vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500, statusText: 'Boom' })))
      await streamCompletionViaProxy('/api/stream', openaiRequest, callbacks)
      expect(callbacks.error?.code).toBe('http')

      callbacks.error = null
      vi.stubGlobal('fetch', vi.fn(async () => {
        throw 'string-fail'
      }))
      await streamCompletionDirect(openaiRequest, callbacks)
      expect(callbacks.error?.message).toBe('Stream failed')
    })
  })
})

describe('store and composable gold gaps', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false, createSpy: vi.fn }))
    streamCompletion.mockReset().mockImplementation(async (_req, handlers) => {
      handlers.onChunk('{"ok":true}')
      handlers.onDone()
    })
    const providerStore = useProviderStore()
    providerStore.selectedModels = [
      { slotId: 'slot-1', provider: 'openai', modelId: 'gpt-4o-mini' },
    ]
    providerStore.setApiKey('openai', 'sk-test')
  })

  it('covers prompt store CRUD no-ops and merge import', () => {
    const store = usePromptStore()
    store.updateResponse('missing', { content: 'x' })
    store.updateAssertion('missing', { enabled: false })
    store.updateToolSignature('missing', { name: 'x' })
    store.loadPrompt('missing')
    store.loadFromHistory('missing')

    store.addAssertion({ kind: 'jsonValid' })
    store.addAssertion({ id: 'fixed', kind: 'jsonValid', enabled: false })
    store.updateAssertion(store.assertions[0]!.id, { enabled: false })
    store.removeAssertion('fixed')
    expect(store.assertions).toHaveLength(1)

    store.addToolSignature({ name: '  weather  ' })
    store.addToolSignature({ id: 't2', name: 'other' })
    store.updateToolSignature(store.toolSignatures[0]!.id, { description: 'd' })
    store.removeToolSignature('t2')
    expect(store.toolSignatures[0]?.name).toBe('weather')

    store.savePrompt('Pack')
    const json = store.exportBackupJson()
    store.importBackupJson(json, 'merge')
    expect(store.savedPrompts.length).toBeGreaterThan(0)
    expect(store.exportPromptMarkdown().length).toBeGreaterThan(0)
  })

  it('throws in air-gapped proxy mode and no-ops continueWithTool without a slot', async () => {
    const provider = useProviderStore()
    provider.airGapped = true
    provider.streamProxyUrl = 'https://proxy.example/stream'
    const { streamCompletion: run } = useLLMStream()
    await expect(run(openaiRequest, {
      onChunk: () => {},
      onDone: () => {},
      onError: () => {},
    })).rejects.toThrow(/air-gapped/i)

    const { continueWithTool } = useCompareRunner()
    await continueWithTool({
      slotId: 'nope',
      toolName: 't',
      mockResultJson: '{}',
      assistantContent: '{}',
    })
    expect(streamCompletion).not.toHaveBeenCalled()
  })

  it('evaluates assertions after continueWithTool and cancels leftover bulk rows', async () => {
    const promptStore = usePromptStore()
    promptStore.addAssertion({ kind: 'jsonValid' })
    promptStore.setResponses([{
      slotId: 'slot-1',
      provider: 'openai',
      modelId: 'gpt-4o-mini',
      content: '{}',
      status: 'done',
      metrics: { latencyMs: 10, ttftMs: 5, inputTokens: 1, outputTokens: 1, costUsd: 0 },
    }])
    const { continueWithTool, runBulkDataset, stopAll, bulkResults } = useCompareRunner()
    await continueWithTool({
      slotId: 'slot-1',
      toolName: 't',
      mockResultJson: '{}',
      assistantContent: '{}',
    })
    expect(promptStore.responses[0]?.assertionResults?.[0]?.pass).toBe(true)

    let release!: () => void
    streamCompletion.mockImplementation(() => new Promise<void>((resolve) => {
      release = resolve
    }))
    const running = runBulkDataset({
      rows: [{ topic: 'a' }, { topic: 'b' }],
      mapping: {},
    })
    await Promise.resolve()
    await Promise.resolve()
    stopAll()
    release?.()
    await running
    expect(bulkResults.value.some(r => r.status === 'cancelled' || r.status === 'pending' || r.status === 'error')).toBe(true)
  })
})
