import { useAdminAction, useAdminResource } from '../../hooks/useAdminData'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { closeRound, getAdminRounds, getBatchResult, openRound, publishRound, rerunRound, updateRoundTimes } from '../../api/admin'
import type { AdminRound, BatchResult, RoundTimes } from '../../api/admin'
import { displayAdminTime, roundActions, roundLabels, toKoreanInput, validateRoundTimes } from '../../utils/admin'
import { ConfirmDialog, Feedback, Field, ResourceState, SectionHeading } from '../../components/admin/AdminShared'
import type { Confirmation } from '../../components/admin/AdminShared'

export default function AdminRounds({ role }: { role: 'STAFF' | 'OWNER' }) {
  const resource = useAdminResource(getAdminRounds)
  const action = useAdminAction()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [editing, setEditing] = useState<AdminRound | null>(null)
  const [result, setResult] = useState<{ id: number; data: BatchResult } | null>(null)
  const rounds = resource.data ?? []
  const confirm = async () => {
    if (!confirmation) return
    await action.run(confirmation.action, confirmation.success)
    setConfirmation(null)
  }
  const requestAction = (round: AdminRound, kind: 'open' | 'close' | 'rerun' | 'publish') => {
    if (!roundActions(round, role)[kind]) return
    const copy = {
      open: ['접수 시작', '이 회차의 신청 접수를 즉시 시작합니다.'],
      close: ['마감 및 매칭 실행', '신청을 마감하고 현재 신청자들의 매칭을 실행합니다.'],
      rerun: ['매칭 다시 실행', '이 회차의 기존 매칭 결과를 지우고 다시 배정합니다.'],
      publish: ['결과 발표', '결과를 사용자에게 공개합니다. 다음 회차가 있으면 미매칭 신청을 이월하고 다음 회차를 엽니다. 발표 후에는 시각 수정과 재실행이 불가능합니다.'],
    }[kind]
    setConfirmation({ title: `${round.seq}회차 ${copy[0]}`, description: copy[1], success: `${round.seq}회차 ${copy[0]} 완료`, action: async () => {
      const response = await ({ open: openRound, close: closeRound, rerun: rerunRound, publish: publishRound }[kind])(round.id)
      setEditing(null)
      setResult('pairCount' in response ? { id: round.id, data: response } : null)
      await resource.refresh()
    } })
  }
  return <>
    <SectionHeading title="인스타팅 회차 운영" description="접수부터 매칭 결과 발표까지, 회차별로 관리해요."><button className="admin-button secondary" disabled={resource.loading || action.busy} onClick={() => { setEditing(null); setResult(null); void resource.refresh() }}>새로고침</button></SectionHeading>
    <Feedback error={action.error} success={action.success} />
    <ResourceState {...resource} onRetry={() => void resource.refresh()} />
    {!resource.loading && !resource.error && <>
      <div className="admin-stats"><div><span>전체 회차</span><strong>{rounds.length}</strong></div><div><span>접수 중</span><strong>{rounds.filter(r => r.status === 'OPEN').length}</strong></div><div><span>발표 대기</span><strong>{rounds.filter(r => r.status === 'CLOSED').length}</strong></div></div>
      {!rounds.length && <div className="admin-empty">등록된 회차가 없습니다. 회차 생성은 서버 설정이 필요합니다.</div>}
      <div className="admin-grid">{rounds.map(round => {
        const allowed = roundActions(round, role)
        return <article className="admin-card" key={round.id}>
          <div className="admin-card-title"><h3>{round.seq}회차</h3><span className={`admin-badge ${round.status === 'OPEN' ? 'blue' : ''}`}>{roundLabels[round.status]}</span></div>
          <dl className="admin-details"><dt>접수 시작</dt><dd>{displayAdminTime(round.openAt)}</dd><dt>접수 마감</dt><dd>{displayAdminTime(round.closeAt)}</dd><dt>발표 예정</dt><dd>{displayAdminTime(round.publishAt)}</dd><dt>매칭 실행</dt><dd>{displayAdminTime(round.executedAt)}</dd><dt>발표 완료</dt><dd>{displayAdminTime(round.publishedAt)}</dd></dl>
          <p className="admin-muted">한국 시간 (KST) 기준</p>
          <div className="admin-actions">
            <button className="admin-button secondary" disabled={action.busy} onClick={() => { setResult(null); void action.run(async () => setResult({ id: round.id, data: await getBatchResult(round.id) }), '배치 결과를 불러왔어요.') }}>배치 결과</button>
            {allowed.times && <button className="admin-button secondary" disabled={action.busy} onClick={() => setEditing(editing?.id === round.id ? null : round)}>시각 수정</button>}
            {allowed.open && <button className="admin-button" disabled={action.busy} onClick={() => requestAction(round, 'open')}>접수 시작</button>}
            {allowed.close && <button className="admin-button" disabled={action.busy} onClick={() => requestAction(round, 'close')}>마감 · 매칭 실행</button>}
            {allowed.rerun && <button className="admin-button secondary" disabled={action.busy} onClick={() => requestAction(round, 'rerun')}>매칭 재실행</button>}
            {allowed.publish && <button className="admin-button" disabled={action.busy} onClick={() => requestAction(round, 'publish')}>결과 발표</button>}
          </div>
          {round.status === 'CLOSED' && role !== 'OWNER' && <p className="admin-muted">결과 발표는 총괄 운영자(OWNER)만 할 수 있어요.</p>}
          {editing?.id === round.id && <TimesForm key={`${round.id}:${round.openAt}:${round.closeAt}:${round.publishAt}`} round={round} busy={action.busy} onCancel={() => setEditing(null)} onSave={times => action.run(async () => { await updateRoundTimes(round.id, times); setEditing(null); await resource.refresh() }, '회차 시각을 저장했어요.')} />}
          {result?.id === round.id && <BatchDetails result={result.data} />}
        </article>
      })}</div>
    </>}
    <ConfirmDialog confirmation={confirmation} busy={action.busy} onCancel={() => setConfirmation(null)} onConfirm={() => void confirm()} />
  </>
}

