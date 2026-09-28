import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, randomUUID } from 'node:crypto'
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'
import { isSubscription } from './pushSchedule.ts'

export type Notice = { id: number; title: string; body: string; createdAt: string }
export type PendingNotice = Notice & { observedAt: number }
export type PollState = { seen: number[]; pending: PendingNotice[] }
export type Subscriber = { subscription: PushSubscription; since: number; baseline: number[]; version: string }
export type NoticeConfig = ReturnType<typeof noticeConfig>
export const noticeTime = (value: string) => Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}+09:00`)
export const subscriberId = (subscription: PushSubscription) => createHash('sha256').update(JSON.stringify([subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh])).digest('hex')

function httpsOrigin(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid origin')
  return url.origin
}
export function noticeConfig() {
  if (process.env.NOTICE_PUSH_ENABLED !== 'true') throw new Error('Notice push disabled')
  const origin = httpsOrigin(process.env.PUSH_PUBLIC_ORIGIN || 'https://yufesta.com')
  const apiOrigin = httpsOrigin(process.env.NOTICE_API_ORIGIN || 'https://api.yufesta.com')
  const redisUrl = httpsOrigin(process.env.UPSTASH_REDIS_REST_URL || '')
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!redisToken || !publicKey || !privateKey || !currentSigningKey || !nextSigningKey) throw new Error('Missing notice push configuration')
  return { origin, apiOrigin, redisUrl, redisToken, publicKey, privateKey, currentSigningKey, nextSigningKey,
    callback: `${origin}/api/notice-notification-poll`,
    namespace: `{yufesta-notices-${createHash('sha256').update(origin).digest('hex').slice(0, 12)}}`,
  }
}

function encryptionKey(secret: string) {
  return Buffer.from(hkdfSync('sha256', secret, 'yufesta-notices', 'subscriber-v1', 32))
}
export function sealSubscriber(value: Subscriber, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}
export function openSubscriber(value: string, secret: string): Subscriber {
  const bytes = Buffer.from(value, 'base64url')
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), bytes.subarray(0, 12))
  cipher.setAuthTag(bytes.subarray(12, 28))
  const result = JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8')) as Subscriber
  if (!isSubscription(result.subscription) || !Number.isFinite(result.since) || !Array.isArray(result.baseline) || !result.version) throw new Error('Invalid subscriber')
  return result
}

export async function fetchNotices(config: NoticeConfig): Promise<Notice[]> {
  const response = await fetch(`${config.apiOrigin}/api/v1/notices?size=50`, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('Notice API unavailable')
  const payload = await response.json() as { data?: unknown }
  if (!Array.isArray(payload.data) || payload.data.length > 50) throw new Error('Invalid notice list')
  const notices = payload.data as Notice[]
  if (notices.some(notice => !notice || !Number.isSafeInteger(notice.id) || notice.id <= 0 || typeof notice.title !== 'string' || typeof notice.body !== 'string' || typeof notice.createdAt !== 'string' || !Number.isFinite(noticeTime(notice.createdAt))) || new Set(notices.map(notice => notice.id)).size !== notices.length) throw new Error('Invalid notice')
  return notices.sort((a, b) => noticeTime(a.createdAt) - noticeTime(b.createdAt) || a.id - b.id)
}

export interface NoticeStore {
  initialize(notices: Notice[]): Promise<void>
  state(): Promise<PollState | null>
  save(state: PollState, owner: string): Promise<void>
  acquire(owner: string): Promise<boolean>
  release(owner: string): Promise<void>
  subscribers(): Promise<Record<string, string>>
  get(id: string): Promise<string | null>
  add(id: string, value: string): Promise<void>
  remove(id: string, expected: string): Promise<void>
  acknowledged(noticeId: number): Promise<Set<string>>
  acknowledge(noticeId: number, member: string): Promise<void>
}

export class RedisNoticeStore implements NoticeStore {
  config: NoticeConfig
  constructor(config: NoticeConfig) { this.config = config }
  key(suffix: string) { return `${this.config.namespace}:${suffix}` }
  async command<T>(...args: (string | number)[]): Promise<T> {
    const response = await fetch(this.config.redisUrl, {
      method: 'POST', headers: { Authorization: `Bearer ${this.config.redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args), signal: AbortSignal.timeout(4000), redirect: 'error',
    })
    if (!response.ok) throw new Error('Notice storage unavailable')
    const result = await response.json() as { result: T; error?: string }
    if (result.error || !Object.hasOwn(result, 'result')) throw new Error('Notice storage command failed')
    return result.result
  }
  async initialize(notices: Notice[]) { await this.command('SET', this.key('state'), JSON.stringify({ seen: notices.map(notice => notice.id), pending: [] }), 'NX') }
  async state() {
    const value = await this.command<string | null>('GET', this.key('state'))
    return value === null ? null : JSON.parse(value) as PollState
  }
  async save(state: PollState, owner: string) {
    const saved = await this.command<number>('EVAL', "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET', KEYS[2], ARGV[2]) return 1", 2, this.key('lock'), this.key('state'), owner, JSON.stringify(state))
    if (saved !== 1) throw new Error('Notice poll lock expired')
  }
  async acquire(owner: string) { return await this.command('SET', this.key('lock'), owner, 'NX', 'EX', 120) === 'OK' }
  async release(owner: string) { await this.command('EVAL', "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0", 1, this.key('lock'), owner) }
  async subscribers() {
    const values = await this.command<string[]>('HGETALL', this.key('subscribers'))
    const result: Record<string, string> = {}
    for (let index = 0; index < values.length; index += 2) result[values[index]] = values[index + 1]
    return result
  }
  get(id: string) { return this.command<string | null>('HGET', this.key('subscribers'), id) }
  async add(id: string, value: string) { await this.command('HSETNX', this.key('subscribers'), id, value) }
  async remove(id: string, expected: string) { await this.command('EVAL', "if redis.call('HGET', KEYS[1], ARGV[1]) == ARGV[2] then return redis.call('HDEL', KEYS[1], ARGV[1]) end return 0", 1, this.key('subscribers'), id, expected) }
  async acknowledged(noticeId: number) { return new Set(await this.command<string[]>('SMEMBERS', this.key(`sent:${noticeId}`))) }
  async acknowledge(noticeId: number, member: string) {
    await this.command('EVAL', "redis.call('SADD', KEYS[1], ARGV[1]) redis.call('EXPIRE', KEYS[1], 691200) return 1", 1, this.key(`sent:${noticeId}`), member)
  }
}

