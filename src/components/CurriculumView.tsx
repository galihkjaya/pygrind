import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { CurriculumPath } from '../lib/curriculum'
import { getCurrentProblem, isTierComplete } from '../lib/progress'
import { useAppStore } from '../store/appStore'

export function CurriculumView() {
  const navigate = useNavigate()
  const { curriculum, progress } = useAppStore()

  if (!curriculum) {
    return (
      <section className="flex flex-col items-center justify-center py-20">
        <h2 className="font-playfair text-2xl font-bold">No Curriculum Generated</h2>
        <p className="mt-2 font-mono-dm text-sm text-ink-light">
          Please configure your learning brief first.
        </p>
        <Link
          className="btn-primary mt-8 px-6 py-3 font-mono-dm text-sm uppercase tracking-widest"
          to="/brief"
        >
          Configure Brief
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl py-12">
      <div className="mb-12 px-4 sm:px-6 lg:px-8">
        <h1 className="font-playfair text-4xl font-bold uppercase tracking-widest">
          Curriculum
        </h1>
        <p className="mt-2 font-mono-dm text-sm text-ink-light">
          {curriculum.paths.length} modules to master.
        </p>
      </div>

      <div className="flex flex-col border-t border-ink-light/20">
        {curriculum.paths.map((path, index) => (
          <PathRow
            key={path.id}
            index={index + 1}
            path={path}
            onOpen={() => {
              const currentProblem = getCurrentProblem(path, progress)
              navigate(`/practice/${path.id}`)
            }}
          />
        ))}
      </div>

      <div className="mt-16 flex justify-center px-4">
        <Link
          to="/brief"
          className="group inline-flex items-center gap-3 border border-ink px-8 py-4 font-mono-dm text-sm uppercase tracking-widest transition-all duration-300 hover:bg-ink hover:text-paper"
        >
          <span>Re-generate Curriculum</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}

type PathRowProps = {
  path: CurriculumPath
  index: number
  onOpen: () => void
}

function PathRow({ path, index, onOpen }: PathRowProps) {
  const progress = useAppStore((state) => state.progress)
  const completedCount = path.problems.filter((problem) =>
    isTierComplete(progress, path.id, problem.tier),
  ).length
  const totalCount = path.problems.length
  const tag = path.topics[0] || 'General'
  const indexStr = index.toString().padStart(2, '0')
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const isComplete = completedCount === totalCount && totalCount > 0

  return (
    <button
      className="group relative z-10 flex w-full cursor-pointer items-center justify-between border-b border-ink-light/20 px-4 py-8 text-left transition-colors duration-500 hover:text-paper sm:px-6 lg:px-8"
      onClick={onOpen}
      type="button"
    >
      <div className="absolute inset-0 z-[-1] origin-bottom scale-y-0 bg-ink transition-transform duration-500 ease-in-out-custom group-hover:scale-y-100" />
      
      <div className="flex flex-1 items-center gap-6 sm:gap-12">
        <span className="font-mono-dm text-lg font-light text-ink-light transition-colors duration-500 group-hover:text-paper/50">
          {indexStr}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-playfair text-2xl font-bold sm:text-3xl">{path.title}</h3>
          <span className="font-mono-dm text-xs uppercase tracking-wider text-ink-light transition-colors duration-500 group-hover:text-paper/70">
            {tag}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:gap-12">
        <div className="hidden flex-col items-end gap-2 sm:flex">
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="font-mono-dm text-xs uppercase tracking-wider text-green-600 transition-colors duration-500 group-hover:text-green-400">
                ✓
              </span>
            )}
            <span className="font-mono-dm text-sm tracking-wide">
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className="h-1 w-24 overflow-hidden bg-ink-light/20 transition-colors duration-500 group-hover:bg-paper/20">
            <div
              className="h-full bg-accent transition-all duration-700 ease-in-out-custom"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono-dm text-[0.6rem] uppercase text-ink-light transition-colors duration-500 group-hover:text-paper/50">
            Tiers Completed
          </span>
        </div>
        <ArrowRight className="h-6 w-6 transition-transform duration-500 group-hover:translate-x-2" />
      </div>
    </button>
  )
}

