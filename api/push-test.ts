import { setTimeout as delay } from 'node:timers/promises'
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'

const json = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
})

function isSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== 'object') return false
  const subscription = value as Partial<PushSubscription>
  if (typeof subscription.endpoint !== 'string' || subscription.endpoint.length > 2048) return false

  try {
    const endpoint = new URL(subscription.endpoint)
    const allowedHost = endpoint.hostname === 'fcm.googleapis.com'
      || endpoint.hostname.endsWith('.push.services.mozilla.com')
      || endpoint.hostname === 'web.push.apple.com'
      || endpoint.hostname.endsWith('.notify.windows.com')
    if (!allowedHost || endpoint.protocol !== 'https:' || endpoint.port
      || endpoint.username || endpoint.password || endpoint.hash) return false
  } catch {
    return false
  }

  const validKey = (key: unknown, bytes: number) => typeof key === 'string'
    && /^[A-Za-z0-9_-]+={0,2}$/.test(key)
    && Buffer.from(key, 'base64url').length === bytes

  return validKey(subscription.keys?.auth, 16) && validKey(subscription.keys?.p256dh, 65)
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } })
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    if (!publicKey || !privateKey) {
      return json({ error: '푸시 테스트 서버 설정이 필요합니다. 배포 환경의 VAPID 키를 확인해 주세요.' }, 503)
    }

    if (request.method === 'GET') return json({ publicKey })

    const origin = new URL(request.url).origin
    if (request.headers.get('origin') !== origin) {
      return json({ error: '같은 사이트에서만 알림 테스트를 요청할 수 있습니다.' }, 403)
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) {
      return json({ error: '올바른 형식으로 요청해 주세요.' }, 415)
    }

    let body: { subscription?: unknown; delayMs?: unknown; testId?: unknown }
    try {
      const text = await request.text()
      if (text.length > 4096) return json({ error: '요청 크기가 너무 큽니다.' }, 413)
      const parsed: unknown = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid body')
      body = parsed
    } catch {
      return json({ error: '요청 내용을 읽을 수 없습니다.' }, 400)
    }

    if (!isSubscription(body.subscription)
      || typeof body.testId !== 'string'
      || !/^[0-9a-f-]{36}$/i.test(body.testId)
      || typeof body.delayMs !== 'number'
      || !Number.isFinite(body.delayMs)
      || body.delayMs < 0 || body.delayMs > 3000) {
      return json({ error: '알림 구독 정보 또는 대기 시간이 올바르지 않습니다.' }, 400)
    }

    // The server waits so the notification can still arrive after the page is backgrounded.
    await delay(body.delayMs)

    try {
      await webpush.sendNotification(body.subscription, JSON.stringify({
        title: 'YU FESTA 테스트 알림',
        body: 'Web Push가 정상적으로 도착했어요!',
        testId: body.testId,
        url: '/',
      }), {
        TTL: 60,
        urgency: 'high',
        timeout: 10000,
        vapidDetails: {
          subject: process.env.VAPID_SUBJECT || origin,
          publicKey,
          privateKey,
        },
      })
      // Push service acceptance does not guarantee that the OS displayed a banner.
      return json({ accepted: true, testId: body.testId })
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        return json({ error: '알림 구독이 만료됐습니다. 버튼을 눌러 다시 연결해 주세요.' }, 410)
      }
      return json({ error: '푸시 전송에 실패했습니다. 서버 설정과 네트워크를 확인해 주세요.' }, 502)
    }
  },
}
