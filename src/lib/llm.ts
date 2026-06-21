import type { Provider } from './detectProvider'

export type LLMInput = {
  systemPrompt: string
  userMessage: string
}

export type LLMRequest = LLMInput & {
  apiKey: string
  provider: Provider
  model: string
  temperature?: number
  jsonMode?: boolean
}

export type LLMResponse = {
  text: string
}

type GroqModelResponse = {
  data?: Array<{ id?: string }>
}

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']

export async function fetchGroqModels(apiKey: string): Promise<string[]> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Unable to fetch Groq models (${response.status})`)
  }

  const payload = (await response.json()) as GroqModelResponse
  const models = payload.data
    ?.map((model) => model.id)
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b))

  return models ?? []
}

export async function callLLM(input: LLMRequest): Promise<LLMResponse> {
  if (input.provider === 'groq') {
    return callGroq(input)
  }

  return callGemini(input)
}

async function callGroq(input: LLMRequest): Promise<LLMResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userMessage },
      ],
      temperature: input.temperature ?? 0.2,
      max_tokens: 8192,
      response_format: input.jsonMode ? { type: 'json_object' } : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status})`)
  }

  const payload = (await response.json()) as GroqChatResponse
  const text = payload.choices?.[0]?.message?.content?.trim()

  if (!text) {
    throw new Error('Groq returned an empty response')
  }

  return { text }
}

async function callGemini(input: LLMRequest): Promise<LLMResponse> {
  const model = encodeURIComponent(input.model)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      input.apiKey,
    )}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: input.systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: input.userMessage }],
          },
        ],
        generationConfig: {
          temperature: input.temperature ?? 0.2,
          maxOutputTokens: 8192,
          responseMimeType: input.jsonMode ? 'application/json' : undefined,
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`)
  }

  const payload = (await response.json()) as GeminiResponse
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter((part): part is string => Boolean(part))
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return { text }
}
