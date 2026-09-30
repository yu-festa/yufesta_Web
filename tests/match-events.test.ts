import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { connectMatchEvents } from '../src/utils/matchEvents.ts'
import { matchDeadline, matchServerTime } from '../src/utils/matchClock.ts'
import type { MatchSummary } from '../src/api/match.ts'

class Source extends EventTarget {
  static CLOSED = 2
  static instances: Source[] = []
  readyState = 0
  closed = false
  url: string
  options: EventSourceInit
  constructor(url: string, options: EventSourceInit) { super(); this.url = url; this.options = options; Source.instances.push(this) }
  close() { this.readyState = 2; this.closed = true }
  emit(name: string) { this.dispatchEvent(new Event(name)) }
}
const original = { source: globalThis.EventSource, fetch: globalThis.fetch, random: Math.random }
let connection: ReturnType<typeof connectMatchEvents> | undefined
const settle = async () => { for (let n = 0; n < 8; n++) await Promise.resolve() }
beforeEach(() => {
  Source.instances = []
  globalThis.EventSource = Source as unknown as typeof EventSource
  Math.random = () => 0.5
})
afterEach(() => {
  connection?.close()
  connection = undefined
  globalThis.EventSource = original.source
  globalThis.fetch = original.fetch
  Math.random = original.random
})

test('connected는 즉시 조회하고 회차 이벤트는 0~3초 지연하며 발표 신호를 합친다', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  const calls: boolean[] = []
  connection = connectMatchEvents('/sse', result => calls.push(result), () => true)
  const source = Source.instances[0]
  assert.deepEqual(source.options, { withCredentials: true })
  source.emit('connected')
  assert.deepEqual(calls, [true])
  source.emit('round-opened')
  source.emit('round-published')
  source.emit('round-closed')
  source.emit('message') // 하트비트는 조회하지 않음
  context.mock.timers.tick(1499)
  assert.deepEqual(calls, [true])
  context.mock.timers.tick(1)
  assert.deepEqual(calls, [true, true])
  source.emit('round-opened')
  context.mock.timers.tick(1500)
  assert.deepEqual(calls, [true, true, false])
  source.emit('round-published')
  connection.close()
  context.mock.timers.tick(100000)
  assert.equal(calls.length, 3)
  assert.equal(source.closed, true)
})

test('일반 연결 끊김은 네이티브 재연결에 맡기며 폴링하지 않는다', context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  let calls = 0
  globalThis.fetch = async () => { throw new Error('프로브를 호출하면 안 됩니다') }
  connection = connectMatchEvents('/sse', () => { calls++ }, () => true)
  const source = Source.instances[0]
  source.emit('error') // CONNECTING
  context.mock.timers.tick(60000)
  assert.equal(calls, 0)
  assert.equal(Source.instances.length, 1)
  source.emit('connected')
  assert.equal(calls, 1)
})

test('HTTP 503 확인 시에만 30초 폴링하고 정상 재연결 시 폴링을 종료한다', async context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  let calls = 0
  let visible = true
  globalThis.fetch = async (_, init) => {
    assert.equal(init?.credentials, 'include')
    assert.equal(new Headers(init?.headers).get('Accept'), 'text/event-stream')
    return new Response(null, { status: 503 })
  }
  connection = connectMatchEvents('/sse', () => { calls++ }, () => visible)
  Source.instances[0].readyState = 2
  Source.instances[0].emit('error')
  await settle()
  context.mock.timers.tick(29999)
  assert.equal(calls, 0)
  context.mock.timers.tick(1)
  assert.equal(calls, 1)
  visible = false
  context.mock.timers.tick(30000)
  assert.equal(calls, 1)
  Source.instances.at(-1)!.emit('connected')
  assert.equal(calls, 2)
  visible = true
  context.mock.timers.tick(60000)
  assert.equal(calls, 2)
})

test('401·500·네트워크 오류를 연결 수 초과로 취급하지 않는다', async context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  for (const status of [401, 500, 0]) {
    let calls = 0
    globalThis.fetch = async () => { if (!status) throw new Error('offline'); return new Response(null, { status }) }
    connection = connectMatchEvents('/sse', () => { calls++ }, () => true)
    const source = Source.instances.at(-1)!
    source.readyState = 2
    source.emit('error')
    await settle()
    context.mock.timers.tick(60000)
    assert.equal(calls, 0)
    connection.close()
  }
})

test('화면을 떠난 뒤 도착한 503 응답이 폴링을 시작하지 않는다', async context => {
  context.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] })
  let finish!: (response: Response) => void
  globalThis.fetch = () => new Promise(resolve => { finish = resolve })
  let calls = 0
  connection = connectMatchEvents('/sse', () => { calls++ }, () => true)
  Source.instances[0].readyState = 2
  Source.instances[0].emit('error')
  connection.close()
  finish(new Response(null, { status: 503 }))
  await settle()
  context.mock.timers.tick(60000)
  assert.equal(calls, 0)
})

test('서버 시각에 단조 증가 경과 시간을 더하고 회차 상태별 다음 경계를 선택한다', () => {
  const summary: MatchSummary = { serverNow: '2026-10-02T15:00:00', currentRound: { seq: 1, status: 'OPEN', openAt: '2026-10-02T14:00:00', closeAt: '2026-10-02T15:50:00', publishAt: '2026-10-02T16:00:00' }, nextRound: null, my: null, applicantCount: 0 }
  assert.equal(matchServerTime(summary, 100, 5100), Date.parse('2026-10-02T06:00:05Z'))
  assert.equal(matchDeadline(summary)?.at, Date.parse('2026-10-02T06:50:00Z'))
  assert.equal(matchDeadline({ ...summary, currentRound: { ...summary.currentRound, status: 'SCHEDULED' } })?.at, Date.parse('2026-10-02T05:00:00Z'))
  assert.equal(matchDeadline({ ...summary, currentRound: { ...summary.currentRound, status: 'CLOSED' } })?.at, Date.parse('2026-10-02T07:00:00Z'))
  assert.equal(matchDeadline({ ...summary, currentRound: { ...summary.currentRound, status: 'PUBLISHED' } }), null)
})
