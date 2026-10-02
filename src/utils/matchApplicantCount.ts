import type { MatchSummary } from '../api/match.ts'

export function roundApplicantCount(summary?: MatchSummary | null): number | null {
  if (!summary) return null
  const count = summary.applicantCount
  return typeof count === 'number' && Number.isSafeInteger(count) && count >= 0 ? count : null
}
