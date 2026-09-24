import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { useCallback, useState } from 'react'
import { getAdminReports, reviewReport } from '../../api/admin'
import type { AdminReport, ReportDecision } from '../../api/admin'
import { displayAdminTime } from '../../utils/admin'
import { ConfirmDialog, Feedback, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

const reasons = { PROFILE: '프로필 문제', FAKE: '허위 정보', OTHER: '기타' }
export default function AdminReports() {
  const [filter, setFilter] = useState('pending')
  const [page, setPage] = useState(0)
  const load = useCallback(() => getAdminReports(filter === 'all' ? undefined : filter === 'reviewed', page), [filter, page])
  const resource = useAdminResource(load)
  const action = useAdminAction()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const reports = resource.data ?? []
  const requestReview = (report: AdminReport, decision: ReportDecision) => setConfirmation({
    title: `신고 #${report.id} ${decision === 'CONFIRM' ? '제재 확정' : '기각'}`,
    description: decision === 'CONFIRM'
      ? `대상 사용자 #${report.targetUserId}의 현재 신청을 취소하고 이후 매칭 참여를 차단합니다. 신고 수가 기준보다 적어도 즉시 적용됩니다.`
      : `이 신고를 유효 신고 수에서 제외합니다. 남은 신고 수가 기준보다 적으면 대상 사용자 #${report.targetUserId}의 제재가 해제됩니다.`,
    success: `신고 #${report.id} 검토 결과를 저장했어요.`,
    action: async () => { await reviewReport(report.id, decision); await resource.refresh() },
  })
  return <>
    <SectionHeading title="신고 검토" description="신고 내용과 대상의 현재 제재 상태를 확인해요."><button className="admin-button secondary" disabled={resource.loading || action.busy} onClick={() => void resource.refresh()}>새로고침</button></SectionHeading>
    <div className="admin-toolbar"><label>검토 상태 <select aria-label="신고 검토 상태" value={filter} disabled={action.busy} onChange={event => { setFilter(event.target.value); setPage(0) }}><option value="pending">미검토</option><option value="reviewed">검토 완료</option><option value="all">전체</option></select></label><span className="admin-muted">20건씩 표시 · {page + 1}페이지</span></div>
    <Feedback error={action.error} success={action.success} />
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <>
      {!reports.length && <div className="admin-empty">조건에 해당하는 신고가 없습니다.</div>}
      <div className="admin-grid">{reports.map(report => <article key={report.id} className="admin-card">
        <div className="admin-card-title"><h3>신고 #{report.id}</h3><span className={`admin-badge ${report.decision ? '' : 'blue'}`}>{report.decision === 'CONFIRM' ? '제재 확정' : report.decision === 'DISMISS' ? '기각' : '미검토'}</span></div>
        <p className="admin-report-reason">{reasons[report.reason] || report.reason}</p><p className="admin-report-body">{report.detail || '추가 설명이 없습니다.'}</p>
        <dl className="admin-details"><dt>회차</dt><dd>{report.roundSeq === null ? '확인 불가' : `${report.roundSeq}회차`}</dd><dt>신고자 / 대상</dt><dd>#{report.reporterUserId} / #{report.targetUserId}</dd><dt>대상 유효 신고</dt><dd>{report.targetReportCount}건</dd><dt>현재 제재</dt><dd className={report.targetBlocked ? 'admin-danger-text' : ''}>{report.targetBlocked ? '매칭 차단 중' : '차단 없음'}</dd><dt>접수 시각</dt><dd>{displayAdminTime(report.createdAt)}</dd><dt>검토 시각</dt><dd>{displayAdminTime(report.reviewedAt)}</dd></dl>
        {report.decision && <p className="admin-muted">다시 검토하면 마지막 결정으로 반영됩니다.</p>}
        <div className="admin-actions"><button className="admin-button danger" disabled={action.busy} onClick={() => requestReview(report, 'CONFIRM')}>제재 확정</button><button className="admin-button secondary" disabled={action.busy} onClick={() => requestReview(report, 'DISMISS')}>신고 기각</button></div>
      </article>)}</div>
    </>}
    <div className="admin-pagination"><button className="admin-button secondary" disabled={page === 0 || resource.loading || action.busy} onClick={() => setPage(value => value - 1)}>이전</button><span>{page + 1}</span><button className="admin-button secondary" disabled={resource.loading || action.busy || !!resource.error || reports.length < 20} onClick={() => setPage(value => value + 1)}>다음</button></div>
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => { if (confirmation) void action.run(confirmation.action, confirmation.success).then(() => setConfirmation(null)) }} />
  </>
}
