import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto'
import type { PushSubscription } from 'web-push'

export const DEFAULT_OPEN_PUSH_AT = '2026-09-26T18:10:00+09:00'
export const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export function isSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== 'object') return false
  const subscription = value as Partial<PushSubscription>
  if (typeof subscription.endpoint !== 'string' || subscription.endpoint.length > 2048) return false
  try {
    const url = new URL(subscription.endpoint)
    const hostAllowed = url.hostname === 'fcm.googleapis.com' || url.hostname.endsWith('.push.services.mozilla.com')
      || url.hostname === 'web.push.apple.com' || url.hostname.endsWith('.notify.windows.com')
    if (!hostAllowed || url.protocol !== 'https:' || url.port || url.username || url.password || url.hash) return false
  } catch { return false }
  const validKey = (key: unknown, size: number) => typeof key === 'string' && /^[A-Za-z0-9_-]+={0,2}$/.test(key) && Buffer.from(key, 'base64url').length === size
  return validKey(subscription.keys?.auth, 16) && validKey(subscription.keys?.p256dh, 65)
}

export function scheduleConfig() {
  const rawDate = process.env.PUSH_OPEN_AT || DEFAULT_OPEN_PUSH_AT
  const sendAt = Date.parse(rawDate)
  const origin = new URL(process.env.PUSH_PUBLIC_ORIGIN || 'https://yufesta.com')
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(rawDate) || !Number.isFinite(sendAt) || origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Invalid push configuration')
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const token = process.env.QSTASH_TOKEN
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!publicKey || !privateKey || !token || !currentSigningKey || !nextSigningKey) throw new Error('Missing push configuration')
  const mode = process.env.PUSH_OPEN_MODE || 'test'
  if (mode !== 'test' && mode !== 'opening') throw new Error('Invalid push mode')
  return { sendAt, publicKey, privateKey, token, currentSigningKey, nextSigningKey, origin: origin.origin, callback: `${origin.origin}/api/open-notification-deliver`, mode: mode as 'test' | 'opening' }
}

export type ScheduledPush = { subscription: PushSubscription; sendAt: number; mode: 'test' | 'opening' }
function encryptionKey(secret: string) {
  // Derive a separate encryption key; the VAPID private key never leaves Vercel.
  return Buffer.from(hkdfSync('sha256', secret, 'yufesta-push', 'scheduled-subscription-v1', 32))
}
export function sealJob(job: ScheduledPush, secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(job), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}
export function openJob(value: string, secret: string): ScheduledPush {
  const bytes = Buffer.from(value, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(secret), bytes.subarray(0, 12))
  decipher.setAuthTag(bytes.subarray(12, 28))
  const job = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8')) as ScheduledPush
  if (!isSubscription(job.subscription) || !Number.isFinite(job.sendAt) || !['test', 'opening'].includes(job.mode)) throw new Error('Invalid scheduled push')
  return job
}
export const subscriptionId = (subscription: PushSubscription, sendAt: number) => createHash('sha256').update(`${sendAt}:${subscription.endpoint}:${subscription.keys.p256dh}`).digest('hex')
