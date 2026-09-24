import { useCallback } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import ResourceStatus from '../components/ResourceStatus'
import { getNotices, getNotice } from '../api/notices'
import { usePublicResource } from '../hooks/usePublicResource'
import { formatContentTime } from '../utils/publicContent'

function NoticeDetail({ id }: { id: number }) {
  const load = useCallback(() => {
    if (!Number.isSafeInteger(id) || id < 1) return Promise.reject(new Error('올바른 공지 주소가 아니에요. 목록에서 다시 선택해 주세요.'))
    return getNotice(id)
  }, [id])
  const notice = usePublicResource(load)
  return <>
    <ResourceStatus loading={notice.loading} error={notice.error} retry={notice.refresh} />
    {notice.data && <article className="mt-6 rounded-2xl border border-[#e3e9f5] p-6">
      {notice.data.banner && <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-bold text-[#1554ff]">주요 공지</span>}
      <h2 className="mt-4 text-xl font-bold wrap-anywhere">{notice.data.title}</h2>
      <time className="mt-3 block text-xs text-[#7d89a1]" dateTime={notice.data.createdAt}>{formatContentTime(notice.data.createdAt)}</time>
      <p className="mt-6 border-t border-[#edf1f8] pt-6 text-sm leading-7 whitespace-pre-wrap wrap-anywhere">{notice.data.body}</p>
    </article>}
  </>
}

function NoticeList({ onOpen }: { onOpen: (id: number) => void }) {
  const notices = usePublicResource(getNotices)
  return <>
    <p className="mt-5 text-sm text-[#7d89a1]">축제 소식을 확인해 보세요. 최근 공지 최대 50개를 보여드려요.</p>
    <ResourceStatus loading={notices.loading} error={notices.error} retry={notices.refresh} />
    {!notices.loading && !notices.error && notices.data?.length === 0 && <p className="my-8 rounded-2xl bg-[#f7f9ff] p-8 text-center text-sm text-[#63708a]">아직 등록된 공지가 없어요.</p>}
    <ul className="mt-5 space-y-3">{notices.data?.map(notice => <li key={notice.id}><button type="button" onClick={() => onOpen(notice.id)} className="w-full rounded-2xl border border-[#e3e9f5] p-5 text-left hover:bg-[#f7f9ff] focus-visible:outline-2 focus-visible:outline-[#1554ff]">
      {notice.banner && <span className="mb-2 block text-xs font-bold text-[#1554ff]">주요 공지</span>}
      <span className="block font-semibold wrap-anywhere">{notice.title}</span>
      <time className="mt-2 block text-xs text-[#7d89a1]" dateTime={notice.createdAt}>{formatContentTime(notice.createdAt)}</time>
    </button></li>)}</ul>
  </>
}

export default function Notices({ noticeId, onHome, onBack, onOpen }: { noticeId: number | null; onHome: () => void; onBack: () => void; onOpen: (id: number) => void }) {
  return <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}><section className="pb-8 text-[#192135]">
    <div className="grid grid-cols-[44px_1fr_44px] items-center"><button type="button" onClick={onBack} aria-label={noticeId === null ? '메인으로 돌아가기' : '공지 목록으로 돌아가기'} className="size-11 text-2xl">‹</button><h1 className="text-center text-lg font-semibold">축제 공지</h1></div>
    {noticeId === null ? <NoticeList onOpen={onOpen} /> : <NoticeDetail key={noticeId} id={noticeId} />}
  </section></AppLayout>
}
