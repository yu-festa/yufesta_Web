import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../layout/AppLayout'
import HomeLogo from '../components/HomeLogo'
import { performances } from '../data/timetable'
import './InstatingApply.css'

const interests = ['술', '공연', '운동', '게임', '카페', '영화', '음악', '사진', '반려동물', '기타']
const ages = ['20 - 21세', '22 - 24세', '25 - 27세', '28세 이상']
const consentLabels = ['[필수] 개인정보 수집·이용 동의', '[필수] 서비스 이용약관 동의', '[필수] 만 19세 이상입니다']

type Application = {
  nickname: string
  instagram: string
  gender: string
  age: string
  tags: string[]
  performance: string
  introduction: string
  multipleMatches: boolean
}

function Heart() {
  return <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M50 85 15 52C-7 30 24 1 44 22l6 7 6-7C76 1 107 30 85 52Z" /></svg>
}

export default function InstatingApply({ onHome }: { onHome: () => void }) {
  const [step, setStep] = useState(1)
  const [application, setApplication] = useState<Application>({
    nickname: '', instagram: '', gender: '', age: '', tags: [], performance: '', introduction: '', multipleMatches: false,
  })
  const [consents, setConsents] = useState([false, false, false])
  const [error, setError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  const selectedPerformance = performances.find(item => item.id === application.performance)
  const allConsented = consents.every(Boolean)

  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  function update<K extends keyof Application>(key: K, value: Application[K]) {
    setApplication(current => ({ ...current, [key]: value }))
    setError('')
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1 && !application.nickname.trim()) {
      setError('닉네임을 입력해 주세요.')
      return
    }
    if (step === 2 && application.tags.length === 0) {
      setError('관심 태그를 1개 이상 선택해 주세요.')
      return
    }
    if (step === 3 && !allConsented) {
      setError('필수 항목에 모두 동의해 주세요.')
      return
    }
    setError('')
    // UI preview only. Connect the application API before treating this as a server submission.
    setStep(current => current + 1)
  }

  function back() {
    if (step === 1) onHome()
    else { setError(''); setStep(current => current - 1) }
  }

  return (
    <AppLayout header={<div className={`flex h-22 items-center ${step === 4 ? 'instating-complete-header' : ''}`}><HomeLogo onHome={onHome} />{step === 4 && <span className="instating-header-stars" aria-hidden="true">✦<span>✧</span></span>}</div>}>
      <div className="instating-apply">
        {step < 4 && <div className="instating-page-heading">
          {step < 4 && <button type="button" className="instating-back" onClick={back} aria-label={step === 1 ? '홈으로 돌아가기' : '이전 단계로 돌아가기'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
          </button>}
          <h1>인스타팅 신청</h1>
        </div>}

        {step < 4 ? <form onSubmit={next}>
          <div className="instating-intro">
            <h2 ref={headingRef} tabIndex={-1}>{step === 1 ? '나를 소개해 주세요' : step === 2 ? '어떤 축제를 선호하나요?' : '신청 정보를 확인해주세요'}</h2>
            <p>{step === 1 ? '내가 입력한 정보와 맞는 친구를 찾아드려요.' : step === 2 ? '취향이 비슷한 친구를 찾는 데 도움이 돼요' : '인스타그램 아이디가 맞는지 꼭 확인해주세요'}</p>
            <span className="sr-only">총 3단계 중 {step}단계</span>
            {step < 3 && <span className="instating-required-note">필수 항목 *</span>}
          </div>

          {step === 1 && <div className="instating-fields">
            <div className="instating-field">
              <label htmlFor="instating-nickname">닉네임 <b>*</b></label>
              <input id="instating-nickname" value={application.nickname} onChange={event => update('nickname', event.target.value)} placeholder="닉네임을 입력해주세요" required maxLength={20} autoComplete="nickname" />
            </div>
            <div className="instating-field">
              <label htmlFor="instating-instagram">인스타 아이디 <b>*</b></label>
              <div className="instating-instagram-input"><span aria-hidden="true">@</span><input id="instating-instagram" value={application.instagram} onChange={event => update('instagram', event.target.value.replace(/^@/, ''))} placeholder="instagram_id" required maxLength={30} pattern="[A-Za-z0-9._]+" title="영문, 숫자, 마침표, 밑줄로 된 인스타그램 아이디를 입력해 주세요." autoCapitalize="none" spellCheck={false} aria-describedby="instagram-help" /></div>
              <p id="instagram-help" className="instating-help">매칭되면 상대에게 아이디가 공개돼요.</p>
            </div>
            <fieldset className="instating-field"><legend>성별 <b>*</b></legend>
              <div className="instating-options">{['남', '여'].map(gender => <label className="instating-option" key={gender}><input type="radio" name="gender" value={gender} checked={application.gender === gender} onChange={() => update('gender', gender)} required /><span>{gender}</span></label>)}</div>
            </fieldset>
            <fieldset className="instating-field"><legend>나이대 <b>*</b></legend>
              <div className="instating-options">{ages.map(age => <label className="instating-option" key={age}><input type="radio" name="age" value={age} checked={application.age === age} onChange={() => update('age', age)} required /><span>{age}</span></label>)}</div>
              <p className="instating-help">입력한 정보는 매칭된 상대에게만 공개돼요.</p>
            </fieldset>
          </div>}

          {step === 2 && <div className="instating-fields">
            <fieldset className="instating-field"><legend>관심 태그 <b>*</b></legend>
              <p id="interest-help" className="instating-help instating-help-top">최대 3개까지 선택할 수 있어요 <span>{application.tags.length} / 3</span></p>
              <div className="instating-tags" aria-describedby="interest-help">{interests.map(tag => <label key={tag} className="instating-option"><input type="checkbox" checked={application.tags.includes(tag)} disabled={application.tags.length >= 3 && !application.tags.includes(tag)} onChange={event => update('tags', event.target.checked ? [...application.tags, tag] : application.tags.filter(item => item !== tag))} /><span>{tag}</span></label>)}</div>
            </fieldset>
            <div className="instating-field">
              <label htmlFor="instating-performance">보고 싶은 공연</label>
              <p id="performance-help" className="instating-help instating-help-top">축제에서 보고 싶은 공연을 선택해주세요</p>
              <select id="instating-performance" value={application.performance} onChange={event => update('performance', event.target.value)} aria-describedby="performance-help">
                <option value="">선택 안 함</option>
                {performances.map(performance => <option key={performance.id} value={performance.id}>{performance.name} · {performance.start}</option>)}
              </select>
            </div>
            <div className="instating-field">
              <label htmlFor="instating-introduction">한 줄 소개</label>
              <div className="instating-textarea"><textarea id="instating-introduction" value={application.introduction} onChange={event => update('introduction', event.target.value)} placeholder="함께할 친구에게 나를 소개해주세요!" maxLength={40} rows={3} aria-describedby="introduction-count" /><span id="introduction-count">{application.introduction.length} / 40</span></div>
            </div>
            <label className="instating-multiple"><input type="checkbox" checked={application.multipleMatches} onChange={event => update('multipleMatches', event.target.checked)} /><span><strong>여러 명과 매칭해도 좋아요</strong><small>최대 3명과 매칭될 수 있어요.<br />선택하지 않으면 1명과 매칭돼요.</small></span></label>
          </div>}

          {step === 3 && <>
            <div className="instating-summary">
              <h3>내 신청 정보</h3>
              <dl>
                <div><dt>닉네임</dt><dd>{application.nickname.trim()}</dd></div>
                <div><dt>인스타그램</dt><dd>@{application.instagram}</dd></div>
                <div><dt>성별</dt><dd>{application.gender}</dd></div>
                <div><dt>나이대</dt><dd>{application.age}</dd></div>
                <div><dt>보고 싶은 공연</dt><dd>{selectedPerformance ? `${selectedPerformance.name} · ${selectedPerformance.start}` : '선택 안 함'}</dd></div>
                <div><dt>여러 명 매칭</dt><dd>{application.multipleMatches ? '희망' : '희망하지 않음'}</dd></div>
                <div><dt>관심 키워드</dt><dd className="instating-summary-tags">{application.tags.map(tag => <span key={tag}>{tag}</span>)}</dd></div>
                <div><dt>한 줄 소개</dt><dd>{application.introduction.trim() || '입력 안 함'}</dd></div>
              </dl>
            </div>
            <div className="instating-privacy"><span className="instating-lock" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></svg></span><div><strong>매칭 시 인스타 ID가 바로 공개돼요</strong><p>별도 수락 없이 매칭된 상대에게 공개돼요.</p></div></div>
            <fieldset className="instating-consents"><legend className="sr-only">신청 필수 동의</legend>
              <label className="instating-consent-all"><input type="checkbox" checked={allConsented} onChange={event => { setConsents(consents.map(() => event.target.checked)); setError('') }} /><strong>전체 동의</strong></label>
              {consentLabels.map((label, index) => <label className="instating-consent" key={label}><input type="checkbox" checked={consents[index]} required onChange={event => { setConsents(current => current.map((value, i) => i === index ? event.target.checked : value)); setError('') }} /><span>{label}</span></label>)}
            </fieldset>
          </>}
          <p className="instating-error" role="alert">{error}</p>
          <button className="instating-primary" type="submit">{step === 3 ? '완료' : '다음'}</button>
        </form> : <section className="instating-success">
          <div className="instating-success-decoration" aria-hidden="true"><span className="instating-background-star instating-background-star-one">✦</span><span className="instating-background-star instating-background-star-two">✧</span><span className="instating-background-star instating-background-star-three">✦</span></div>
          <div className="instating-heart-scene" aria-hidden="true"><span className="instating-heart-ring" /><span className="instating-heart"><Heart /></span><span className="instating-spark instating-spark-one">✦</span><span className="instating-spark instating-spark-two">✦</span></div>
          <span className="instating-success-eyebrow">설레는 만남의 시작</span>
          <h2 ref={headingRef} tabIndex={-1}>신청이 완료되었습니다!</h2>
          <p>축제를 함께 즐길 새로운 친구,<br />두근두근, 조금만 기다려주세요.</p>
          <div className="instating-result-date"><div className="instating-result-content"><span className="instating-result-label">매칭 결과 발표</span><strong>시간 미정</strong></div></div>
          <button type="button" className="instating-primary" onClick={onHome}>홈으로 돌아가기</button>
        </section>}
      </div>
    </AppLayout>
  )
}
