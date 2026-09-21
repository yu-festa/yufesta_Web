export type LostPostKind = 'lost' | 'found'

export type LostPhoto = {
  id: string
  src: string
}

export type LostPostDraft = {
  kind: LostPostKind
  title: string
  location: string
  content: string
  photos: LostPhoto[]
}

export type LostPost = LostPostDraft & {
  id: string
  createdAt: number
}

export type LostComment = {
  id: string
  postId: string
  content: string
  createdAt: number
}

export const MAX_LOST_COMMENT_LENGTH = 500

export function validateLostComment(content: string): string | null {
  if (!content.trim()) return '댓글을 입력해 주세요.'
  if (content.trim().length > MAX_LOST_COMMENT_LENGTH) return '댓글은 500자 이내로 입력해 주세요.'
  return null
}

export const lostPostLabels = { lost: '찾고 있어요', found: '주웠어요' } as const
export const MAX_LOST_PHOTOS = 5

export function validateLostPost(draft: LostPostDraft): string | null {
  if (draft.kind !== 'lost' && draft.kind !== 'found') return '게시글 종류를 선택해 주세요.'
  if (!draft.title.trim()) return '제목을 입력해 주세요.'
  if (draft.title.trim().length > 80) return '제목은 80자 이내로 입력해 주세요.'
  if (!draft.location.trim()) return '장소를 입력해 주세요.'
  if (draft.location.trim().length > 100) return '장소는 100자 이내로 입력해 주세요.'
  if (!draft.content.trim()) return '내용을 입력해 주세요.'
  if (draft.content.trim().length > 3000) return '내용은 3,000자 이내로 입력해 주세요.'
  if (draft.photos.length > MAX_LOST_PHOTOS) return '사진은 최대 5장까지 첨부할 수 있어요.'
  return null
}

export function filterLostPosts(posts: LostPost[], filter: LostPostKind | 'all', query: string) {
  const search = query.trim().toLocaleLowerCase('ko-KR')
  return posts.filter(post => (filter === 'all' || post.kind === filter)
    && (!search || `${post.title} ${post.location} ${post.content}`.toLocaleLowerCase('ko-KR').includes(search)))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function formatLostPostTime(createdAt: number, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000))
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`
  const date = new Date(createdAt)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
