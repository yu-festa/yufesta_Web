import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { createOfficialLostItem, getAdminContentReports, resolveAdminLostItem, reviewContentReport, setCheerVisibility, setLostItemVisibility } from '../../api/adminContent'
import type { AdminContentReport } from '../../api/adminContent'
import type { ContentReportTarget } from '../../api/contentReports'
import { getLostItems } from '../../api/lostItems'
import { getCheers } from '../../api/cheers'
import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { displayAdminTime } from '../../utils/admin'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

export default function AdminModeration() {
  const [reviewed, setReviewed] = useState<'all' | 'false' | 'true'>('false')
  const [targetType, setTargetType] = useState<'ALL' | ContentReportTarget>('ALL')
  const [page, setPage] = useState(0)
  const loadReports = useCallback(() => getAdminContentReports(reviewed === 'all' ? undefined : reviewed === 'true', targetType === 'ALL' ? undefined : targetType, page), [reviewed, targetType, page])
  const reports = useAdminResource(loadReports)
  const lost = useAdminResource(getLostItems)
  const cheers = useAdminResource(getCheers)
  const action = useAdminAction()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [manualType, setManualType] = useState<ContentReportTarget>('CHEER')
  const [manualId, setManualId] = useState('')
  const [official, setOfficial] = useState({ description: '', placeText: '', occurredAt: '' })

  const refreshAll = async () => { await Promise.all([reports.refresh(), lost.refresh(), cheers.refresh()]) }
  const execute = (work: () => Promise<unknown>, success: string) => action.run(async () => { await work(); await refreshAll() }, success)
  const visibility = (type: ContentReportTarget, id: number, hidden: boolean) => setConfirmation({
    title: hidden ? '콘텐츠를 숨길까요?' : '콘텐츠를 다시 표시할까요?',
    description: `${type === 'CHEER' ? '응원' : '분실물 글'} #${id}의 공개 상태를 바꿉니다.`,
    success: hidden ? '콘텐츠를 숨겼어요.' : '콘텐츠를 다시 표시했어요.',
    action: async () => { if (type === 'CHEER') await setCheerVisibility(id, hidden); else await setLostItemVisibility(id, hidden); await refreshAll() },
  })
  const review = (report: AdminContentReport) => setConfirmation({ title: '신고를 검토 완료할까요?', description: `신고 #${report.id}의 검토 시각을 기록합니다. 콘텐츠 공개 상태는 별도로 바꿔야 해요.`, success: '신고를 검토 완료했어요.', action: async () => { await reviewContentReport(report.id); await reports.refresh() } })
  const submitOfficial = (event: FormEvent) => { event.preventDefault(); void execute(() => createOfficialLostItem({ description: official.description.trim(), placeText: official.placeText.trim(), occurredAt: official.occurredAt ? official.occurredAt.length === 16 ? `${official.occurredAt}:00` : official.occurredAt : null }), '공식 습득물을 등록했어요.').then(ok => { if (ok) setOfficial({ description: '', placeText: '', occurredAt: '' }) }) }

  return <>
    <SectionHeading title="콘텐츠 · 신고 관리" description="응원과 분실물 신고를 검토하고 공개 상태를 관리해요."><button className="admin-button secondary" disabled={action.busy} onClick={() => void refreshAll()}>새로고침</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    <div className="admin-toolbar"><label>검토 상태<select value={reviewed} onChange={event => { setReviewed(event.target.value as typeof reviewed); setPage(0) }}><option value="false">미검토</option><option value="true">검토 완료</option><option value="all">전체</option></select></label><label>대상<select value={targetType} onChange={event => { setTargetType(event.target.value as typeof targetType); setPage(0) }}><option value="ALL">전체</option><option value="CHEER">응원</option><option value="LOST_ITEM">분실물</option></select></label></div>
    <ResourceState {...reports} onRetry={() => void reports.refresh()} />
    {!reports.loading && !reports.error && <><div className="admin-list">{!reports.data?.length && <div className="admin-empty">이 조건의 신고가 없어요.</div>}{reports.data?.map(report => <article key={report.id} className="admin-card"><div className="admin-card-title"><h3>{report.targetType === 'CHEER' ? '응원' : '분실물'} #{report.targetId}</h3><span className={`admin-badge ${report.reviewedAt ? '' : 'blue'}`}>{report.reviewedAt ? '검토 완료' : '미검토'}</span></div><p className="admin-report-reason">{report.reason}</p><p className="admin-muted">신고 #{report.id} · {displayAdminTime(report.createdAt)} · 누적 {report.targetReportCount}건</p><p className="admin-muted">현재 {report.targetHidden ? '숨김' : '공개'} · 신고자 #{report.reporterUserId ?? '—'}</p><div className="admin-actions">{!report.reviewedAt && <button className="admin-button" disabled={action.busy} onClick={() => review(report)}>검토 완료</button>}<button className="admin-button secondary" disabled={action.busy} onClick={() => visibility(report.targetType, report.targetId, !report.targetHidden)}>{report.targetHidden ? '다시 공개' : '숨기기'}</button></div></article>)}</div><div className="admin-pagination"><button className="admin-button secondary" disabled={action.busy || page === 0} onClick={() => setPage(value => value - 1)}>이전</button><span>{page + 1}페이지</span><button className="admin-button secondary" disabled={action.busy || (reports.data?.length ?? 0) < 20} onClick={() => setPage(value => value + 1)}>다음</button></div></>}

    <section className="admin-card admin-editor"><h3>공개 콘텐츠 관리</h3><p className="admin-muted">공개된 최근 응원과 분실물 글만 목록에 표시됩니다. 숨긴 항목은 위 신고 목록 또는 ID로 다시 공개할 수 있어요.</p><div className="admin-grid"><div><h4 className="font-bold">최근 응원</h4><ResourceState {...cheers} onRetry={() => void cheers.refresh()} />{cheers.data?.map(cheer => <div className="admin-event" key={cheer.id}><div><strong>#{cheer.id} {cheer.displayName}</strong><p>{cheer.content}</p></div><button className="admin-link" disabled={action.busy} onClick={() => visibility('CHEER', cheer.id, true)}>숨기기</button></div>)}</div><div><h4 className="font-bold">최근 분실물</h4><ResourceState {...lost} onRetry={() => void lost.refresh()} />{lost.data?.map(item => <div className="admin-event" key={item.id}><div><strong>#{item.id} {item.description}</strong><p>{item.placeText} · {item.status === 'RESOLVED' ? '해결됨' : '진행 중'}</p></div><div className="flex flex-wrap gap-1">{item.status === 'OPEN' && <button className="admin-link" disabled={action.busy} onClick={() => void execute(() => resolveAdminLostItem(item.id), '분실물을 해결 처리했어요.')}>해결</button>}<button className="admin-link" disabled={action.busy} onClick={() => visibility('LOST_ITEM', item.id, true)}>숨기기</button></div></div>)}</div></div>
      <form className="admin-toolbar" onSubmit={event => { event.preventDefault(); if (Number(manualId) > 0) visibility(manualType, Number(manualId), false) }}><label>숨긴 콘텐츠 다시 공개<select value={manualType} onChange={event => setManualType(event.target.value as ContentReportTarget)}><option value="CHEER">응원</option><option value="LOST_ITEM">분실물</option></select></label><label>ID<input required type="number" min="1" step="1" value={manualId} onChange={event => setManualId(event.target.value)} /></label><button className="admin-button secondary" disabled={action.busy || !manualId}>ID로 공개</button></form>
    </section>

    <form className="admin-card admin-editor" onSubmit={submitOfficial}><h3>공식 습득물 등록</h3><p className="admin-muted">운영진이 보관 중인 물품을 발견 글로 올립니다.</p><fieldset disabled={action.busy}><Field label="물품 설명"><input required maxLength={100} value={official.description} onChange={event => setOfficial({ ...official, description: event.target.value })} /></Field><Field label="습득 장소"><input required maxLength={50} value={official.placeText} onChange={event => setOfficial({ ...official, placeText: event.target.value })} /></Field><Field label="습득 시각 (한국 시간, 선택)"><input type="datetime-local" step="1" value={official.occurredAt} onChange={event => setOfficial({ ...official, occurredAt: event.target.value })} /></Field><div className="admin-actions"><button className="admin-button" disabled={!official.description.trim() || !official.placeText.trim()}>등록</button></div></fieldset></form>
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}
