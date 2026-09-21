// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { envVarName, exportCode } from '~/lib/exporters'
import type { ExportLanguage } from '~/lib/exporters'
import {
  formatCurlHeaders,
  formatJsHeaders,
  getBaseUrl,
  phpHeadersArray,
} from '~/lib/exporters/shared'
import { LM_STUDIO_PLACEHOLDER_KEY } from '~/lib/exporters/constants'
import type { ProviderId } from '~/types/llm'

describe('lib/exporters', () => {
  const baseOpts = {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    systemPrompt: 'You are helpful.',
    userPrompt: 'Say hi',
  }

  const languages: ExportLanguage[] = [
    'javascript',
    'python',
    'curl',
    'php',
    'sdk-typescript',
    'vercel-ai',
    'langchain-ts',
    'langchain-py',
  ]
  const providers: ProviderId[] = ['openai', 'anthropic', 'gemini', 'groq', 'ollama', 'lmstudio']

  it.each(languages)('exports a non-empty %s snippet for OpenAI', (language) => {
    const code = exportCode(language, baseOpts)
    expect(code.length).toBeGreaterThan(20)
    expect(code).toContain('gpt-4o-mini')
  })

  it.each(providers)('sdk-typescript covers provider %s without secrets', (provider) => {
    const code = exportCode('sdk-typescript', {
      ...baseOpts,
      provider,
      model: provider === 'ollama' ? 'llama3.2' : provider === 'lmstudio' ? 'local-model' : baseOpts.model,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
      apiKey: 'sk-should-never-appear',
    })
    expect(code).not.toContain('sk-should-never-appear')

    if (provider === 'openai') {
      expect(code).toContain("import OpenAI from 'openai'")
      expect(code).toContain('process.env.OPENAI_API_KEY')
    }
    else if (provider === 'anthropic') {
      expect(code).toContain('@anthropic-ai/sdk')
      expect(code).toContain('process.env.ANTHROPIC_API_KEY')
    }
    else if (provider === 'gemini') {
      expect(code).toContain('@google/genai')
      expect(code).toContain('process.env.GEMINI_API_KEY')
    }
    else if (provider === 'groq') {
      expect(code).toContain('groq-sdk')
      expect(code).toContain('process.env.GROQ_API_KEY')
    }
    else if (provider === 'ollama') {
      expect(code).toContain('http://localhost:11434/v1')
    }
    else {
      expect(code).toContain('http://localhost:1234/v1')
      expect(code).toContain(LM_STUDIO_PLACEHOLDER_KEY)
    }
  })

  it.each(providers)('vercel-ai covers provider %s', (provider) => {
    const code = exportCode('vercel-ai', {
      ...baseOpts,
      provider,
      ollamaUrl: 'http://127.0.0.1:11434',
      lmStudioUrl: 'http://127.0.0.1:1234',
    })
    expect(code).toContain('streamText')
    expect(code).toContain("from 'ai'")
    if (provider === 'anthropic') expect(code).toContain('@ai-sdk/anthropic')
    if (provider === 'gemini') expect(code).toContain('@ai-sdk/google')
    if (provider === 'openai' || provider === 'groq' || provider === 'ollama' || provider === 'lmstudio') {
      expect(code).toContain('@ai-sdk/openai')
    }
  })

  it.each(providers)('langchain-ts covers provider %s', (provider) => {
    const code = exportCode('langchain-ts', {
      ...baseOpts,
      provider,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
    })
    expect(code).toContain('@langchain/core/messages')
    if (provider === 'openai') expect(code).toContain('@langchain/openai')
    if (provider === 'anthropic') expect(code).toContain('@langchain/anthropic')
    if (provider === 'gemini') expect(code).toContain('@langchain/google-genai')
    if (provider === 'groq') expect(code).toContain('@langchain/groq')
    if (provider === 'ollama') expect(code).toContain('@langchain/ollama')
    if (provider === 'lmstudio') expect(code).toContain(LM_STUDIO_PLACEHOLDER_KEY)
  })

  it.each(providers)('langchain-py covers provider %s with env placeholders', (provider) => {
    const code = exportCode('langchain-py', {
      ...baseOpts,
      provider,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
      apiKey: 'secret-key-value',
    })
    expect(code).not.toContain('secret-key-value')
    expect(code).toContain('langchain_core.messages')
    if (provider === 'openai') expect(code).toContain('OPENAI_API_KEY')
    if (provider === 'anthropic') expect(code).toContain('ANTHROPIC_API_KEY')
    if (provider === 'gemini') expect(code).toContain('GEMINI_API_KEY')
    if (provider === 'groq') expect(code).toContain('GROQ_API_KEY')
    if (provider === 'ollama') expect(code).toContain('langchain_ollama')
  })

  it.each(providers)('javascript covers provider %s', (provider) => {
    const code = exportCode('javascript', {
      ...baseOpts,
      provider,
      model: provider === 'ollama' ? 'llama3.2' : provider === 'lmstudio' ? 'local-model' : baseOpts.model,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
    })
    expect(code.length).toBeGreaterThan(20)
    expect(code).toContain('fetch(')

    if (provider === 'ollama') {
      expect(code).toContain('http://localhost:11434/api/chat')
      expect(code).toContain('num_predict')
    }
    else if (provider === 'lmstudio') {
      expect(code).toContain('http://localhost:1234/v1/chat/completions')
      expect(code).toContain(`Authorization: 'Bearer ${LM_STUDIO_PLACEHOLDER_KEY}'`)
    }
    else if (provider === 'anthropic') {
      expect(code).toContain('https://api.anthropic.com/v1/messages')
      expect(code).toContain('process.env.ANTHROPIC_API_KEY')
      expect(code).toContain("'anthropic-version': '2023-06-01'")
    }
    else if (provider === 'gemini') {
      expect(code).toContain('generativelanguage.googleapis.com')
      expect(code).toContain('process.env.GEMINI_API_KEY')
      expect(code).toContain('systemInstruction')
    }
    else if (provider === 'groq') {
      expect(code).toContain('https://api.groq.com/openai/v1/chat/completions')
      expect(code).toContain('process.env.GROQ_API_KEY')
    }
    else {
      expect(code).toContain('process.env.OPENAI_API_KEY')
      expect(code).toContain('https://api.openai.com/v1/chat/completions')
    }
  })

  it.each(providers)('curl covers provider %s', (provider) => {
    const code = exportCode('curl', {
      ...baseOpts,
      provider,
      model: provider === 'gemini' ? 'gemini-2.0-flash' : baseOpts.model,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
    })
    expect(code).toMatch(/^curl /)

    if (provider === 'ollama') {
      expect(code).toContain('http://localhost:11434/api/chat')
    }
    else if (provider === 'lmstudio') {
      expect(code).toContain('http://localhost:1234/v1/chat/completions')
      expect(code).toContain(`Authorization: Bearer ${LM_STUDIO_PLACEHOLDER_KEY}`)
    }
    else if (provider === 'gemini') {
      expect(code).toContain('generativelanguage.googleapis.com')
      expect(code).toContain('$GEMINI_API_KEY')
      expect(code).toContain('systemInstruction')
    }
    else if (provider === 'anthropic') {
      expect(code).toContain('https://api.anthropic.com/v1/messages')
      expect(code).toContain('$ANTHROPIC_API_KEY')
      expect(code).toContain('anthropic-version: 2023-06-01')
    }
    else if (provider === 'groq') {
      expect(code).toContain('https://api.groq.com/openai/v1/chat/completions')
      expect(code).toContain('$GROQ_API_KEY')
    }
    else {
      expect(code).toContain('https://api.openai.com')
      expect(code).toContain('$OPENAI_API_KEY')
    }
  })

  it.each(providers)('php covers provider %s', (provider) => {
    const code = exportCode('php', {
      ...baseOpts,
      provider,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
    })
    expect(code).toContain('curl_init')
    expect(code).toContain('CURLOPT_HTTPHEADER')

    if (provider === 'ollama') {
      expect(code).toContain('http://localhost:11434/api/chat')
      expect(code).toContain('num_predict')
    }
    else if (provider === 'lmstudio') {
      expect(code).toContain('http://localhost:1234/v1/chat/completions')
      expect(code).toContain(`Authorization: Bearer ${LM_STUDIO_PLACEHOLDER_KEY}`)
    }
    else if (provider === 'anthropic') {
      expect(code).toContain("getenv('ANTHROPIC_API_KEY')")
      expect(code).toContain('anthropic-version: 2023-06-01')
    }
    else if (provider === 'gemini') {
      expect(code).toContain("getenv('GEMINI_API_KEY')")
      expect(code).toContain('systemInstruction')
    }
    else if (provider === 'groq') {
      expect(code).toContain("getenv('GROQ_API_KEY')")
    }
    else {
      expect(code).toContain("getenv('OPENAI_API_KEY')")
    }
  })

  it.each(providers)('python covers provider %s', (provider) => {
    const code = exportCode('python', {
      ...baseOpts,
      provider,
      ollamaUrl: 'http://localhost:11434',
      lmStudioUrl: 'http://localhost:1234',
    })
    expect(code.length).toBeGreaterThan(20)

    if (provider === 'openai') {
      expect(code).toContain("os.environ['OPENAI_API_KEY']")
      expect(code).toContain('from openai import OpenAI')
    }
    else if (provider === 'anthropic') {
      expect(code).toContain("os.environ['ANTHROPIC_API_KEY']")
      expect(code).toContain('import anthropic')
    }
    else if (provider === 'groq') {
      expect(code).toContain("os.environ['GROQ_API_KEY']")
      expect(code).toContain('https://api.groq.com/openai/v1')
    }
    else if (provider === 'gemini') {
      expect(code).toContain("os.environ['GEMINI_API_KEY']")
      expect(code).toContain('from google import genai')
    }
    else if (provider === 'ollama') {
      expect(code).toContain('http://localhost:11434/api/chat')
      expect(code).toContain('import requests')
    }
    else {
      expect(code).toContain('http://localhost:1234/v1/chat/completions')
      expect(code).toContain(`Bearer ${LM_STUDIO_PLACEHOLDER_KEY}`)
    }
  })

  it('javascript uses process.env placeholder', () => {
    const code = exportCode('javascript', baseOpts)
    expect(code).toContain('process.env.OPENAI_API_KEY')
    expect(code).toContain('fetch(')
  })

  it('python uses os.environ placeholder', () => {
    const code = exportCode('python', baseOpts)
    expect(code).toContain("os.environ['OPENAI_API_KEY']")
    expect(code).toContain('from openai import OpenAI')
  })

  it('curl uses $OPENAI_API_KEY', () => {
    const code = exportCode('curl', baseOpts)
    expect(code).toContain('curl https://api.openai.com')
    expect(code).toContain('$OPENAI_API_KEY')
  })

  it('php uses getenv', () => {
    const code = exportCode('php', baseOpts)
    expect(code).toContain('curl_init')
    expect(code).toContain("getenv('OPENAI_API_KEY')")
  })

  it('maps envVarName for cloud providers', () => {
    expect(envVarName('openai')).toBe('OPENAI_API_KEY')
    expect(envVarName('anthropic')).toBe('ANTHROPIC_API_KEY')
    expect(envVarName('gemini')).toBe('GEMINI_API_KEY')
    expect(envVarName('groq')).toBe('GROQ_API_KEY')
  })
})

