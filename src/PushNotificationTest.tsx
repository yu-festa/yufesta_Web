import { useCallback, useEffect, useRef, useState } from 'react'

type Phase = 'loading' | 'ready' | 'waiting' | 'accepted' | 'received' | 'blocked' | 'unsupported' | 'error'
type Status = { phase: Phase; message: string }
type Connection = { registration: ServiceWorkerRegistration; key: Uint8Array<ArrayBuffer> }

function supportsPush() {
  return window.isSecureContext && 'Notification' in window
    && 'PushManager' in window && 'serviceWorker' in navigator
}

function initialStatus(): Status {
  if (!supportsPush()) return {
    phase: 'unsupported', message: '이 환경에서는 웹 푸시를 사용할 수 없어요. iPhone은 홈 화면에 추가한 앱에서 열어 주세요.',
  }
  if (Notification.permission === 'denied') return {
    phase: 'blocked', message: '알림이 차단되어 있어요. 브라우저 또는 기기 설정에서 이 사이트의 알림을 허용한 뒤 새로고침해 주세요.',
  }
  return { phase: 'loading', message: '알림 연결을 확인하고 있어요.' }
}

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(decoded, character => character.charCodeAt(0))
}

function usesKey(subscription: PushSubscription, key: Uint8Array<ArrayBuffer>) {
  const current = subscription.options.applicationServerKey
  return current !== null && current.byteLength === key.byteLength
    && new Uint8Array(current).every((value, index) => value === key[index])
}

async function readResponse(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('푸시 서버를 찾을 수 없습니다. Vercel에 배포한 주소에서 확인해 주세요.')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '알림 테스트 요청에 실패했습니다.')
  return data
}

async function readyWorker(): Promise<ServiceWorkerRegistration> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(
          '서비스 워커가 준비되지 않았습니다. 배포 화면을 새로고침한 뒤 다시 확인해 주세요.',
        )), 12000)
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

async function currentWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await readyWorker()
  await registration.update()
  const installing = registration.installing || registration.waiting
  if (installing && installing.state !== 'activated') {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        installing.removeEventListener('statechange', check)
        reject(new Error('앱 업데이트가 지연되고 있어요. 새로고침한 뒤 다시 확인해 주세요.'))
      }, 12000)
      function check() {
        if (installing!.state === 'activated' || installing!.state === 'redundant') {
          clearTimeout(timeout)
          installing!.removeEventListener('statechange', check)
          if (installing!.state === 'activated') resolve()
          else reject(new Error('앱 업데이트에 실패했습니다. 새로고침해 주세요.'))
        }
      }
      installing.addEventListener('statechange', check)
      check()
    })
  }
  return registration
}

