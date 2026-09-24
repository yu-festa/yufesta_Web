import type { ProxyOptions } from 'vite'

export function createApiProxy(target: string): ProxyOptions {
  const upstream = new URL(target)
  return {
    target: upstream.origin,
    changeOrigin: true,
    // 서버 쿠키를 로컬 호스트에 한정합니다. Secure/HttpOnly/SameSite는 유지합니다.
    cookieDomainRewrite: '',
    configure(proxy) {
      proxy.on('proxyReq', (outgoing, incoming) => {
        // 브라우저→Vite가 동일 출처인 경우에만 upstream의 동일 출처 요청으로 전달합니다.
        // 다른 사이트에서 온 Origin은 덮어쓰지 않아 서버가 그대로 검사합니다.
        const origin = incoming.headers.origin
        if (!origin) return
        try {
          if (new URL(origin).host === incoming.headers.host) outgoing.setHeader('Origin', upstream.origin)
        } catch { /* 잘못된 Origin도 원래 값으로 전달하여 서버가 거부하게 합니다. */ }
      })
    },
  }
}
