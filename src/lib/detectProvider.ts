export type Provider = 'groq' | 'gemini'

export function detectProvider(apiKey: string): Provider | null {
  const trimmedKey = apiKey.trim()

  if (trimmedKey.startsWith('gsk_')) {
    return 'groq'
  }

  if (trimmedKey.startsWith('AIza')) {
    return 'gemini'
  }

  return null
}

export function providerLabel(provider: Provider | null): string {
  if (provider === 'groq') {
    return 'Groq'
  }

  if (provider === 'gemini') {
    return 'Gemini'
  }

  return 'Unknown provider'
}
