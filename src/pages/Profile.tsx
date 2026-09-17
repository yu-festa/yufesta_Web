import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import type { ProfileUser } from '../utils/profile'
import './Profile.css'

export default function Profile({ user, isPreview, onBack, onHome, onResult, onApply }: { user: ProfileUser; isPreview: boolean; onBack: () => void; onHome: () => void; onResult: (id: string) => void; onApply: () => void }) {
  return (
    <AppLayout header={<div className="flex h-22 items-center"><HomeLogo onHome={onHome} /></div>}>
      <div className="profile-page">
        <div className="profile-heading">
          <button type="button" onClick={onBack} aria-label="이전 화면으로 돌아가기"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
          <h1>내 프로필</h1>
        </div>

        <section className="profile-user" aria-label="프로필 정보">
          <div className="profile-avatar" role="img" aria-label={`${user.name}님의 기본 프로필 이미지`}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="17" r="8" fill="currentColor" /><path d="M9 41a15 15 0 0 1 30 0" fill="currentColor" /></svg>
            <span aria-hidden="true">✦</span>
          </div>
          <div className="profile-user-info"><span className="profile-greeting">반가워요!</span><h2>{user.name}<span>님</span></h2><p>@{user.instagram}</p></div>
        </section>
        {isPreview && <p className="profile-preview">미리보기 · 이 브라우저의 신청 내역과 결과 체험이에요</p>}

        <section className="profile-history" aria-labelledby="profile-history-title">
          <div className="profile-history-heading"><h2 id="profile-history-title">인스타팅 참여 내역</h2><span aria-label={`총 ${user.participations.length}건`}>{user.participations.length}</span></div>
          <p className="profile-history-description">축제를 함께할 친구와의 설렘을 확인해보세요.</p>
          {user.participations.length ? <ul className="profile-history-list">{user.participations.map(participation => <li key={participation.id}>
            <article className="profile-participation">
              <div className="profile-participation-cover"><div className="profile-participation-badges"><span>{participation.round} / 추첨</span><span className="profile-application-status">{participation.isDemo ? '결과 미리보기' : '신청 완료'}</span></div><h3>INSTA - TING</h3><p>{participation.festival}</p></div>
              <div className="profile-participation-body">
                <div className="profile-announcement"><span>매칭 결과</span><strong>{participation.isDemo ? '체험 가능' : participation.result && participation.result.status !== 'pending' ? '발표 완료' : '발표 대기'}</strong></div>
                <p className="profile-waiting"><span aria-hidden="true">♡</span>{participation.isDemo || (participation.result && participation.result.status !== 'pending') ? '카드를 5번 두드려 결과를 확인해보세요' : '발표 시간 미정 · 새로운 만남을 준비 중이에요'}</p>
                <button type="button" className="profile-result-button" onClick={() => onResult(participation.id)}>{participation.isDemo ? '결과 카드 체험하기' : '매칭 결과 확인하기'}<span aria-hidden="true">↗</span></button>
                <details className="profile-application-details"><summary>신청 정보 보기<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><dl><div><dt>닉네임</dt><dd>{participation.nickname}</dd></div><div><dt>인스타그램</dt><dd>@{participation.instagram ?? user.instagram}</dd></div><div><dt>관심 키워드</dt><dd className="profile-interest-tags">{participation.interests.map(interest => <span key={interest}>{interest}</span>)}</dd></div></dl></details>
              </div>
            </article>
          </li>)}</ul> : <div className="profile-empty"><span aria-hidden="true">♡</span><h3>아직 참여한 인스타팅이 없어요</h3><p>축제를 함께 즐길 친구를 만나보세요.</p></div>}
        </section>
        {user.participations.some(item => !item.isDemo)
          ? <p className="profile-preview">신청 완료 · 인스타팅은 한 번만 신청할 수 있어요.</p>
          : <button type="button" className="profile-apply-button" onClick={onApply}>인스타팅 신청하기</button>}
        <button type="button" className="profile-home" onClick={onHome}>홈으로 돌아가기</button>
      </div>
    </AppLayout>
  )
}
