import { useEffect, useState } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import LostFoundIcon from '../components/LostFoundIcon'
import LostPostForm from '../components/LostPostForm'
import LostPostDetail from './LostPostDetail'
import { getLostItems } from '../api/lostItems'
import type { LostItem, LostItemKind } from '../api/lostItems'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatLostItemTime, lostItemLabels, splitLostItemDescription } from '../utils/lostItemDisplay'
import { parseMatchTime } from '../utils/match'

type Props = { isWriting: boolean; onBack: () => void; onHome: () => void; onWrite: () => void; onBackToList: () => void; postId: string | null; onOpenPost: (id: string) => void; isAuthenticated: boolean; onLogin: () => void }

export default function LostFound({ isWriting, onBack, onHome, onWrite, onBackToList, postId, onOpenPost, isAuthenticated, onLogin }: Props) {
  const resource = usePublicResource(getLostItems)
  const posts = resource.data ?? []
  const [filter, setFilter] = useState<LostItemKind | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (!notice || isWriting) return; const timer = window.setTimeout(() => setNotice(''), 1000); return () => window.clearTimeout(timer) }, [notice, isWriting])

  const search = query.trim().toLocaleLowerCase('ko-KR')
  const visible = posts.filter(post => (filter === 'ALL' || post.kind === filter) && (!search || `${post.description} ${post.placeText}`.toLocaleLowerCase('ko-KR').includes(search)))
    .sort((a, b) => parseMatchTime(b.createdAt) - parseMatchTime(a.createdAt))

  function registered(post: LostItem) {
    resource.replaceData(current => [post, ...(current ?? []).filter(item => item.id !== post.id)].slice(0, 50))
    setQuery('')
    setFilter('ALL')
    setNotice('게시글이 등록되었어요.')
    setNow(Date.now())
    onBackToList()
  }

  if (postId !== null) return <LostPostDetail key={postId} postId={postId} post={posts.find(item => String(item.id) === postId) ?? null} onBack={onBackToList} onHome={onHome} onChanged={() => void resource.refresh()} isAuthenticated={isAuthenticated} onLogin={onLogin} />

  return <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
    <div className="text-[#222] [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-[0.55] [&_:is(button,_input,_textarea):focus-visible]:[outline:2px_solid_#1554ff] [&_:is(button,_input,_textarea):focus-visible]:outline-offset-[3px]">
      <div className="relative flex min-h-12 items-center justify-center">
        <button type="button" className="absolute -left-2 grid size-11 place-items-center rounded-full" onClick={isWriting ? onBackToList : onBack} aria-label={isWriting ? '분실물 게시판으로 돌아가기' : '메인으로 돌아가기'}><LostFoundIcon name="back" className="size-5" /></button>
        <h1 className="text-base font-semibold">{isWriting ? '분실물 글쓰기' : '분실물 게시판'}</h1>
      </div>
      {isWriting ? isAuthenticated ? <LostPostForm onRegistered={registered} /> : <div className="mt-10 rounded-xl bg-[#f5f8ff] p-6 text-center text-sm">로그인 후 분실물 글을 등록할 수 있어요.<button type="button" className="mt-4 block w-full rounded-lg bg-[#1554ff] px-4 py-3 font-bold text-white" onClick={onLogin}>로그인하기</button></div> : <section className="pb-24" aria-labelledby="lost-intro">
        <h2 id="lost-intro" className="mt-4 text-[24px] leading-snug font-bold tracking-[-0.9px]">잃어버린 물건, 함께 찾아요</h2>
        <p className="mt-2 text-xs leading-relaxed text-[#999]">주인 없는 물건을 발견했다면, 게시판에 올려주세요</p>
        <div className="relative mt-6"><LostFoundIcon name="search" className="pointer-events-none absolute top-3 left-3 size-5 text-[#aaa]" /><input type="search" className="block min-h-[42px] w-full rounded-[8px] border border-[#dedede] bg-white py-[10px] pr-[13px] pl-10 text-[14px] leading-[1.5] placeholder:text-[#aaa]" aria-label="분실물 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="물건 이름이나 장소를 검색해보세요" /></div>
        <nav className="mt-2.5 flex flex-wrap gap-3" aria-label="분실물 카테고리">{(['ALL', 'LOST', 'FOUND'] as const).map(value => <button key={value} type="button" className={`min-h-8 rounded-[7px] border px-[15px] py-[5px] text-[12px] font-semibold ${filter === value ? value === 'LOST' ? 'border-[#0D2B74] bg-[#0D2B74] text-white' : 'border-[#1554ff] bg-[#1554ff] text-white' : 'border-[#ddd] bg-white'}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'ALL' ? '전체' : lostItemLabels[value]}</button>)}</nav>
        {notice && <p className="mt-4 rounded-lg bg-[#edf3ff] px-3 py-2 text-sm text-[#1554ff]" role="status">{notice}</p>}
        <div className="mt-7 flex items-baseline gap-2 text-base font-bold"><h3>{query.trim() ? '검색 결과' : filter === 'ALL' ? '전체' : lostItemLabels[filter]}</h3><span className="text-[#1554ff]">{resource.data ? visible.length : '—'}</span></div>
        {resource.loading && !resource.data ? <p className="py-16 text-center text-sm text-[#888]" role="status">게시글을 불러오고 있어요…</p> : resource.error && !resource.data ? <div className="py-10 text-center" role="alert"><p className="text-sm text-red-700">{resource.error}</p><button className="mt-3 rounded-lg bg-[#edf3ff] px-4 py-2 text-sm font-semibold text-[#1554ff]" onClick={() => void resource.refresh()}>다시 불러오기</button></div> : visible.length ? <ul className="mt-1" aria-label="분실물 게시글">{visible.map(post => {
          const title = splitLostItemDescription(post.description).title
          return <li key={post.id} className="border-b border-[#e5e5e5]"><button type="button" className="flex w-full items-center gap-4 py-4 text-left" onClick={() => onOpenPost(String(post.id))} aria-label={`${lostItemLabels[post.kind]} · ${title}`}><div className="min-w-0 flex-1"><span className={`inline-flex items-center rounded-[7px] px-[13px] py-1 text-[11px] leading-[1.4] font-semibold text-white ${post.kind === 'LOST' ? 'bg-[#0D2B74]' : 'bg-[#1554ff]'}`}>{lostItemLabels[post.kind]}</span>{post.status === 'RESOLVED' && <span className="ml-2 text-[11px] text-[#929bad]">해결됨</span>}<h4 className="mt-2 truncate text-[15px] font-bold">{title}</h4><p className="mt-1 flex items-center gap-1 text-[11px] text-[#999]"><LostFoundIcon name="pin" className="size-3 shrink-0" /><span className="truncate">{post.placeText}</span></p><time className="mt-1 block text-[10px] text-[#aaa]" dateTime={post.createdAt}>{formatLostItemTime(post.createdAt, now)}</time></div></button></li>
        })}</ul> : <div className="py-16 text-center"><LostFoundIcon name="search" className="mx-auto mb-4 size-9 text-[#c6d5fa]" /><p className="text-sm font-semibold text-[#666]">{query.trim() ? '검색 결과가 없어요' : posts.length ? '이 카테고리에 등록된 글이 없어요' : '아직 등록된 분실물이 없어요'}</p><p className="mt-2 text-xs text-[#999]">{query.trim() ? '다른 물건 이름이나 장소로 검색해 보세요.' : '찾거나 주운 물건을 첫 번째로 등록해 보세요.'}</p></div>}
        <button type="button" className="fixed right-[max(20px,_calc((100vw_-_var(--app-max-width))_/_2_+_20px))] bottom-[calc(24px_+_env(safe-area-inset-bottom,_0px))] z-[45] flex min-h-12 items-center gap-[9px] rounded-[28px] bg-[#1554ff] px-5 py-3 text-[16px] font-bold text-white shadow-[0_4px_16px_#1554ff26]" onClick={() => { setNotice(''); onWrite() }}><LostFoundIcon name="plus" />글쓰기</button>
      </section>}
    </div>
  </AppLayout>
}
