import { Client } from '@upstash/qstash'
import { isSubscription, json, scheduleConfig, sealJob, subscriptionId } from '../server/pushSchedule.ts'

export default {
  async fetch(request: Request): Promise<Response> {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } })
    let config: ReturnType<typeof scheduleConfig>
    try { config = scheduleConfig() }
    catch { return json({ error: '오픈 알림 신청을 준비하고 있어요. 잠시 후 다시 확인해 주세요.' }, 503) }
    const remaining = config.sendAt - Date.now()
    const accepting = remaining > 10_000 && remaining <= 7 * 24 * 60 * 60 * 1000
    if (request.method === 'GET') return json({ publicKey: config.publicKey, sendAt: new Date(config.sendAt).toISOString(), accepting, mode: config.mode })
    if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: '같은 사이트에서만 알림을 신청할 수 있어요.' }, 403)
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: '요청 형식을 확인해 주세요.' }, 415)
    if (!accepting) return json({ error: remaining <= 10_000 ? '예약 시각이 지나거나 임박해 알림 신청이 마감됐어요.' : '알림 신청은 발송 7일 전부터 가능해요.' }, 409)
    let body: { subscription?: unknown }
    try {
      const text = await request.text()
      if (text.length > 4096) return json({ error: '요청 크기가 너무 커요.' }, 413)
      body = JSON.parse(text)
      if (!body || !isSubscription(body.subscription)) return json({ error: '알림 구독 정보가 올바르지 않아요.' }, 400)
    } catch { return json({ error: '알림 구독 정보를 읽지 못했어요.' }, 400) }
    // Runtime validation above ensures only supported browser push services are queued.
    if (!isSubscription(body.subscription)) return json({ error: '알림 구독 정보가 올바르지 않아요.' }, 400)
    try {
      const client = new Client({ token: config.token, retry: { retries: 0 } })
      const queued = await client.publishJSON({
        url: config.callback,
        body: { job: sealJob({ subscription: body.subscription, sendAt: config.sendAt, mode: config.mode }, config.privateKey) },
        notBefore: Math.ceil(config.sendAt / 1000),
        deduplicationId: subscriptionId(body.subscription, config.sendAt),
        retries: 3,
      })
      if (!queued.messageId) throw new Error('Missing queued message identifier')
      return json({ accepted: true, sendAt: new Date(config.sendAt).toISOString() }, 202)
    } catch { return json({ error: '예약을 저장하지 못했어요. 다시 시도해 주세요.' }, 502) }
  },
}
