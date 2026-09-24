import { Component } from 'react'
import type { ReactNode } from 'react'

export default class MapLoadBoundary extends Component<{ children: ReactNode; onBack: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-[#192135]">지도 화면을 불러오지 못했어요</h1>
      <p role="alert" className="text-sm leading-6 text-[#63708a]">페이지가 업데이트되었거나 연결이 끊겼을 수 있어요.<br />새로고침한 뒤 다시 확인해 주세요.</p>
      <button type="button" className="rounded-xl bg-[#1554ff] px-6 py-3 text-sm font-semibold text-white" onClick={() => window.location.reload()}>새로고침</button>
      <button type="button" className="px-6 py-3 text-sm text-[#63708a]" onClick={this.props.onBack}>돌아가기</button>
    </main>
  }
}