describe('lib/exporters/shared', () => {
  it('getBaseUrl returns provider endpoints', () => {
    expect(getBaseUrl('openai')).toBe('https://api.openai.com/v1/chat/completions')
    expect(getBaseUrl('anthropic')).toBe('https://api.anthropic.com/v1/messages')
    expect(getBaseUrl('groq')).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(getBaseUrl('gemini', 'gemini-2.0-flash')).toContain('gemini-2.0-flash:streamGenerateContent')
    expect(getBaseUrl('lmstudio', undefined, 'http://localhost:1234/')).toBe(
      'http://localhost:1234/v1/chat/completions',
    )
    expect(getBaseUrl('ollama')).toBe('')
  })

  it('formatJsHeaders for each cloud provider', () => {
    expect(formatJsHeaders('openai')).toContain("Authorization: 'Bearer ' + process.env.OPENAI_API_KEY")
    expect(formatJsHeaders('groq')).toContain("Authorization: 'Bearer ' + process.env.GROQ_API_KEY")
    expect(formatJsHeaders('anthropic')).toContain("'x-api-key': process.env.ANTHROPIC_API_KEY")
    expect(formatJsHeaders('anthropic')).toContain("'anthropic-version': '2023-06-01'")
    expect(formatJsHeaders('gemini')).toContain("'x-goog-api-key': process.env.GEMINI_API_KEY")
  })

  it('formatCurlHeaders for each cloud provider', () => {
    expect(formatCurlHeaders('openai')).toContain('-H "Authorization: Bearer $OPENAI_API_KEY"')
    expect(formatCurlHeaders('groq')).toContain('-H "Authorization: Bearer $GROQ_API_KEY"')
    expect(formatCurlHeaders('anthropic')).toContain('-H "x-api-key: $ANTHROPIC_API_KEY"')
    expect(formatCurlHeaders('anthropic')).toContain('-H "anthropic-version: 2023-06-01"')
    expect(formatCurlHeaders('gemini')).toContain('-H "x-goog-api-key: $GEMINI_API_KEY"')
  })

  it('phpHeadersArray for cloud, ollama, and lmstudio', () => {
    expect(phpHeadersArray('openai')).toContain("Authorization: Bearer ' . getenv('OPENAI_API_KEY')")
    expect(phpHeadersArray('groq')).toContain("Authorization: Bearer ' . getenv('GROQ_API_KEY')")
    expect(phpHeadersArray('anthropic')).toContain("x-api-key: ' . getenv('ANTHROPIC_API_KEY')")
    expect(phpHeadersArray('gemini')).toContain("x-goog-api-key: ' . getenv('GEMINI_API_KEY')")
    expect(phpHeadersArray('lmstudio')).toContain(`'Authorization: Bearer ${LM_STUDIO_PLACEHOLDER_KEY}'`)
    expect(phpHeadersArray('ollama')).toBe("[\n    'Content-Type: application/json',\n]")
  })
})
