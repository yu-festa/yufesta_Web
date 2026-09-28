import { Client } from '@upstash/qstash'
import { noticeConfig, RedisNoticeStore } from '../server/noticePush.ts'

// Run explicitly after configuring and deploying the production endpoints.
const config = noticeConfig()
if (!process.env.QSTASH_TOKEN) throw new Error('QSTASH_TOKEN is required')
const publicResponse = await fetch(`${config.origin}/api/notice-notification`, { redirect: 'error', signal: AbortSignal.timeout(10000) })
if (!publicResponse.ok || (await publicResponse.json()).publicKey !== config.publicKey) throw new Error('Deploy and configure the notice API before creating its schedule')
const store = new RedisNoticeStore(config)
if (await store.command('PING') !== 'PONG') throw new Error('Check the Redis connection')
const client = new Client({ token: process.env.QSTASH_TOKEN })
const schedule = await client.schedules.create({
  scheduleId: config.namespace.slice(1, -1), destination: config.callback,
  cron: '*/5 * * * *', method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' }, retries: 1,
})
console.log(`공지 확인 예약 설정 완료: ${schedule.scheduleId} (5분 주기)`)
