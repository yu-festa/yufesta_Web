import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { InstatingConsent } from '../content/instatingConsents'

export default function InstatingConsentDialog({ consent, onClose, onAgree }: { consent: InstatingConsent; onClose: () => void; onAgree: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialog && !dialog.open) dialog.showModal()
    titleRef.current?.focus({ preventScroll: true })
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const targets = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')
        const first = targets[0]
        const last = targets[targets.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_32px)] max-w-[440px] overflow-hidden rounded-[20px] border-0 bg-white p-0 text-[#172039] shadow-xl backdrop:bg-black/45">
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[#e8edf5] px-5 py-4">
          <div className="min-w-0 pt-1">
            <p className="mb-1 text-[11px] font-semibold text-[#1554ff]">인스타팅 · 필수 동의</p>
            <h2 id={titleId} ref={titleRef} tabIndex={-1} className="break-keep text-[18px] font-bold leading-snug outline-none">{consent.title}</h2>
          </div>
          <button type="button" aria-label="약관 닫기" onClick={onClose} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#788397] hover:bg-[#f1f5ff] focus-visible:outline-2 focus-visible:outline-[#1554ff]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div tabIndex={0} role="region" aria-label={`${consent.title} 본문`} className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 text-[13px] leading-[1.8] text-[#63708a] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1554ff]">
          <p className="mb-5">{consent.introduction}</p>
          <div className="space-y-5">{consent.sections.map(section => (
            <section key={section.title} className={section.emphasized ? 'rounded-xl bg-[#f1f5ff] p-4' : undefined}>
              <h3 className="mb-2 text-[14px] font-bold text-[#172039]">{section.title}</h3>
              <div className="space-y-2">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
            </section>
          ))}</div>
        </div>
        <footer className="shrink-0 border-t border-[#e8edf5] px-5 py-4">
          <button type="button" onClick={onAgree} className="min-h-[48px] w-full cursor-pointer rounded-lg bg-[#1554ff] px-4 py-3 text-[14px] font-bold text-white hover:bg-[#1046db] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1554ff]">동의하고 닫기</button>
        </footer>
      </div>
    </dialog>, document.body,
  )
}
