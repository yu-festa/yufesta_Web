import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import { createServer } from 'vite'
import { createApiProxy } from '../dev/apiProxy.ts'
import { apiOrigin, apiRequestBase } from '../src/utils/apiConfig.ts'

test('개발 API만 동일 출처로 보내고 배포·OAuth 서버 주소는 유지한다', () => {
  const env = { DEV: true, VITE_API_BASE_URL: ' https://api.yufesta.com/ ' }
  assert.equal(apiRequestBase(env), '')
  assert.equal(apiOrigin(env), 'https://api.yufesta.com')
  assert.equal(apiRequestBase({ ...env, DEV: false }), 'https://api.yufesta.com')
  assert.equal(apiRequestBase({ ...env, VITE_DEV_API_PROXY: 'false' }), 'https://api.yufesta.com')
  assert.equal(apiRequestBase(), 'https://api.yufesta.com')
})

test('실제 Vite 프록시가 쿠키 도메인만 바꾸고 CSRF 헤더·익명 쿠키를 왕복시킨다', async t => {
  const upstream = createHttpServer(async (req, res) => {
    if (req.url === '/api/v1/auth/csrf') {
      res.setHeader('Set-Cookie', ['XSRF-TOKEN=test-token; Domain=yufesta.com; Path=/; Secure; SameSite=Lax', 'anon_key=anonymous; Domain=yufesta.com; Path=/; Secure; HttpOnly; SameSite=Lax'])
      res.writeHead(204).end()
      return
    }
    if (req.method === 'POST' && (!req.headers.cookie?.includes('XSRF-TOKEN=test-token') || req.headers['x-xsrf-token'] !== 'test-token')) {
      res.writeHead(403).end()
      return
    }
    let body = ''
    for await (const chunk of req) body += chunk
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ path: req.url, origin: req.headers.origin, host: req.headers.host, cookie: req.headers.cookie, body }))
  })
  upstream.listen(0, '127.0.0.1')
  await once(upstream, 'listening')
  t.after(() => new Promise<void>((resolve, reject) => upstream.close(error => error ? reject(error) : resolve())))
  const upstreamAddress = upstream.address()
  if (!upstreamAddress || typeof upstreamAddress === 'string') throw new Error('missing upstream port')
  const upstreamOrigin = `http://127.0.0.1:${upstreamAddress.port}`
  const vite = await createServer({ configFile: false, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, proxy: { '/api/v1': createApiProxy(upstreamOrigin) } } })
  t.after(() => vite.close())
  await vite.listen()
  const address = vite.httpServer?.address()
  if (!address || typeof address === 'string') throw new Error('missing proxy port')
  const local = `http://127.0.0.1:${address.port}`
  const csrf = await fetch(`${local}/api/v1/auth/csrf`)
  assert.equal(csrf.status, 204)
  const cookies = csrf.headers.getSetCookie()
  assert.equal(cookies.length, 2)
  assert.ok(cookies.every(cookie => !/domain=/i.test(cookie)))
  assert.ok(cookies.every(cookie => /secure/i.test(cookie) && /SameSite=Lax/.test(cookie)))
  assert.ok(cookies[1].includes('HttpOnly'))
  const cookie = cookies.map(value => value.split(';')[0]).join('; ')
  const blocked = await fetch(`${local}/api/v1/cheers`, { method: 'POST', headers: { Cookie: cookie, Origin: local } })
  assert.equal(blocked.status, 403)
  const written = await fetch(`${local}/api/v1/cheers`, { method: 'POST', headers: { Cookie: cookie, Origin: local, 'X-XSRF-TOKEN': 'test-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ content: '익명 응원' }) })
  assert.equal(written.status, 200)
  const echo = await written.json()
  assert.equal(echo.path, '/api/v1/cheers')
  assert.equal(echo.origin, upstreamOrigin)
  assert.equal(echo.host, new URL(upstreamOrigin).host)
  assert.ok(echo.cookie.includes('anon_key=anonymous'))
  assert.deepEqual(JSON.parse(echo.body), { content: '익명 응원' })
  const external = await fetch(`${local}/api/v1/cheers`, { headers: { Origin: 'https://unrelated.example' } })
  assert.equal((await external.json()).origin, 'https://unrelated.example')
})
