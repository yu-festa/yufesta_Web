import { useEffect, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import LostFoundIcon from '../components/LostFoundIcon'
import LostPostForm from '../components/LostPostForm'
import LostPostDetail from './LostPostDetail'
import { filterLostPosts, formatLostPostTime, lostPostLabels } from '../utils/lostFound'
import type { LostPost, LostPostKind } from '../utils/lostFound'
import { loadLostPosts } from '../utils/lostFoundStorage'

type LostFoundProps = {
  isWriting: boolean
  onBack: () => void
  onHome: () => void
  onWrite: () => void
  onBackToList: () => void
  postId: string | null
  onOpenPost: (id: string) => void
}

export default function LostFound({ isWriting, onBack, onHome, onWrite, onBackToList, postId, onOpenPost }: LostFoundProps) {
  const [posts, setPosts] = useState<LostPost[]>([])
  const [filter, setFilter] = useState<LostPostKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const saved = await loadLostPosts()
        if (active) { setPosts(saved); setError('') }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : '게시글을 불러오지 못했어요.')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (!isWriting) {
      void refresh()
      window.addEventListener('focus', refresh)
    }
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [isWriting, reloadKey])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!notice || isWriting) return
    const timer = setTimeout(() => setNotice(''), 1000)
    return () => clearTimeout(timer)
  }, [notice, isWriting])

  function registered(post: LostPost) {
    setPosts(current => [post, ...current.filter(item => item.id !== post.id)])
    setQuery('')
    setFilter('all')
    setNotice('게시글이 등록되었어요.')
    setNow(Date.now())
    onBackToList()
  }

  const visiblePosts = filterLostPosts(posts, filter, query)

  if (postId !== null) return <LostPostDetail key={postId} postId={postId} onBack={onBackToList} onHome={onHome} />

  return (
    <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
      <div className={"text-[#222] [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-[0.55] [&_:is(button,_input,_textarea):focus-visible]:[outline:2px_solid_#1554ff] [&_:is(button,_input,_textarea):focus-visible]:outline-offset-[3px] [&_textarea.lost-found-field]:min-h-[160px] lost-found"}>
        <div className="relative flex min-h-12 items-center justify-center">
          <button type="button" className="absolute -left-2 grid size-11 place-items-center rounded-full" onClick={isWriting ? onBackToList : onBack} aria-label={isWriting ? '분실물 게시판으로 돌아가기' : '메인으로 돌아가기'}><LostFoundIcon name="back" className="size-5" /></button>
          <h1 className="text-base font-semibold">{isWriting ? '분실물 글쓰기' : '분실물 게시판'}</h1>
        </div>
        {isWriting ? <LostPostForm onRegistered={registered} /> : <section className="pb-24" aria-labelledby="lost-intro">
          <h2 id="lost-intro" className="mt-4 text-[24px] leading-snug font-bold tracking-[-0.9px]">잃어버린 물건, 함께 찾아요</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#999]">주인 없는 물건을 발견했다면, 게시판에 올려주세요</p>
          <div className="relative mt-6">
            <LostFoundIcon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-[#aaa]" />
            <input type="search" className={"block w-full min-h-[42px] [border:1px_solid_#dedede] rounded-[8px] [padding:10px_13px] bg-white text-[14px] leading-[1.5] [&::placeholder]:text-[#aaa] lost-found-field pl-10!"} aria-label="분실물 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="물건 이름이나 장소를 검색해보세요" />
          </div>
          <nav className="mt-2.5 flex flex-wrap gap-3" aria-label="분실물 카테고리">
            {(['all', 'lost', 'found'] as const).map(value => <button key={value} type="button" className={`min-h-[32px] border rounded-[7px] [padding:5px_15px] text-[12px] font-semibold lost-found-filter ${filter === value ? value === 'lost' ? 'border-[#0D2B74] bg-[#0D2B74] text-white' : 'border-[#1554ff] bg-[#1554ff] text-white' : 'border-[#ddd] bg-white'}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? '전체' : lostPostLabels[value]}</button>)}
          </nav>
          {notice && <p className="mt-4 rounded-lg bg-[#edf3ff] px-3 py-2 text-sm text-[#1554ff]" role="status">{notice}</p>}
          <div className="mt-7 flex items-baseline gap-2 text-base font-bold"><h3>{query.trim() ? '검색 결과' : filter === 'all' ? '전체' : lostPostLabels[filter]}</h3><span className="text-[#1554ff]">{visiblePosts.length}</span></div>
          {loading ? <p className="py-16 text-center text-sm text-[#888]" role="status">게시글을 불러오고 있어요…</p> : error ? <div className="py-10 text-center" role="alert"><p className="text-sm text-red-700">{error}</p><button className="mt-3 rounded-lg bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1554ff]" onClick={() => setReloadKey(value => value + 1)}>다시 불러오기</button></div> : visiblePosts.length ? <ul className="mt-1" aria-label="분실물 게시글">
            {visiblePosts.map(post => <li key={post.id} className="border-b border-[#e5e5e5]">
              <button type="button" className="flex w-full items-center gap-4 py-4 text-left" onClick={() => onOpenPost(post.id)} aria-label={`${lostPostLabels[post.kind]} · ${post.title}`}>
                <div className="min-w-0 flex-1">
                  <span className={`inline-flex items-center rounded-[7px] [padding:4px_13px] text-[white] text-[11px] leading-[1.4] font-semibold [&.lost-found-badge--lost]:bg-[#0D2B74] [&.lost-found-badge--found]:bg-[#1554ff] lost-found-badge lost-found-badge--${post.kind}`}>{lostPostLabels[post.kind]}</span>
                  <h4 className="mt-2 truncate text-[15px] font-bold">{post.title}</h4>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#999]"><LostFoundIcon name="pin" className="size-3 shrink-0" /><span className="truncate">{post.location}</span></p>
                  <time className="mt-1 block text-[10px] text-[#aaa]" dateTime={new Date(post.createdAt).toISOString()}>{formatLostPostTime(post.createdAt, now)}</time>
                </div>
                {post.photos[0] && <div className="relative size-18 shrink-0 overflow-hidden rounded-[10px]">
                  <img className="h-full w-full object-cover" src={post.photos[0].src} alt={`${post.title} 사진`} loading="lazy" />
                  {post.photos.length > 1 && <span className="absolute right-1 bottom-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">+{post.photos.length - 1}</span>}
                </div>}
              </button>
            </li>)}
          </ul> : <div className="py-16 text-center">
            <LostFoundIcon name="search" className="mx-auto mb-4 size-9 text-[#c6d5fa]" />
            <p className="text-sm font-semibold text-[#666]">{query.trim() ? '검색 결과가 없어요' : posts.length ? '이 카테고리에 등록된 글이 없어요' : '아직 등록된 분실물이 없어요'}</p>
            <p className="mt-2 text-xs text-[#999]">{query.trim() ? '다른 물건 이름이나 장소로 검색해 보세요.' : '찾거나 주운 물건을 첫 번째로 등록해 보세요.'}</p>
          </div>}
          <button type="button" className={"fixed z-[45] right-[max(20px,_calc((100vw_-_var(--app-max-width))_/_2_+_20px))] bottom-[calc(24px_+_env(safe-area-inset-bottom,_0px))] flex items-center gap-[9px] min-h-[48px] [padding:12px_20px] rounded-[28px] bg-[#1554ff] text-[white] text-[16px] font-bold [box-shadow:0_4px_16px_#1554ff26] lost-found-write"} onClick={() => { setNotice(''); onWrite() }}><LostFoundIcon name="plus" />글쓰기</button>
        </section>}
      </div>
    </AppLayout>
  )
}
