import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'
import { detectProvider, providerLabel } from '../lib/detectProvider'
import { fetchGroqModels, GEMINI_MODELS } from '../lib/llm'
import { type ApiStorageMode, useAppStore } from '../store/appStore'

const REPO_URL = 'https://github.com/galihkjaya/code-learn'

export function ApiKeySetup() {
  const {
    apiKey,
    provider,
    selectedModel,
    apiStorageMode,
    setApiConfig,
    setSelectedModel,
    clearApiKey,
  } = useAppStore()
  const [draftKey, setDraftKey] = useState(apiKey)
  const [draftModel, setDraftModel] = useState(selectedModel)
  const [storageMode, setStorageMode] = useState<ApiStorageMode>(apiStorageMode)
  const [models, setModels] = useState<string[]>(provider === 'gemini' ? GEMINI_MODELS : [])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [modelError, setModelError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isKeyVisible, setIsKeyVisible] = useState(false)
  const requestIdRef = useRef(0)

  const detectedProvider = useMemo(() => detectProvider(draftKey), [draftKey])
  const canSave = Boolean(draftKey.trim() && detectedProvider && draftModel)

  useEffect(() => {
    if (apiKey !== draftKey) {
      setDraftKey(apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    setStorageMode(apiStorageMode)
  }, [apiStorageMode])

  useEffect(() => {
    if (selectedModel !== draftModel) {
      setDraftModel(selectedModel)
    }
  }, [selectedModel])

  useEffect(() => {
    setSaveMessage('')
    setModelError('')

    if (detectedProvider === 'gemini') {
      setModels(GEMINI_MODELS)
      setDraftModel((current) => (GEMINI_MODELS.includes(current) ? current : GEMINI_MODELS[0]))
      setIsLoadingModels(false)
      return
    }

    if (detectedProvider !== 'groq') {
      setModels([])
      setDraftModel('')
      setIsLoadingModels(false)
      return
    }

    const trimmedKey = draftKey.trim()
    if (trimmedKey.length < 10) {
      setModels([])
      setDraftModel('')
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoadingModels(true)

    const timeout = window.setTimeout(() => {
      fetchGroqModels(trimmedKey)
        .then((modelList) => {
          if (requestIdRef.current !== requestId) {
            return
          }

          setModels(modelList)
          setDraftModel((current) =>
            current && modelList.includes(current) ? current : modelList[0] ?? '',
          )
        })
        .catch((error: unknown) => {
          if (requestIdRef.current !== requestId) {
            return
          }

          setModels([])
          setDraftModel('')
          setModelError(error instanceof Error ? error.message : 'Unable to load Groq models.')
        })
        .finally(() => {
          if (requestIdRef.current === requestId) {
            setIsLoadingModels(false)
          }
        })
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [detectedProvider, draftKey])

  function handleSave() {
    if (!detectedProvider || !draftModel) {
      return
    }

    setApiConfig({
      apiKey: draftKey.trim(),
      provider: detectedProvider,
      selectedModel: draftModel,
      storageMode,
    })
    setSaveMessage(`${providerLabel(detectedProvider)} model saved.`)
  }

  function handleClear() {
    clearApiKey()
    setDraftKey('')
    setDraftModel('')
    setModels([])
    setSaveMessage('API key cleared from this browser.')
    setModelError('')
  }

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
                Browser-only LLM setup
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">CodeLearn</h1>
            </div>
            <a
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href={REPO_URL}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Audit the source code
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              API key
              <span className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-12 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => setDraftKey(event.target.value)}
                  placeholder="gsk_... or AIza..."
                  type={isKeyVisible ? 'text' : 'password'}
                  value={draftKey}
                />
                <button
                  aria-label={isKeyVisible ? 'Hide API key' : 'Show API key'}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setIsKeyVisible((current) => !current)}
                  title={isKeyVisible ? 'Hide API key' : 'Show API key'}
                  type="button"
                >
                  {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Provider
              <span className="flex h-11 items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-800">
                {providerLabel(detectedProvider)}
              </span>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Model
              <span className="relative">
                <select
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={!detectedProvider || isLoadingModels || models.length === 0}
                  onChange={(event) => {
                    setDraftModel(event.target.value)
                    if (apiKey && event.target.value) {
                      setSelectedModel(event.target.value)
                    }
                  }}
                  value={draftModel}
                >
                  {models.length === 0 ? (
                    <option value="">No models loaded</option>
                  ) : (
                    models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  )}
                </select>
                {isLoadingModels ? (
                  <Loader2
                    className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-700"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </label>

            <label className="flex h-11 items-center gap-3 self-end rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
              <input
                checked={storageMode === 'session'}
                className="h-4 w-4 accent-teal-700"
                onChange={(event) => setStorageMode(event.target.checked ? 'session' : 'local')}
                type="checkbox"
              />
              Save to session only
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canSave}
              onClick={handleSave}
              type="button"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Save API key
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              onClick={handleClear}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear API Key
            </button>
            {saveMessage ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {saveMessage}
              </span>
            ) : null}
            {modelError ? <span className="text-sm font-medium text-rose-700">{modelError}</span> : null}
          </div>
        </div>

        <aside className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          <p className="font-semibold">Your API key never leaves your browser.</p>
          <p className="mt-2 leading-6">
            All requests go directly from this page to Groq or Gemini. CodeLearn has no backend,
            database, proxy, or server-side key handling.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-normal text-teal-700">
            Active: {provider ? `${providerLabel(provider)} / ${selectedModel}` : 'No saved key'}
          </p>
        </aside>
      </div>
    </section>
  )
}
