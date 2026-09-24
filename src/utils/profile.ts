import { readApplications } from './instating.ts'
import type { MatchResult, SavedApplication } from './instating.ts'
import type { MatchApplication, MatchSummary, MatchTag } from '../api/match.ts'

export type InstatingParticipation = {
  id: string
  festival: string
  round: string
  roundSeq?: number
  published?: boolean
  resultOnly?: boolean
  nickname: string
  interests: string[]
  instagram?: string
  result?: MatchResult
  isDemo?: boolean
}

export type ProfileUser = {
  id: string
  name: string
  instagram: string
  participations: InstatingParticipation[]
}

export type ProfileAccess =
  | { page: 'login'; user: null; isPreview: false }
  | { page: 'profile'; user: ProfileUser; isPreview: boolean }

const previewUser: ProfileUser = {
  id: 'preview-user',
  name: '가을축제',
  instagram: 'festa_demo_01',
  participations: [{
    id: 'preview-instating-1', festival: '2026 영남대학교 가을축제', round: '체험', nickname: '가을축제', interests: ['공연', '음악', '카페'], isDemo: true,
    result: { status: 'matched', partners: [{ nickname: '축제친구', instagram: 'festa_friend_demo' }] },
  }],
}

// Replace this adapter with the authenticated session when the login API is connected.
// Preview data must never be used as an authentication credential.
export function getCurrentProfileUser(): ProfileUser | null {
  return null
}

const tagLabels: Record<MatchTag, string> = {
  ALCOHOL: '술', PERFORMANCE: '공연', SPORTS: '운동', GAME: '게임', CAFE: '카페',
  MOVIE: '영화', MUSIC: '음악', PHOTO: '사진', PET: '반려동물', ETC: '기타',
}

export function profileFromApplication(application: MatchApplication | null, summary?: MatchSummary | null): ProfileUser {
  const profile: ProfileUser = application ? {
    id: 'authenticated-user',
    name: application.nickname,
    instagram: application.instagramId,
    participations: [{
      id: String(application.id),
      festival: '2026 영남대학교 가을축제',
      round: `${application.roundSeq}차`,
      roundSeq: application.roundSeq,
      published: summary?.my?.lastResult?.roundSeq === application.roundSeq || (summary?.currentRound.seq === application.roundSeq && summary.currentRound.status === 'PUBLISHED'),
      nickname: application.nickname,
      instagram: application.instagramId,
      interests: application.tags.map(tag => tagLabels[tag]),
      // 카드의 상대 정보는 결과 화면에서 따로 조회합니다.
      result: { status: 'pending' },
    }],
  } : { id: 'authenticated-user', name: 'YU FESTA', instagram: '', participations: [] }
  const lastResult = summary?.my?.lastResult
  if (lastResult && !profile.participations.some(item => item.roundSeq === lastResult.roundSeq)) {
    profile.participations.push({
      id: `result-round-${lastResult.roundSeq}`, festival: '2026 영남대학교 가을축제',
      round: `${lastResult.roundSeq}차`, roundSeq: lastResult.roundSeq, nickname: '', interests: [],
      published: true, resultOnly: true,
    })
  }
  return profile
}

export function resolveProfileAccess(user: ProfileUser | null, previewEnabled: boolean, applications: SavedApplication[] = readApplications()): ProfileAccess {
  if (user) return { page: 'profile', user, isPreview: false }
  if (previewEnabled) return { page: 'profile', user: {
    ...previewUser,
    name: applications[0]?.nickname ?? previewUser.name,
    instagram: applications[0]?.instagram ?? previewUser.instagram,
    participations: [...applications.map(application => ({
      id: application.id, festival: '2026 영남대학교 가을축제', round: '1차', nickname: application.nickname,
      instagram: application.instagram, interests: application.tags, result: { status: 'pending' as const },
    })), ...previewUser.participations],
  }, isPreview: true }
  return { page: 'login', user: null, isPreview: false }
}
