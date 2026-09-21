// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { getBaseUrl, sampling } from './shared'

export function exportPython(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)

  if (opts.provider === 'openai') {
    return `import os
from openai import OpenAI

client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

stream = client.chat.completions.create(
    model="${opts.model}",
    messages=[
        {"role": "system", "content": ${JSON.stringify(opts.systemPrompt)}},
        {"role": "user", "content": ${JSON.stringify(opts.userPrompt)}},
    ],
    temperature=${temperature},
    max_tokens=${maxTokens},
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`
  }

  if (opts.provider === 'anthropic') {
    return `import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])

with client.messages.stream(
    model="${opts.model}",
    max_tokens=${maxTokens},
    temperature=${temperature},
    system=${JSON.stringify(opts.systemPrompt)},
    messages=[{"role": "user", "content": ${JSON.stringify(opts.userPrompt)}}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)`
  }

  if (opts.provider === 'groq') {
    return `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ['GROQ_API_KEY'],
    base_url="https://api.groq.com/openai/v1",
)

stream = client.chat.completions.create(
    model="${opts.model}",
    messages=[
        {"role": "system", "content": ${JSON.stringify(opts.systemPrompt)}},
        {"role": "user", "content": ${JSON.stringify(opts.userPrompt)}},
    ],
    temperature=${temperature},
    max_tokens=${maxTokens},
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`
  }

  if (opts.provider === 'gemini') {
    return `import os
from google import genai

client = genai.Client(api_key=os.environ['GEMINI_API_KEY'])

stream = client.models.generate_content_stream(
    model="${opts.model}",
    contents=${JSON.stringify(opts.userPrompt)},
    config=genai.types.GenerateContentConfig(
        system_instruction=${JSON.stringify(opts.systemPrompt)},
        temperature=${temperature},
        max_output_tokens=${maxTokens},
    ),
)

for chunk in stream:
    if chunk.text:
        print(chunk.text, end="", flush=True)`
  }

  if (opts.provider === 'ollama') {
    const url = `${opts.ollamaUrl ?? 'http://localhost:11434'}/api/chat`
    return `import json
import requests

response = requests.post(
    "${url}",
    json={
        "model": "${opts.model}",
        "messages": [
            {"role": "system", "content": ${JSON.stringify(opts.systemPrompt)}},
            {"role": "user", "content": ${JSON.stringify(opts.userPrompt)}},
        ],
        "options": {"temperature": ${temperature}, "num_predict": ${maxTokens}},
        "stream": True,
    },
    stream=True,
)
response.raise_for_status()

for line in response.iter_lines():
    if not line:
        continue
    chunk = json.loads(line)
    content = chunk.get("message", {}).get("content", "")
    if content:
        print(content, end="", flush=True)`
  }

  if (opts.provider === 'lmstudio') {
    const url = getBaseUrl('lmstudio', opts.model, opts.lmStudioUrl)
    return `import requests

response = requests.post(
    "${url}",
    headers={"Authorization": "Bearer ${LM_STUDIO_PLACEHOLDER_KEY}"},
    json={
        "model": "${opts.model}",
        "messages": [
            {"role": "system", "content": ${JSON.stringify(opts.systemPrompt)}},
            {"role": "user", "content": ${JSON.stringify(opts.userPrompt)}},
        ],
        "temperature": ${temperature},
        "max_tokens": ${maxTokens},
        "stream": True,
    },
    stream=True,
)
response.raise_for_status()
print(response.text)`
  }

  return `# Provider: ${opts.provider}
# Use the corresponding SDK or REST API
# Model: ${opts.model}
# System: ${JSON.stringify(opts.systemPrompt)}
# User: ${JSON.stringify(opts.userPrompt)}`
}
