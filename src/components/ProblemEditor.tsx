import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Trophy } from 'lucide-react'
import { callLLM } from '../lib/llm'
import { getCurrentProblem, isTierComplete, isUnlocked } from '../lib/progress'
import { useAppStore } from '../store/appStore'

const REVIEW_SYSTEM_PROMPT =
  "You are a code reviewer for a learning platform. Be direct. Point out what's wrong first, then what's right. End your response with exactly PASS or NEEDS_WORK on the last line."

export function ProblemEditor() {
  const navigate = useNavigate()
  const { pathId } = useParams()
  const { apiKey, provider, selectedModel, curriculum, progress, completeTier } = useAppStore()
  
  const path = useMemo(
    () => curriculum?.paths.find((candidate) => candidate.id === pathId),
    [curriculum, pathId],
  )
  
  const currentProblem = path ? getCurrentProblem(path, progress) : null
  const problem = currentProblem
  const tierNumber = problem?.tier || 1
  const totalTiers = path?.problems.length ?? 0
  
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [passedTier, setPassedTier] = useState(false)

  const language = path?.id.startsWith('sql') ? 'sql' : 'python'
  const unlocked = path && problem ? isUnlocked(progress, path.id, problem.tier) : false
  const complete = path && problem ? isTierComplete(progress, path.id, problem.tier) : false
  const canSubmit = Boolean(apiKey && provider && selectedModel && problem && unlocked && code.trim())
  
  const nextProblem = useMemo(() => {
    if (!path || !problem) return null
    const sortedProblems = [...path.problems].sort((a, b) => a.tier - b.tier)
    return sortedProblems.find((candidate) => candidate.tier > problem.tier) ?? null
  }, [path, problem])

  useEffect(() => {
    setFeedback('')
    setError('')
    setPassedTier(false)
    setCode(getStarterCode(language))
  }, [language, pathId, tierNumber])

  if (!curriculum || !path || !problem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="font-playfair text-2xl font-bold">Problem not found</h2>
        <Link className="btn-primary mt-8 px-6 py-3 font-mono-dm text-sm uppercase tracking-widest" to="/learn">
          Back to Paths
        </Link>
      </div>
    )
  }

  async function handleSubmit() {
    if (!provider || !apiKey || !selectedModel || !problem || !path) {
      setError('Save an API key and model before submitting code.')
      return
    }

    setIsReviewing(true)
    setFeedback('')
    setError('')
    setPassedTier(false)

    try {
      const response = await callLLM({
        apiKey,
        provider,
        model: selectedModel,
        systemPrompt: REVIEW_SYSTEM_PROMPT,
        userMessage: `Problem: ${problem.prompt}\nTier: ${problem.tier}\nCode:\n${code}`,
      })
      const review = response.text.trim()

      setFeedback(review)

      if (review.endsWith('PASS')) {
        setPassedTier(true)
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The review could not be completed. Try again.',
      )
    } finally {
      setIsReviewing(false)
    }
  }
  
  const isPass = feedback.endsWith('PASS')

  return (
    <div className="flex h-auto min-h-0 w-full flex-col lg:h-[calc(100vh-57px)] lg:flex-row border-t border-ink-light/20">
      {/* Left Panel: Editor & Prompt */}
      <div className="flex w-full flex-col overflow-y-auto lg:w-2/3">
        <div className="flex flex-col gap-6 px-6 py-8">
          <div className="flex items-center justify-between">
            <Link
              className="inline-flex items-center gap-2 font-mono-dm text-xs uppercase tracking-widest text-ink-light transition-colors hover:text-ink"
              to="/learn"
            >
              <ArrowLeft className="h-4 w-4" />
              Paths
            </Link>
            <span className="font-mono-dm text-xs uppercase tracking-widest text-ink-light">
              {language} / Tier {tierNumber} of {totalTiers}
            </span>
          </div>

          <div>
            <span className="font-mono-dm text-sm uppercase tracking-widest text-ink-light">{path.title}</span>
            <h1 className="mt-2 font-playfair text-3xl font-bold">{problem.title}</h1>
            <p className="mt-4 whitespace-pre-line font-sans text-sm leading-relaxed text-ink/80">
              {problem.prompt}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col border-y border-ink-light/20 bg-ink">
          <div className="flex items-center justify-between border-b border-ink-light/20 px-4 py-2">
            <span className="font-mono-dm text-xs uppercase tracking-widest text-paper/70">Workspace</span>
            <span className="font-mono-dm text-xs text-paper/50">{selectedModel || 'No model'}</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              onChange={(value) => setCode(value ?? '')}
              options={{
                fontSize: 14,
                fontFamily: '"DM Mono", monospace',
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
              theme="vs-dark"
              value={code}
            />
          </div>
        </div>
      </div>

      {/* Right Panel: AI Review */}
      <div className="flex w-full flex-col border-l border-ink-light/20 bg-paper lg:w-1/3 lg:h-full overflow-y-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <span className="font-playfair text-xl font-bold">AI Review</span>
          <Link
            to={`/handbook/${path.handbookPage}`}
            target="_blank"
            className="btn-primary px-4 py-2"
          >
            Handbook →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <button
            className="btn-primary w-full py-4 font-mono-dm text-sm uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 flex justify-center items-center gap-2"
            disabled={!canSubmit || isReviewing}
            onClick={handleSubmit}
            type="button"
          >
            {isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isReviewing ? 'Reviewing...' : complete ? 'Review Again' : 'Submit Code'}
          </button>
          
          {!apiKey || !provider || !selectedModel ? (
            <p className="text-center font-mono-dm text-xs text-accent">Save an API key and model first.</p>
          ) : null}

          {error ? (
            <div className="mt-2 font-mono-dm text-sm text-accent">
              {error}
            </div>
          ) : null}

          {feedback ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-ink-light/20 pt-4">
              <span className="font-mono-dm text-xs uppercase tracking-widest text-ink-light">AI Feedback</span>
              <div 
                className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/80"
                dangerouslySetInnerHTML={{ __html: formatFeedback(feedback) }}
              />
              <div className={`mt-2 font-mono-dm text-sm font-bold uppercase tracking-widest ${isPass ? 'text-green-600' : 'text-accent'}`}>
                {isPass ? 'PASS' : 'NEEDS_WORK'}
              </div>
            </div>
          ) : null}

          {passedTier && nextProblem && (
            <div className="mt-4 flex flex-col gap-4 border-t border-ink-light/20 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-mono-dm text-sm text-green-600">Tier complete. Ready for the next challenge.</p>
              </div>
              <button
                className="btn-primary w-full py-4 font-mono-dm text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                onClick={() => {
                  completeTier(path.id, problem.tier)
                  setPassedTier(false)
                  setFeedback('')
                  setCode(getStarterCode(language))
                }}
                type="button"
              >
                Continue to Tier {nextProblem.tier}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {passedTier && !nextProblem && (
            <div className="mt-4 flex flex-col items-center gap-4 border-t border-ink-light/20 pt-6">
              <Trophy className="h-10 w-10 text-accent" />
              <h3 className="font-playfair text-xl font-bold text-center">Path Complete!</h3>
              <p className="font-mono-dm text-sm text-ink-light text-center">
                You've conquered all {totalTiers} tiers in this path. Time to tackle the next one.
              </p>
              <button
                className="btn-primary w-full py-4 font-mono-dm text-sm uppercase tracking-widest flex justify-center items-center gap-2"
                onClick={() => {
                  completeTier(path.id, problem.tier)
                  navigate('/learn')
                }}
                type="button"
              >
                Back to Curriculum
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStarterCode(language: 'python' | 'sql') {
  if (language === 'sql') {
    return '-- Write your SQL solution here\n'
  }
  return '# Write your Python solution here\n'
}

function formatFeedback(text: string) {
  // Escape HTML entities first to prevent XSS from LLM output
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 1. Code blocks: ```python ... ``` (must be before inline code)
  html = html.replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre class="bg-ink p-3 my-2 rounded text-paper text-xs overflow-x-auto font-mono-dm"><code>$1</code></pre>')

  // 2. Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-ink">$1</strong>')
  
  // 3. Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code class="bg-ink-light/20 text-accent px-1.5 py-0.5 rounded font-mono-dm text-xs">$1</code>')
  
  // 4. Strip the trailing PASS/NEEDS_WORK since it's displayed in the badge
  html = html.replace(/\s*(PASS|NEEDS_WORK)\s*$/, '').trim()

  return html
}
