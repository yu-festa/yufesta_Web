// 이벤트 본문은 신뢰하지 않고, 최신 상태를 다시 조회하는 신호로만 사용합니다.
export function connectMatchEvents(url: string, refresh: (results: boolean) => void, visible: () => boolean) {
  let disposed = false
  let source: EventSource | null = null
  let delay: ReturnType<typeof setTimeout> | undefined
  let polling: ReturnType<typeof setInterval> | undefined
  let includeResults = false
  let probe: AbortController | null = null

  function clearDelay() {
    clearTimeout(delay)
    delay = undefined
  }

  function stopPolling() {
    clearInterval(polling)
    polling = undefined
  }

  function connect() {
    if (disposed) return
    source?.close()
    const current = new EventSource(url, { withCredentials: true })
    source = current
    const alive = () => !disposed && source === current
    current.addEventListener('connected', () => {
      if (!alive()) return
      probe?.abort()
      stopPolling()
      clearDelay()
      includeResults = false
      // 재연결 사이에 놓친 발표도 확인합니다.
      refresh(true)
    })
    for (const event of ['round-opened', 'round-closed', 'round-published']) {
      current.addEventListener(event, () => {
        if (!alive()) return
        includeResults ||= event === 'round-published'
        if (delay !== undefined) return
        delay = setTimeout(() => {
          delay = undefined
          if (!alive()) return
          const results = includeResults
          includeResults = false
          refresh(results)
        }, Math.random() * 3000)
      })
    }
    current.addEventListener('error', () => {
      // 일반 끊김(CONNECTING)은 브라우저의 자동 재연결에 맡깁니다.
      if (!alive() || current.readyState !== EventSource.CLOSED || probe) return
      const controller = new AbortController()
      probe = controller
      const timeout = setTimeout(() => controller.abort(), 10000)
      // 네이티브 EventSource의 error에는 HTTP 상태가 없습니다. 연결이 완전히
      // 닫힌 경우에만 헤더를 재확인하고 스트림 본문을 읽지 않고 즉시 중단합니다.
      void fetch(url, { credentials: 'include', headers: { Accept: 'text/event-stream' }, cache: 'no-store', signal: controller.signal })
        .then(response => {
          const status = response.status
          controller.abort()
          if (probe === controller) probe = null
          if (!alive()) return
          if (status === 503) {
            current.close()
            if (polling === undefined) polling = setInterval(() => {
              if (!visible()) return
              refresh(true)
              connect()
            }, 30000)
          } else if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
            // 확인 요청 시점에 서버가 복구되었다면 정상 EventSource로 돌아갑니다.
            connect()
          }
        }).catch(() => { /* 네트워크·CORS 오류를 503으로 오인하지 않습니다. */ })
        .finally(() => { clearTimeout(timeout); if (probe === controller) probe = null })
    })
  }

  connect()
  return {
    reconnect() { if (!disposed && source?.readyState === EventSource.CLOSED && polling === undefined) connect() },
    close() {
      disposed = true
      clearDelay()
      stopPolling()
      probe?.abort()
      source?.close()
    },
  }
}
