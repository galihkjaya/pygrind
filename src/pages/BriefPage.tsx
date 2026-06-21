import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { callLLM } from '../lib/llm'
import { parseCurriculumResponse } from '../lib/curriculum'
import { useAppStore } from '../store/appStore'

type Level = 'beginner' | 'intermediate' | 'advanced'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const GOALS = ['Python', 'SQL', 'FastAPI', 'Docker', 'Git', 'Bash', 'ML/AI']

const handbookModules = import.meta.glob('../../handbook/*.html')
const AVAILABLE_HANDBOOKS = Object.keys(handbookModules).map((path) => path.split('/').pop() || '')

export function BriefPage() {
  const navigate = useNavigate()
  const { apiKey, provider, selectedModel, setCurriculum } = useAppStore()
  const [level, setLevel] = useState<Level>('intermediate')
  const [goals, setGoals] = useState<string[]>(['Python', 'ML/AI'])
  const [hoursPerWeek, setHoursPerWeek] = useState(6)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const canGenerate = Boolean(apiKey && provider && selectedModel && goals.length > 0 && hoursPerWeek > 0)
  const selectedGoalsLabel = useMemo(() => goals.join(', '), [goals])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!provider || !selectedModel || !apiKey) {
      setError('Missing API key. Please go back to setup.')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await callLLM({
        apiKey,
        provider,
        model: selectedModel,
        temperature: 0.8, // high temperature for creative tasks
        systemPrompt: buildCurriculumSystemPrompt(),
        userMessage: [
          `Current level: ${level}`,
          `Goals: ${selectedGoalsLabel}`,
          `Time available: ${hoursPerWeek} hours per week`,
          'Audience: AI/ML and backend engineers who want hands-on coding practice.',
        ].join('\n'),
      })
      const curriculum = parseCurriculumResponse(response.text)

      setCurriculum(curriculum)
      navigate('/learn')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The curriculum could not be generated. Try again with a different model.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function toggleGoal(goal: string) {
    setGoals((currentGoals) =>
      currentGoals.includes(goal)
        ? currentGoals.filter((currentGoal) => currentGoal !== goal)
        : [...currentGoals, goal],
    )
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <div className="flex w-full flex-col lg:flex-row">
        {/* Left Form Panel */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-24">
          <div className="w-full max-w-md">
            <h1 className="mb-2 font-playfair text-3xl font-bold">Learning Brief</h1>
            <p className="mb-10 font-mono-dm text-sm text-ink-light">Configure your training parameters.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              {/* Level Toggle Group */}
              <div className="flex flex-col gap-3">
                <label className="font-mono-dm text-xs uppercase tracking-wider text-ink-light">Current Level</label>
                <div className="flex gap-2">
                  {LEVELS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLevel(option)}
                      className={`flex-1 py-2 font-mono-dm text-sm capitalize transition-colors ${
                        level === option
                          ? 'bg-ink text-paper'
                          : 'bg-transparent text-ink border border-ink-light/30 hover:border-ink'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals Multi-select Pill Grid */}
              <div className="flex flex-col gap-3">
                <label className="font-mono-dm text-xs uppercase tracking-wider text-ink-light">Goals</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`rounded-full px-4 py-1.5 font-mono-dm text-sm transition-colors ${
                        goals.includes(goal)
                          ? 'bg-accent text-paper border-accent'
                          : 'bg-transparent text-ink border border-ink-light/30 hover:border-ink'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per week Borderless Number Input */}
              <div className="flex flex-col gap-2">
                <label className="font-mono-dm text-xs uppercase tracking-wider text-ink-light">Time per week</label>
                <div className="flex items-baseline gap-2 border-b border-ink-light py-2 focus-within:border-accent transition-colors">
                  <input
                    className="w-16 bg-transparent font-mono-dm text-xl outline-none"
                    max={40}
                    min={1}
                    onChange={(event) => setHoursPerWeek(Number(event.target.value))}
                    type="number"
                    value={hoursPerWeek}
                  />
                  <span className="font-mono-dm text-sm text-ink-light">hours</span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={!canGenerate || isGenerating}
                  className="btn-primary w-full py-4 font-mono-dm text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isGenerating ? 'Generating...' : 'Generate Curriculum'}
                </button>
                {error && <p className="text-center font-mono-dm text-xs text-accent">{error}</p>}
              </div>
            </form>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="hidden flex-1 flex-col justify-center items-center border-l border-ink-light/20 px-8 py-12 lg:flex lg:px-24">
          <blockquote className="max-w-md text-center">
            <p className="font-playfair text-4xl italic leading-tight text-ink">
              "The best engineers didn't study. They drilled."
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

function buildCurriculumSystemPrompt() {
  const fileList = AVAILABLE_HANDBOOKS.join(', ')
  return `You are an expert curriculum designer for PyGrind, a browser-only coding learning platform for AI/ML and backend engineers.

Return ONLY a valid JSON object. Do not include a preamble. Do not include markdown fences.

The JSON must match this exact schema:
{
  "paths": [
    {
      "id": "unique-path-id",
      "title": "Path Title",
      "handbookPage": "exact-filename.html",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "problems": [
        { "tier": 1, "title": "...", "prompt": "..." },
        { "tier": 2, "title": "...", "prompt": "..." },
        { "tier": 3, "title": "...", "prompt": "..." }
      ]
    }
  ]
}

CRITICAL RULES FOR DYNAMIC GENERATION:
1. NO HARDCODED REPETITION: You MUST NOT return the same generic examples every time. You MUST dynamically select topics that perfectly match the user's chosen "Goals" and "Current level".
2. PATHS COUNT: Create exactly 5 to 7 paths based on the learner brief.
3. PROBLEMS: Every path must have exactly three problems, with tiers 1, 2, and 3. Tier 1 is warm-up, Tier 2 is applied, Tier 3 is complex.
4. HANDBOOK SELECTION: You MUST pick a "handbookPage" that exists from this exact list of available files:
[ ${fileList} ]
Do not invent filenames that are not in this list. Match the handbook page to the path's topic.
5. PROBLEM PROMPTS: Must be extremely specific, hands-on, and solvable in a code editor. Do not write generic questions, write actual programming assignments.`
}
