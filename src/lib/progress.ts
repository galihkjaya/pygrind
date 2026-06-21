import type { CurriculumPath, ProblemTier } from './curriculum'

export type ProgressMap = Record<string, ProblemTier[]>

const PROGRESS_STORAGE_KEY = 'pygrind.progress'

export function readProgress(): ProgressMap {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function writeProgress(progress: ProgressMap): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

export function clearProgress(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
}

export function markTierComplete(
  progress: ProgressMap,
  pathId: string,
  tier: ProblemTier,
): ProgressMap {
  const completed = new Set(progress[pathId] ?? [])
  completed.add(tier)

  return {
    ...progress,
    [pathId]: Array.from(completed).sort((a, b) => a - b),
  }
}

export function isTierComplete(progress: ProgressMap, pathId: string, tier: ProblemTier): boolean {
  return progress[pathId]?.includes(tier) ?? false
}

export function isUnlocked(progress: ProgressMap, pathId: string, tier: ProblemTier): boolean {
  return tier === 1 || isTierComplete(progress, pathId, (tier - 1) as ProblemTier)
}

export function getCurrentProblem(path: CurriculumPath, progress: ProgressMap) {
  const sortedProblems = [...path.problems].sort((a, b) => a.tier - b.tier)
  const nextProblem = sortedProblems.find(
    (problem) =>
      isUnlocked(progress, path.id, problem.tier) &&
      !isTierComplete(progress, path.id, problem.tier),
  )

  return nextProblem ?? sortedProblems[sortedProblems.length - 1]
}

function normalizeProgress(value: unknown): ProgressMap {
  if (typeof value !== 'object' || value === null) {
    return {}
  }

  return Object.entries(value).reduce<ProgressMap>((acc, [pathId, tiers]) => {
    if (!Array.isArray(tiers)) {
      return acc
    }

    const normalized = tiers
      .map(Number)
      .filter((tier): tier is ProblemTier => Number.isInteger(tier) && tier >= 1)

    if (normalized.length > 0) {
      acc[pathId] = Array.from(new Set(normalized)).sort((a, b) => a - b)
    }

    return acc
  }, {})
}
