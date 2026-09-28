import { randomUUID } from 'node:crypto'
import { isSubscription, json } from '../server/pushSchedule.ts'
import { fetchNotices, noticeConfig, RedisNoticeStore, sealSubscriber, subscriberId } from '../server/noticePush.ts'

export default {
  async fetch(request: Request): Promise<Response> {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } })
    let config: ReturnType<typeof noticeConfig>
    try { config = noticeConfig() }
    catch { return json({ error: '공지 알림을 준비하고 있어요. 잠시 후 다시 확인해 주세요.' }, 503) }
    if (request.method === 'GET') return json({ publicKey: config.publicKey })
    if (request.headers.get('origin') !== config.origin || new URL(request.url).origin !== config.origin) return json({ error: '같은 사이트에서만 알림을 설정할 수 있어요.' }, 403)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: '요청 형식을 확인해 주세요.' }, 415)
    let body: { action?: string; subscription?: unknown }
    try {
      const text = await request.text()
      if (text.length > 4096) return json({ error: '요청 크기가 너무 커요.' }, 413)
      body = JSON.parse(text)
      if (!body || !['status', 'subscribe', 'unsubscribe'].includes(body.action ?? '') || !isSubscription(body.subscription)) return json({ error: '알림 구독 정보가 올바르지 않아요.' }, 400)
    } catch { return json({ error: '알림 구독 정보를 읽지 못했어요.' }, 400) }
    if (!isSubscription(body.subscription)) return json({ error: '알림 구독 정보가 올바르지 않아요.' }, 400)
    try {
      const store = new RedisNoticeStore(config)
      const id = subscriberId(body.subscription)
      const existing = await store.get(id)
      if (body.action === 'status') return json({ subscribed: existing !== null })
      if (body.action === 'unsubscribe') {
        if (existing !== null) await store.remove(id, existing)
        return json({ subscribed: false })
      }
      if (existing === null) {
        const since = Math.floor(Date.now() / 1000) * 1000
        const notices = await fetchNotices(config)
        await store.initialize(notices)
        await store.add(id, sealSubscriber({ subscription: body.subscription, since, baseline: notices.map(notice => notice.id), version: randomUUID() }, config.privateKey))
      }
      return json({ subscribed: true })
    } catch { return json({ error: '공지 알림 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.' }, 502) }
  },
}
