import type { AgeBand, MatchApplication, MatchApplicationUpdate, MatchApplicationRequest, MatchSummary, MatchTagOption } from '../api/match.ts'
import type { InstatingApplication } from './instating.ts'

export const MATCH_TERMS_VERSION = '2026-09-01'
export const MATCH_PRIVACY_VERSION = '2026-09-01'

export function parseMatchTime(value: string) {
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}+09:00`)
}

export function isMatchOpen(summary: MatchSummary | null, receivedAt: number, now = Date.now()) {
  if (!summary || summary.currentRound.status !== 'OPEN') return false
  const serverNow = parseMatchTime(summary.serverNow) + Math.max(0, now - receivedAt)
  return serverNow >= parseMatchTime(summary.currentRound.openAt) && serverNow < parseMatchTime(summary.currentRound.closeAt)
}

const ageBands: Record<string, AgeBand> = { '19 - 21세': '19-21', '22 - 24세': '22-24', '25 - 27세': '25-27', '28세 이상': '28+' }

export function toMatchApplicationUpdate(application: InstatingApplication, options: MatchTagOption[]): MatchApplicationUpdate {
  const nickname = application.nickname.trim()
  const instagramId = application.instagram.trim().replace(/^@/, '').toLowerCase()
  if (nickname.length < 2 || nickname.length > 8) throw new Error('닉네임을 2~8자로 입력해 주세요.')
  if (!/^[a-z0-9._]{1,30}$/.test(instagramId)) throw new Error('올바른 인스타그램 아이디를 입력해 주세요.')
  if (application.gender !== '남' && application.gender !== '여') throw new Error('성별을 선택해 주세요.')
  const ageBand = ageBands[application.age]
  if (application.age && !ageBand) throw new Error('나이대를 다시 선택해 주세요.')
  const tags = application.tags.map(code => options.find(option => option.code === code)?.code)
  if (tags.length > 3 || tags.some(tag => !tag) || new Set(tags).size !== tags.length) throw new Error('관심 태그는 중복 없이 최대 3개까지 선택해 주세요.')
  if (application.introduction.trim().length > 40) throw new Error('한 줄 소개를 40자 이내로 입력해 주세요.')
  return {
    nickname, instagramId, gender: application.gender === '남' ? 'M' : 'F', ageBand: ageBand ?? null,
    tags: tags as MatchApplicationRequest['tags'], intro: application.introduction.trim() || null,
  }
}

export function toMatchApplicationRequest(application: InstatingApplication, options: MatchTagOption[], consents: boolean[]): MatchApplicationRequest {
  if (consents.length !== 3 || !consents.every(Boolean)) throw new Error('필수 항목에 모두 동의해 주세요.')
  return { ...toMatchApplicationUpdate(application, options), termsVersion: MATCH_TERMS_VERSION, privacyVersion: MATCH_PRIVACY_VERSION, ageConfirmed: true }
}

export function applicationToForm(application: MatchApplication): InstatingApplication {
  return { nickname: application.nickname, instagram: application.instagramId, gender: application.gender === 'M' ? '남' : '여', age: Object.entries(ageBands).find(([, value]) => value === application.ageBand)?.[0] ?? '', tags: application.tags, introduction: application.intro ?? '', performance: '', multipleMatches: false }
}
