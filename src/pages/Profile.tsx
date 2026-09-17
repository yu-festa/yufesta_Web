import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import type { ProfileUser } from '../utils/profile'
import './Profile.css'

export default function Profile({ user, isPreview, onBack, onHome }: { user: ProfileUser; isPreview: boolean; onBack: () => void; onHome: () => void }) {
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
        {isPreview && <p className="profile-preview">미리보기 · 예시 프로필과 참여 내역이에요</p>}

        <section className="profile-history" aria-labelledby="profile-history-title">
          <div className="profile-history-heading"><h2 id="profile-history-title">인스타팅 참여 내역</h2><span aria-label={`총 ${user.participations.length}건`}>{user.participations.length}</span></div>
          <p className="profile-history-description">축제를 함께할 친구와의 설렘을 확인해보세요.</p>
          {user.participations.length ? <ul className="profile-history-list">{user.participations.map(participation => <li key={participation.id}>
            <article className="profile-participation">
              <div className="profile-participation-cover"><div className="profile-participation-badges"><span>{participation.round} / 추첨</span><span className="profile-application-status">신청 완료</span></div><h3>INSTA - TING</h3><p>{participation.festival}</p></div>
              <div className="profile-participation-body">
                <div className="profile-announcement"><span>매칭 결과 발표</span><strong>시간 미정</strong></div>
                <p className="profile-waiting"><span aria-hidden="true">♡</span> 새로운 만남을 기다리고 있어요</p>
                <details className="profile-application-details"><summary>신청 정보 보기<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary><dl><div><dt>닉네임</dt><dd>{participation.nickname}</dd></div><div><dt>인스타그램</dt><dd>@{user.instagram}</dd></div><div><dt>관심 키워드</dt><dd className="profile-interest-tags">{participation.interests.map(interest => <span key={interest}>{interest}</span>)}</dd></div></dl></details>
              </div>
            </article>
          </li>)}</ul> : <div className="profile-empty"><span aria-hidden="true">♡</span><h3>아직 참여한 인스타팅이 없어요</h3><p>축제를 함께 즐길 친구를 만나보세요.</p></div>}
        </section>
        <button type="button" className="profile-home" onClick={onHome}>홈으로 돌아가기</button>
      </div>
    </AppLayout>
  )
}
