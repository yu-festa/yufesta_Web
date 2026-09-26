import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'
import { json, openJob, scheduleConfig, subscriptionId } from '../server/pushSchedule.ts'

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })
    let config: ReturnType<typeof scheduleConfig>
    try { config = scheduleConfig() }
    catch { return json({ error: 'Push configuration unavailable' }, 503) }
    const body = await request.text()
    if (body.length > 8192) return json({ error: 'Payload too large' }, 413)
    const signature = request.headers.get('upstash-signature')
    if (!signature) return json({ error: 'Unauthorized' }, 401)
    try {
      const receiver = new Receiver({ currentSigningKey: config.currentSigningKey, nextSigningKey: config.nextSigningKey, devMode: false })
      if (!await receiver.verify({ signature, body, url: config.callback })) return json({ error: 'Unauthorized' }, 401)
    } catch { return json({ error: 'Unauthorized' }, 401) }
    let job: ReturnType<typeof openJob>
    try { job = openJob((JSON.parse(body) as { job: string }).job, config.privateKey) }
    catch { return json({ error: 'Invalid payload' }, 400) }
    // Configuration changes invalidate an old campaign instead of sending stale alerts.
    if (job.sendAt !== config.sendAt || job.mode !== config.mode) return json({ skipped: 'campaign-changed' })
    if (Date.now() < job.sendAt) return json({ error: 'Not due yet' }, 425)
    if (Date.now() > job.sendAt + 60 * 60 * 1000) return json({ skipped: 'expired' })
    try {
      await webpush.sendNotification(job.subscription, JSON.stringify({
        type: 'FESTIVAL_OPEN', eventId: subscriptionId(job.subscription, job.sendAt), url: '/main',
        title: job.mode === 'test' ? 'YU FESTA 오픈 알림 테스트' : 'YU FESTA가 열렸어요!',
        body: job.mode === 'test' ? '예약한 알림이 도착했어요. 눌러서 메인 화면을 확인해 보세요.' : '축제 메인 화면이 열렸어요. 지금 확인해 보세요!',
      }), { TTL: 3600, urgency: 'high', timeout: 10000, vapidDetails: { subject: process.env.VAPID_SUBJECT || config.origin, publicKey: config.publicKey, privateKey: config.privateKey } })
      return json({ accepted: true })
    } catch (cause) {
      const status = (cause as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) return json({ skipped: 'subscription-expired' })
      return json({ error: 'Push delivery failed' }, 502)
    }
  },
}
