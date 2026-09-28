import { Receiver } from '@upstash/qstash'
import { json } from '../server/pushSchedule.ts'
import { noticeConfig, pollNotices, RedisNoticeStore } from '../server/noticePush.ts'

export const maxDuration = 60
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })
    // A paused campaign must not consume retry attempts.
    if (process.env.NOTICE_PUSH_ENABLED !== 'true') return json({ skipped: 'disabled' })
    let config: ReturnType<typeof noticeConfig>
    try { config = noticeConfig() }
    catch { return json({ error: 'Notice push configuration unavailable' }, 503) }
    const signature = request.headers.get('upstash-signature')
    if (!signature || new URL(request.url).href !== config.callback) return json({ error: 'Unauthorized' }, 401)
    const body = await request.text()
    if (body.length > 4096) return json({ error: 'Payload too large' }, 413)
    try {
      const receiver = new Receiver({ currentSigningKey: config.currentSigningKey, nextSigningKey: config.nextSigningKey, devMode: false })
      if (!await receiver.verify({ signature, body, url: config.callback })) return json({ error: 'Unauthorized' }, 401)
    } catch { return json({ error: 'Unauthorized' }, 401) }
    try { return json(await pollNotices(config, new RedisNoticeStore(config))) }
    catch { return json({ error: 'Notice poll failed; pending deliveries are retained' }, 503) }
  },
}
