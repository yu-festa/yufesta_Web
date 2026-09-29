import { useEffect, useRef, useState } from 'react'

type Config = { publicKey: string }
const endpoint = '/api/notice-notification'
async function readResponse(response: Response) {
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || '공지 알림 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  return result
}
async function updateSubscription(action: 'status' | 'subscribe' | 'unsubscribe', subscription: PushSubscription) {
  return readResponse(await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, subscription: subscription.toJSON() }),
  }))
}

export default function NoticeNotificationActions({ compact = false }: { compact?: boolean }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reload, setReload] = useState(0)
  const lock = useRef(false)

  useEffect(() => {
    let active = true
    const abort = new AbortController()
    void (async () => {
      const data: Config = await readResponse(await fetch(endpoint, { cache: 'no-store', signal: abort.signal }))
      if (!data?.publicKey) throw new Error('공지 알림을 준비하고 있어요.')
      let subscribed = false
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) subscribed = (await updateSubscription('status', subscription)).subscribed === true
      }
      if (active) { setConfig(data); setRegistered(subscribed) }
    })().catch(cause => { if (active) setError(cause instanceof Error ? cause.message : '공지 알림 설정을 확인하지 못했어요.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; abort.abort() }
  }, [reload])

  async function toggle() {
    if (lock.current || !config) return
    setError(''); setMessage('')
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (!registered && ios && !window.matchMedia('(display-mode: standalone)').matches && !(navigator as Navigator & { standalone?: boolean }).standalone) {
      setError('아이폰·아이패드는 공유 → 홈 화면에 추가 후, 추가한 앱에서 알림을 신청해 주세요.'); return
    }
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('이 브라우저에서는 알림을 사용할 수 없어요. 알림을 지원하는 브라우저에서 열어주세요.'); return
    }
    lock.current = true; setBusy(true)
    try {
      // Keep the permission prompt inside the user's click gesture.
      if (!registered) {
        const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
        if (permission !== 'granted') throw new Error('브라우저의 사이트 설정에서 알림을 허용해 주세요.')
      }
      const registration = await navigator.serviceWorker.getRegistration('/')
      if (!registration?.active) throw new Error('알림 기능을 준비 중이에요. 새로고침한 뒤 다시 시도해 주세요.')
      let subscription = await registration.pushManager.getSubscription()
      if (registered) {
        if (!subscription) throw new Error('브라우저 구독 정보가 변경됐어요. 설정을 다시 확인해 주세요.')
        const result = await updateSubscription('unsubscribe', subscription)
        if (result.subscribed !== false) throw new Error('알림 해제를 확인하지 못했어요.')
        // Do not unsubscribe PushManager: the landing opening reminder shares it.
        setRegistered(false); setMessage('이 기기의 공지 알림을 해제했어요.')
      } else {
        const publicKey = Uint8Array.from(atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')), value => value.charCodeAt(0))
        const existingKey = subscription?.options.applicationServerKey
        if (existingKey && (existingKey.byteLength !== publicKey.length || new Uint8Array(existingKey).some((value, index) => value !== publicKey[index]))) throw new Error('알림 키가 변경됐어요. 브라우저의 사이트 알림 설정을 초기화한 뒤 다시 신청해 주세요.')
        subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey })
        const result = await updateSubscription('subscribe', subscription)
        if (result.subscribed !== true) throw new Error('공지 알림 신청을 확인하지 못했어요.')
        setRegistered(true); setMessage('신청 이후 등록되는 새 공지를 알려드릴게요.')
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : '알림 설정을 변경하지 못했어요.') }
    finally { lock.current = false; setBusy(false) }
  }

  if (compact) return <section className="px-4 py-3.5 text-left" aria-label="공지 알림 설정">
    <div className="flex items-center justify-between gap-4">
      <div><h3 className="text-sm font-semibold text-[#171717]">공지 알림</h3><p className="mt-1 text-[11px] leading-relaxed text-[#808080]">결과 발표와 축제 공지를 알려드려요</p></div>
      <button type="button" role="switch" aria-checked={registered} aria-label="공지 알림" aria-describedby="profile-notice-status" onClick={() => void toggle()} disabled={loading || busy || !config} className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center disabled:cursor-default disabled:opacity-40">
        <span className={`relative h-6 w-11 rounded-full transition-colors ${registered ? 'bg-[#1554ff]' : 'bg-[#d6dbe5]'}`} aria-hidden="true"><span className={`absolute top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform ${registered ? 'translate-x-[23px]' : 'translate-x-[3px]'} left-0`} /></span>
      </button>
    </div>
    <p id="profile-notice-status" role="status" className={loading || busy || message ? 'mt-1 text-[11px] text-[#1554ff]' : 'sr-only'}>{loading ? '알림 설정 확인 중…' : busy ? '설정 저장 중…' : message || (registered ? '공지 알림 켜짐' : '공지 알림 꺼짐')}</p>
    {error && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}<button type="button" disabled={busy || loading} className="ml-2 underline" onClick={() => { setLoading(true); setError(''); setConfig(null); setRegistered(false); setReload(value => value + 1) }}>설정 다시 확인</button></p>}
  </section>

  return <section className="mt-6 rounded-xl border border-[#dfe8fb] bg-[#f6f9ff] p-5 text-left" aria-label="공지 알림 설정">
    <h3 className="text-sm font-bold text-[#172039]">새 공지를 놓치지 마세요</h3>
    <p className="mt-2 text-xs leading-6 text-[#63708a]">인스타팅 결과 발표를 포함한 새 축제 공지를 알려드려요. 이 기기에서 알림을 허용한 경우에만 받을 수 있어요.</p>
    <button type="button" onClick={() => void toggle()} disabled={loading || busy || !config} aria-pressed={registered} className="mt-4 min-h-11 w-full cursor-pointer rounded-lg bg-[#1554ff] px-4 py-3 text-sm font-bold text-white disabled:cursor-default disabled:opacity-50">
      {loading ? '알림 설정 확인 중…' : busy ? '설정 저장 중…' : registered ? '공지 알림 해제하기' : '공지 알림 받기'}
    </button>
    <p role="status" className="mt-2 text-xs leading-5 text-[#1554ff]">{message || (registered ? '공지 알림을 받고 있어요.' : '')}</p>
    {error && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}<button type="button" disabled={busy || loading} className="ml-2 underline" onClick={() => { setLoading(true); setError(''); setConfig(null); setRegistered(false); setReload(value => value + 1) }}>설정 다시 확인</button></p>}
  </section>
}
