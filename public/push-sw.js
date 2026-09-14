self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data?.json() || {}
  } catch {
    // Even a malformed push must result in a visible notification.
  }

  const testId = typeof payload.testId === 'string' ? payload.testId : 'unknown'
  event.waitUntil((async () => {
    await self.registration.showNotification(
      typeof payload.title === 'string' ? payload.title : 'YU FESTA 테스트 알림',
      {
        body: typeof payload.body === 'string' ? payload.body : '푸시 알림을 받았습니다.',
        icon: '/pwa-192x192.png',
        tag: `yu-festa-push-test-${testId}`,
        data: { testId },
      },
    )

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const window of windows) {
      window.postMessage({ type: 'PUSH_TEST_RECEIVED', testId })
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const home = windows.find(window => new URL(window.url).pathname === '/')
    if (home) return home.focus()
    return self.clients.openWindow('/')
  })())
})
