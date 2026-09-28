function notificationTarget(value) {
  if (value === '/main') return value
  const match = typeof value === 'string' && /^\/main#notices\/([1-9]\d*)$/.exec(value)
  return match && Number.isSafeInteger(Number(match[1])) ? value : '/'
}

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data?.json() || {}
  } catch {
    // Even a malformed push must result in a visible notification.
  }

  const testId = typeof payload.testId === 'string' ? payload.testId : 'unknown'
  const isOpening = payload.type === 'FESTIVAL_OPEN'
  const isNotice = payload.type === 'FESTIVAL_NOTICE' && Number.isSafeInteger(payload.noticeId) && payload.noticeId > 0
  const url = isNotice ? `/main#notices/${payload.noticeId}` : isOpening || payload.url === '/main' ? '/main' : '/'
  event.waitUntil((async () => {
    await self.registration.showNotification(
      typeof payload.title === 'string' ? payload.title : 'YU FESTA',
      {
        body: typeof payload.body === 'string' ? payload.body : '푸시 알림을 받았습니다.',
        icon: '/pwa-yufesta-v2-192x192.png',
        tag: isNotice ? `yu-festa-notice-${payload.noticeId}` : isOpening ? 'yu-festa-festival-open' : `yu-festa-push-test-${testId}`,
        data: { testId, url },
      },
    )

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const window of windows) {
      window.postMessage(isNotice ? { type: 'FESTIVAL_NOTICE_RECEIVED', noticeId: payload.noticeId } : isOpening ? { type: 'FESTIVAL_OPEN_RECEIVED' } : { type: 'PUSH_TEST_RECEIVED', testId })
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const target = notificationTarget(event.notification.data?.url)
    const home = windows.find(window => { const url = new URL(window.url); return `${url.pathname}${url.hash}` === target })
    if (home) return home.focus()
    const existing = windows.find(window => typeof window.navigate === 'function')
    if (existing) {
      try {
        const navigated = await existing.navigate(target)
        if (navigated) return navigated.focus()
      } catch {
        // A closed or unavailable window is replaced with a new app window.
      }
    }
    return self.clients.openWindow(target)
  })())
})
