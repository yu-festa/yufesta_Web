import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

export function Feedback({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p className="admin-alert" role="alert">{error}</p>}{success && <p className="admin-success" role="status">{success}</p>}</>
}
export function ResourceState({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  if (loading) return <div className="admin-empty" role="status">정보를 불러오고 있어요…</div>
  if (error) return <div className="admin-alert" role="alert">{error}<button className="admin-link" onClick={onRetry}>다시 불러오기</button></div>
  return null
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
export function SectionHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="admin-section-heading"><div><h2>{title}</h2><p>{description}</p></div>{children}</div>
}

export type Confirmation = { title: string; description: string; action: () => Promise<void>; success: string }
export function ConfirmDialog({ confirmation, busy, onConfirm, onCancel }: {
  confirmation: Confirmation | null; busy: boolean; onConfirm: () => void; onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (confirmation) ref.current?.showModal()
    else ref.current?.close()
  }, [confirmation])
  return <dialog ref={ref} className="admin-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onCancel() }}>
    <h2 id={titleId}>{confirmation?.title}</h2>
    <p>{confirmation?.description}</p>
    <div className="admin-actions"><button className="admin-button secondary" autoFocus disabled={busy} onClick={onCancel}>취소</button><button className="admin-button" disabled={busy} onClick={onConfirm}>{busy ? '처리 중…' : '확인하고 실행'}</button></div>
  </dialog>
}