export async function sendNotice(subscription: PushSubscription, notice: Notice, config: NoticeConfig) {
  await webpush.sendNotification(subscription, JSON.stringify({
    type: 'FESTIVAL_NOTICE', noticeId: notice.id, title: Array.from(notice.title).slice(0, 80).join(''),
    body: Array.from(notice.body.replace(/\s+/g, ' ').trim()).slice(0, 180).join(''), url: `/main#notices/${notice.id}`,
  }), { TTL: 86400, urgency: 'normal', timeout: 5000,
    vapidDetails: { subject: process.env.VAPID_SUBJECT || config.origin, publicKey: config.publicKey, privateKey: config.privateKey } })
}

// One common poll, independent of subscriber count. Acknowledgements survive retries/redeploys.
export async function pollNotices(config: NoticeConfig, store: NoticeStore, dependencies = { fetchNotices, sendNotice, now: Date.now }) {
  const owner = randomUUID()
  if (!await store.acquire(owner)) return { skipped: 'busy' }
  const deadline = dependencies.now() + 35_000
  let sent = 0
  let failed = 0
  let expired = 0
  try {
    const notices = await dependencies.fetchNotices(config)
    const state = await store.state()
    if (!state) { await store.initialize(notices); return { initialized: true, sent: 0 } }
    const known = new Set(state.seen)
    const possibleGap = notices.length === 50 && !notices.some(notice => known.has(notice.id))
    const fresh = notices.filter(notice => !known.has(notice.id))
    for (const notice of fresh) {
      known.add(notice.id)
      state.pending.push({ ...notice, observedAt: dependencies.now() })
    }
    state.seen = [...known]
    if (fresh.length) await store.save(state, owner) // Persist the outbox before any delivery.
    if (!state.pending.length) return { sent: 0, failed: 0, pending: 0, possibleGap }
    const subscribers = Object.entries(await store.subscribers()).map(([id, sealed]) => ({ id, sealed, ...openSubscriber(sealed, config.privateKey) }))
    const remaining: PendingNotice[] = []
    for (let noticeIndex = 0; noticeIndex < state.pending.length; noticeIndex++) {
      if (dependencies.now() >= deadline) { remaining.push(...state.pending.slice(noticeIndex)); break }
      const notice = state.pending[noticeIndex]
      if (dependencies.now() - notice.observedAt >= 7 * 86400_000) { expired++; continue }
      const acknowledged = await store.acknowledged(notice.id)
      const recipients = subscribers.filter(subscriber => noticeTime(notice.createdAt) >= subscriber.since && !subscriber.baseline.includes(notice.id) && !acknowledged.has(`${subscriber.id}:${subscriber.version}`))
      let unfinished = false
      for (let index = 0; index < recipients.length; index += 10) {
        if (dependencies.now() >= deadline) { unfinished = true; break }
        const results = await Promise.allSettled(recipients.slice(index, index + 10).map(async subscriber => {
          // Recheck consent immediately before sending, including unsubscribe/re-subscribe races.
          if (await store.get(subscriber.id) !== subscriber.sealed) return true
          try {
            await dependencies.sendNotice(subscriber.subscription, notice, config)
          } catch (cause) {
            const status = (cause as { statusCode?: number }).statusCode
            if (status === 404 || status === 410) { await store.remove(subscriber.id, subscriber.sealed); return true }
            failed++; return false
          }
          await store.acknowledge(notice.id, `${subscriber.id}:${subscriber.version}`)
          sent++; return true
        }))
        const rejected = results.find(result => result.status === 'rejected')
        if (rejected?.status === 'rejected') throw rejected.reason
        if (results.some(result => result.status === 'fulfilled' && !result.value)) unfinished = true
      }
      if (unfinished) remaining.push(notice)
    }
    state.pending = remaining
    await store.save(state, owner)
    return { sent, failed, expired, pending: remaining.length, possibleGap }
  } finally { await store.release(owner) }
}