export default function PushNotificationTest() {
  const [status, setStatus] = useState<Status>(initialStatus)
  const connection = useRef<Connection | null>(null)
  const pageOpenedAt = useRef(0)
  const initialized = useRef(false)
  const running = useRef(false)
  const renewSubscription = useRef(false)
  const activeTestId = useRef<string | null>(null)

  const sendTest = useCallback(async (subscription: PushSubscription, startedAt: number) => {
    const testId = crypto.randomUUID()
    activeTestId.current = testId
    setStatus({ phase: 'waiting', message: '테스트 알림을 기다리고 있어요. 앱을 잠시 내려놓아도 됩니다.' })
    try {
      const response = await fetch('/api/push-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          testId,
          delayMs: Math.max(0, 3000 - (performance.now() - startedAt)),
        }),
        signal: AbortSignal.timeout(20000),
      })
      if (response.status === 410) renewSubscription.current = true
      await readResponse(response)
      setStatus(current => current.phase === 'received' ? current : {
        phase: 'accepted',
        message: '푸시 서비스에 전송됐어요. 기기에 알림이 표시되는지 확인해 주세요.',
      })
    } catch (error) {
      setStatus(current => current.phase === 'received' ? current : {
        phase: 'error', message: error instanceof Error ? error.message : '푸시 전송에 실패했습니다.',
      })
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const receive = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_TEST_RECEIVED' && event.data.testId === activeTestId.current) {
        setStatus({ phase: 'received', message: '기기에서 실제 푸시를 수신했어요! 알림을 눌러 앱으로 돌아올 수 있습니다.' })
      }
    }
    navigator.serviceWorker.addEventListener('message', receive)
    return () => navigator.serviceWorker.removeEventListener('message', receive)
  }, [])

  useEffect(() => {
    // React StrictMode must not schedule two pushes for a single visit.
    if (initialized.current) return
    initialized.current = true
    pageOpenedAt.current = performance.now()
    if (!supportsPush() || Notification.permission === 'denied') return

    void (async () => {
      try {
        const [configuration, registration] = await Promise.all([
          fetch('/api/push-test', { cache: 'no-store', signal: AbortSignal.timeout(12000) }).then(readResponse),
          currentWorker(),
        ])
        const key = decodeKey(configuration.publicKey)
        connection.current = { registration, key }
        const subscription = await registration.pushManager.getSubscription()
        if (Notification.permission === 'granted' && subscription && usesKey(subscription, key)) {
          running.current = true
          await sendTest(subscription, pageOpenedAt.current)
          running.current = false
        } else {
          setStatus({ phase: 'ready', message: '아래 버튼으로 알림을 허용하면 3초 후 테스트 알림을 보내드려요.' })
        }
      } catch (error) {
        setStatus({ phase: 'error', message: error instanceof Error ? error.message : '알림 연결에 실패했습니다.' })
      }
    })()
  }, [sendTest])

  async function enableAndTest() {
    if (running.current) return
    const context = connection.current
    if (!context) {
      window.location.reload()
      return
    }
    running.current = true
    try {
      // Permission is requested directly from the button gesture, before any other await.
      const permission = await Notification.requestPermission()
      const allowedAt = performance.now()
      if (permission !== 'granted') {
        setStatus({
          phase: permission === 'denied' ? 'blocked' : 'ready',
          message: permission === 'denied'
            ? '알림이 차단됐어요. 기기 설정에서 알림을 허용한 뒤 다시 확인해 주세요.'
            : '알림 권한이 허용되지 않았어요. 준비되면 다시 눌러 주세요.',
        })
        return
      }
      setStatus({ phase: 'waiting', message: '이 기기의 알림을 연결하고 있어요.' })
      let subscription = await context.registration.pushManager.getSubscription()
      if (subscription && (renewSubscription.current || !usesKey(subscription, context.key))) {
        await subscription.unsubscribe()
        subscription = null
      }
      subscription ??= await context.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: context.key,
      })
      renewSubscription.current = false
      await sendTest(subscription, allowedAt)
    } catch (error) {
      setStatus({ phase: 'error', message: error instanceof Error ? error.message : '알림 구독에 실패했습니다.' })
    } finally {
      running.current = false
    }
  }

  const disabled = ['loading', 'waiting', 'blocked', 'unsupported'].includes(status.phase)
  const buttonLabel = status.phase === 'loading' ? '연결 확인 중'
    : status.phase === 'waiting' ? '알림 전송 중'
    : status.phase === 'ready' ? '알림 허용하고 테스트'
    : status.phase === 'blocked' ? '알림 권한을 확인해 주세요'
    : status.phase === 'unsupported' ? '지원 환경에서 열어 주세요'
    : ['accepted', 'received'].includes(status.phase) ? '3초 후 알림 다시 받기' : '다시 시도'

  return (
    <section className="py-8 text-gray-900">
      <p className="mb-3 text-sm font-semibold text-gray-500">푸시 알림 테스트</p>
      <h1 className="text-3xl font-bold leading-tight">3초 뒤,<br />알림이 도착해요.</h1>
      <p className="mt-4 text-sm leading-6 text-gray-600">
        처음에는 알림을 허용해 주세요. 이미 연결된 기기는 이 화면에 접속하면 자동으로 테스트합니다.
      </p>

      <div className={`mt-8 rounded-2xl border p-5 ${status.phase === 'received'
        ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <p className="text-sm font-semibold">{status.phase === 'received' ? '푸시 수신 완료' : '현재 상태'}</p>
        <p role="status" aria-live="polite" className="mt-2 text-sm leading-6">{status.message}</p>
      </div>

      <button type="button" onClick={enableAndTest} disabled={disabled}
        className="mt-5 min-h-12 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900">
        {buttonLabel}
      </button>

      <div className="mt-8 space-y-3 text-xs leading-5 text-gray-500">
        <p>iPhone·iPad는 iOS 16.4 이상에서 Safari로 홈 화면에 추가한 뒤, 추가된 앱으로 실행해 주세요.</p>
        <p>처음 연결할 때와 네트워크·기기 상황에 따라 3초보다 늦게 도착할 수 있어요. 방해금지 모드와 기기의 알림 설정도 확인해 주세요.</p>
        <p>이 화면의 전송 완료는 푸시 서비스의 접수 상태입니다. 실제 수신 시 상태가 ‘푸시 수신 완료’로 바뀝니다.</p>
      </div>
    </section>
  )
}
