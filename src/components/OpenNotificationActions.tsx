import { useEffect, useRef, useState } from 'react'

type Config = { publicKey: string; sendAt: string; accepting: boolean; mode: 'test' | 'opening' }
const buttonClass = 'flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#b4d5ff]/30 bg-linear-to-r from-[#1554ff]/35 to-[#64c0ff]/25 px-5 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:from-[#1554ff]/60 hover:to-[#64c0ff]/40 disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none'
const storageKey = (config: Config) => `yufesta.open-notification:${config.sendAt}`
function keyBytes(value: string) {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}
async function fingerprint(endpoint: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('')
}
async function readResponse(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || '알림 신청 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  return data
}

export default function OpenNotificationActions({ onBrowse }: { onBrowse: () => void }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)
  const lock = useRef(false)
  useEffect(() => {
    const abort = new AbortController()
    let active = true
    void fetch('/api/open-notification', { signal: abort.signal, cache: 'no-store' }).then(readResponse).then(async (data: Config) => {
      if (!data?.publicKey || !Number.isFinite(Date.parse(data.sendAt))) throw new Error('알림 신청을 준비하고 있어요.')
      if (!active) return
      setConfig(data)
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) {
          const id = await fingerprint(subscription.endpoint)
          try { if (active && localStorage.getItem(storageKey(data)) === id) setRegistered(true) } catch { /* Storage is optional. */ }
        }
      }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : '알림 신청을 준비하고 있어요.') }).finally(() => { if (active) setLoading(false) })
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => { active = false; abort.abort(); window.clearInterval(timer) }
  }, [])

  async function subscribe() {
    if (lock.current || !config) return
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (ios && !window.matchMedia('(display-mode: standalone)').matches && !(navigator as Navigator & { standalone?: boolean }).standalone) {
      setError('아이폰·아이패드는 공유 → 홈 화면에 추가 후, 추가한 앱에서 알림을 신청해 주세요.'); return
    }
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('이 브라우저에서는 알림을 사용할 수 없어요. 알림을 지원하는 브라우저에서 열어주세요.'); return
    }
    lock.current = true; setBusy(true); setError('')
    try {
      // Request permission directly in the click gesture, before other asynchronous work.
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('알림 권한을 허용해야 받을 수 있어요. 브라우저의 사이트 알림 설정을 확인해 주세요.')
      const registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration?.active) throw new Error('알림 기능을 준비 중이에요. 페이지를 새로고침한 뒤 다시 신청해 주세요.')
      const publicKey = keyBytes(config.publicKey)
      let subscription = await registration.pushManager.getSubscription()
      const existingKey = subscription?.options.applicationServerKey
      if (existingKey && (new Uint8Array(existingKey).length !== publicKey.length || new Uint8Array(existingKey).some((byte, index) => byte !== publicKey[index]))) throw new Error('기존 알림 설정이 변경됐어요. 사이트의 알림 설정을 초기화한 뒤 다시 신청해 주세요.')
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
      const result = await readResponse(await fetch('/api/open-notification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: subscription.toJSON() }),
      }))
      if (result?.accepted !== true) throw new Error('알림 예약을 확인하지 못했어요. 다시 시도해 주세요.')
      setRegistered(true)
      try { localStorage.setItem(storageKey(config), await fingerprint(subscription.endpoint)) } catch { /* Server registration is already complete. */ }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '알림을 신청하지 못했어요. 다시 시도해 주세요.') }
    finally { lock.current = false; setBusy(false) }
  }
  const expired = config ? now >= Date.parse(config.sendAt) - 10_000 : false
  return <div className="mt-7">
    <div className="flex flex-wrap justify-center gap-3">
      <button type="button" className={buttonClass} onClick={onBrowse}>서비스 둘러보기<span aria-hidden="true">↓</span></button>
      <button type="button" className={buttonClass} disabled={loading || busy || registered || !config?.accepting || expired} onClick={() => void subscribe()}>
        {busy ? '알림 신청 중…' : registered ? '알림 신청 완료' : expired ? '알림 신청 마감' : '오픈 알림 받기'}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      </button>
    </div>
    {error && <p role="alert" className="mt-3 text-xs leading-5 text-[#ffd7df]">{error}{!config && <button type="button" className="ml-2 underline" onClick={() => window.location.reload()}>다시 불러오기</button>}</p>}
  </div>
}
