// Copyright (c) 2026 llm-workbench contributors
// SPDX-License-Identifier: MIT

import type { ExportOptions } from './types'
import { LM_STUDIO_PLACEHOLDER_KEY } from './constants'
import { envVarName, sampling } from './shared'

/** LangChain.js chat-model streaming snippet. */
export function exportLangchainTs(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)
  const system = JSON.stringify(opts.systemPrompt)
  const user = JSON.stringify(opts.userPrompt)

  switch (opts.provider) {
    case 'openai':
      return `import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
  model: '${opts.model}',
  apiKey: process.env.${envVarName('openai')},
  temperature: ${temperature},
  maxTokens: ${maxTokens},
  streaming: true,
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`

    case 'anthropic':
      return `import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatAnthropic({
  model: '${opts.model}',
  apiKey: process.env.${envVarName('anthropic')},
  temperature: ${temperature},
  maxTokens: ${maxTokens},
  streaming: true,
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`

    case 'gemini':
      return `import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatGoogleGenerativeAI({
  model: '${opts.model}',
  apiKey: process.env.${envVarName('gemini')},
  temperature: ${temperature},
  maxOutputTokens: ${maxTokens},
  streaming: true,
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`

    case 'groq':
      return `import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatGroq({
  model: '${opts.model}',
  apiKey: process.env.${envVarName('groq')},
  temperature: ${temperature},
  maxTokens: ${maxTokens},
  streaming: true,
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`

    case 'ollama': {
      const base = (opts.ollamaUrl ?? 'http://localhost:11434').replace(/\/+$/, '')
      return `import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatOllama({
  model: '${opts.model}',
  baseUrl: '${base}',
  temperature: ${temperature},
  numPredict: ${maxTokens},
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`
    }

    case 'lmstudio': {
      const base = (opts.lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')
      return `import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
  model: '${opts.model}',
  apiKey: '${LM_STUDIO_PLACEHOLDER_KEY}',
  configuration: { baseURL: '${base}/v1' },
  temperature: ${temperature},
  maxTokens: ${maxTokens},
  streaming: true,
});

const stream = await model.stream([
  new SystemMessage(${system}),
  new HumanMessage(${user}),
]);

for await (const chunk of stream) {
  process.stdout.write(chunk.content.toString());
}`
    }
  }
}

/** LangChain Python chat-model streaming snippet. */
export function exportLangchainPy(opts: ExportOptions): string {
  const { temperature, maxTokens } = sampling(opts)
  const system = JSON.stringify(opts.systemPrompt)
  const user = JSON.stringify(opts.userPrompt)

  switch (opts.provider) {
    case 'openai':
      return `import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatOpenAI(
    model="${opts.model}",
    api_key=os.environ["${envVarName('openai')}"],
    temperature=${temperature},
    max_tokens=${maxTokens},
    streaming=True,
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`

    case 'anthropic':
      return `import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatAnthropic(
    model="${opts.model}",
    api_key=os.environ["${envVarName('anthropic')}"],
    temperature=${temperature},
    max_tokens=${maxTokens},
    streaming=True,
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`

    case 'gemini':
      return `import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatGoogleGenerativeAI(
    model="${opts.model}",
    google_api_key=os.environ["${envVarName('gemini')}"],
    temperature=${temperature},
    max_output_tokens=${maxTokens},
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`

    case 'groq':
      return `import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatGroq(
    model="${opts.model}",
    api_key=os.environ["${envVarName('groq')}"],
    temperature=${temperature},
    max_tokens=${maxTokens},
    streaming=True,
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`

    case 'ollama': {
      const base = (opts.ollamaUrl ?? 'http://localhost:11434').replace(/\/+$/, '')
      return `from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatOllama(
    model="${opts.model}",
    base_url="${base}",
    temperature=${temperature},
    num_predict=${maxTokens},
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`
    }

    case 'lmstudio': {
      const base = (opts.lmStudioUrl ?? 'http://localhost:1234').replace(/\/+$/, '')
      return `from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

model = ChatOpenAI(
    model="${opts.model}",
    api_key="${LM_STUDIO_PLACEHOLDER_KEY}",
    base_url="${base}/v1",
    temperature=${temperature},
    max_tokens=${maxTokens},
    streaming=True,
)

for chunk in model.stream([
    SystemMessage(content=${system}),
    HumanMessage(content=${user}),
]):
    print(chunk.content, end="", flush=True)`
    }
  }
}
