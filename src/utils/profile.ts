import { readApplications } from './instating.ts'
import type { MatchResult, SavedApplication } from './instating.ts'

export type InstatingParticipation = {
  id: string
  festival: string
  round: string
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