function TimesForm({ round, busy, onCancel, onSave }: { round: AdminRound; busy: boolean; onCancel: () => void; onSave: (times: RoundTimes) => Promise<boolean> }) {
  const [times, setTimes] = useState<RoundTimes>({ openAt: toKoreanInput(round.openAt), closeAt: toKoreanInput(round.closeAt), publishAt: toKoreanInput(round.publishAt) })
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const message = validateRoundTimes(times)
    setError(message)
    if (!message) void onSave(times)
  }
  return <form className="admin-inset" onSubmit={submit}><h4>회차 시각 수정</h4><p className="admin-muted">한국 시간으로 입력해 주세요. 마감은 발표의 정확히 10분 전이어야 해요.</p><fieldset disabled={busy}>
    {([['openAt', '접수 시작'], ['closeAt', '접수 마감'], ['publishAt', '결과 발표']] as const).map(([key, label]) => <Field key={key} label={label}><input required type="datetime-local" step="1" value={times[key]} onChange={event => setTimes({ ...times, [key]: event.target.value.length === 16 ? `${event.target.value}:00` : event.target.value })} /></Field>)}
    <Feedback error={error} /><div className="admin-actions"><button className="admin-button" type="submit">시각 저장</button><button className="admin-button secondary" type="button" onClick={onCancel}>취소</button></div>
  </fieldset></form>
}

function BatchDetails({ result }: { result: BatchResult }) {
  const rows = [['배치 대상', `${result.poolSize}명`], ['남성 / 여성', `${result.poolMen}명 / ${result.poolWomen}명`], ['매칭 인원', `${result.matchedApplicants}명`], ['미매칭 인원', `${result.unmatchedApplicants}명`], ['전체 매칭 쌍', `${result.pairCount}쌍`], ['1차 / 2차 배정', `${result.firstPassPairs}쌍 / ${result.secondPassPairs}쌍`], ['평균 점수', result.averageScore === null ? '—' : String(result.averageScore)], ['실행 시각', displayAdminTime(result.executedAt)], ['발표 시각', displayAdminTime(result.publishedAt)]]
  return <section className="admin-inset"><h4>{result.roundSeq}회차 배치 결과 <span className="admin-badge">{roundLabels[result.status]}</span></h4><dl className="admin-details">{rows.map(([label, value]) => <div className="admin-detail-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
}
