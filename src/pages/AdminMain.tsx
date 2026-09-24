import { useCallback, useEffect, useState } from 'react'
import HomeLogo from '../components/HomeLogo'
import { Feedback } from '../components/admin/AdminShared'
import { AdminErrorContext, useAdminAction } from '../hooks/useAdminData'
import { getMe } from '../api/auth'
import { isAdminRole } from '../utils/admin'
import AdminRounds from './admin/AdminRounds'
import AdminReports from './admin/AdminReports'
import AdminNotices from './admin/AdminNotices'
import AdminPlaces from './admin/AdminPlaces'
import AdminTimetable from './admin/AdminTimetable'
import AdminClubs from './admin/AdminClubs'
import AdminModeration from './admin/AdminModeration'
import './admin/admin.css'

const tabs = [
  { id: 'rounds', label: '인스타팅', detail: '회차 운영', icon: '♡' },
  { id: 'reports', label: '신고 검토', detail: '안전한 만남', icon: '✓' },
  { id: 'notices', label: '공지', detail: '축제 소식', icon: '≡' },
  { id: 'places', label: '장소 · 이벤트', detail: '축제 지도', icon: '⌖' },
  { id: 'timetable', label: '타임테이블', detail: '공연 일정', icon: '◷' },
  { id: 'clubs', label: '공연 동아리', detail: '출연진 정보', icon: '♫' },
  { id: 'moderation', label: '콘텐츠 관리', detail: '응원 · 분실물', icon: '⚑' },
] as const
type Tab = typeof tabs[number]['id']
const currentTab = (): Tab => tabs.find(tab => `#${tab.id}` === window.location.hash)?.id ?? 'rounds'

export default function AdminMain({ role, onLogout, onAuthError, onRefreshAuth }: {
  role: 'STAFF' | 'OWNER'; onLogout: () => Promise<void>; onAuthError: (status: number) => void; onRefreshAuth: () => Promise<void>
}) {
  const [tab, setTab] = useState<Tab>(currentTab)
  const [accessError, setAccessError] = useState(false)
  const action = useAdminAction()
  const accessFailure = useCallback((status: number) => {
    setAccessError(true)
    onAuthError(status)
  }, [onAuthError])
  useEffect(() => {
    const sync = () => setTab(currentTab())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync) }
  }, [])
  const navigate = (next: Tab) => {
    window.history.pushState(null, '', `/admin#${next}`)
    setTab(next)
    window.scrollTo(0, 0)
  }
  return <div className="admin-shell">
    <header className="admin-header"><div className="admin-header-inner"><HomeLogo onHome={() => navigate('rounds')} /><span className="admin-header-label">운영자 센터</span><button className="admin-logout" disabled={action.busy} onClick={() => void action.run(onLogout, '')}>{action.busy ? '처리 중…' : '로그아웃'}</button></div></header>
    <main className="admin-main">
      <section className="admin-hero"><div><p className="admin-eyebrow">YU FESTA · ADMIN</p><h1>축제의 모든 순간을,<br />함께 준비해요.</h1><p>인스타팅부터 축제 안내까지 한곳에서 관리하세요.</p></div><span className="admin-role">{role === 'OWNER' ? '총괄 운영자' : '운영 스태프'}<small>{role}</small></span></section>
      <nav className="admin-nav" aria-label="운영자 메뉴">{tabs.map(item => <button key={item.id} aria-current={tab === item.id ? 'page' : undefined} className={tab === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><span className="admin-nav-icon" aria-hidden="true">{item.icon}</span><strong>{item.label}</strong><small>{item.detail}</small></button>)}</nav>
      <Feedback error={action.error} />
      <AdminErrorContext.Provider value={accessFailure}>
        {accessError ? <section className="admin-card"><h2>운영자 권한을 다시 확인해 주세요.</h2><p className="admin-muted">서버에서 요청 권한이 거부되었습니다. 계정의 운영 권한이 변경되었을 수 있어요.</p><button className="admin-button" disabled={action.busy} onClick={() => void action.run(async () => { const user = await getMe(); await onRefreshAuth(); if (!isAdminRole(user.role)) throw new Error('이 계정에는 운영자 권한이 없습니다.'); setAccessError(false) }, '')}>권한 다시 확인</button></section> : <>
          {tab === 'rounds' && <AdminRounds role={role} />}
          {tab === 'reports' && <AdminReports />}
          {tab === 'notices' && <AdminNotices />}
          {tab === 'places' && <AdminPlaces />}
          {tab === 'timetable' && <AdminTimetable />}
          {tab === 'clubs' && <AdminClubs />}
          {tab === 'moderation' && <AdminModeration />}
        </>}
      </AdminErrorContext.Provider>
      <footer className="admin-footer">YU FESTA 운영자 센터 · 모든 시각은 한국 시간 기준</footer>
    </main>
  </div>
}
