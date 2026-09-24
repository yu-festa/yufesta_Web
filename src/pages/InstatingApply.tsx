import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMotion } from '../hooks/useMotion'
import AppLayout from '../layout/AppLayout'
import InstatingHeader from '../components/InstatingHeader'
import { ApiError } from '../api/client'
import { toMatchApplicationRequest, parseMatchTime } from '../utils/match'
import type { InstatingApplication as Application } from '../utils/instating'
import { createMatchApplication, getMatchTags } from '../api/match'
import type { MatchTagOption } from '../api/match'

const heartbeatFrames: Keyframe[] = [{ transform: 'scale(1)', offset: 0 }, { transform: 'scale(1.08)', offset: .15 }, { transform: 'scale(1.02)', offset: .28 }, { transform: 'scale(1)', offset: .4 }, { transform: 'scale(1)', offset: 1 }]
const heartbeatTiming: KeyframeAnimationOptions = { duration: 1800, iterations: Infinity, easing: 'ease-in-out' }

const ages = ['19 - 21세', '22 - 24세', '25 - 27세', '28세 이상']
const consentLabels = ['[필수] 개인정보 수집·이용 동의', '[필수] 서비스 이용약관 동의', '[필수] 만 19세 이상입니다']

export default function InstatingApply({ onHome, onProfile, onSubmitted, alreadyApplied = false, canApply = false, publishAt }: { onHome: () => void; onProfile: () => void; onSubmitted: () => Promise<void>; alreadyApplied?: boolean; canApply?: boolean; publishAt?: string }) {
  const [step, setStep] = useState(1)
  const [application, setApplication] = useState<Application>({
    nickname: '', instagram: '', gender: '', age: '', tags: [], performance: '', introduction: '', multipleMatches: false,
  })
  const [consents, setConsents] = useState([false, false, false])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [interestOptions, setInterestOptions] = useState<MatchTagOption[]>([])
  const heartRef = useMotion<HTMLSpanElement>(heartbeatFrames, heartbeatTiming, `${step}-${alreadyApplied}`)
  const submitting = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  const [tagsError, setTagsError] = useState('')
  const [tagReload, setTagReload] = useState(0)
  const allConsented = consents.every(Boolean)

  useEffect(() => {
    let active = true
    void getMatchTags().then(tags => {
      if (active) { setInterestOptions(tags); setTagsError(tags.length ? '' : '관심 태그가 아직 등록되지 않았어요.') }
    }).catch(() => { if (active) setTagsError('관심 태그를 불러오지 못했어요.') })
    return () => { active = false }
  }, [tagReload])

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

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || step === 4) return
    if (alreadyApplied) return
    if (!canApply) { setError('현재는 신청할 수 없어요. 접수 시간과 연결 상태를 확인해 주세요.'); return }
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
    if (step === 3) {
      submitting.current = true
      setSaving(true)
      try {
        await createMatchApplication(toMatchApplicationRequest(application, interestOptions, consents))
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '신청하지 못했어요. 다시 시도해 주세요.')
        if (reason instanceof ApiError && reason.status === 409) void onSubmitted()
        return
      } finally { submitting.current = false; setSaving(false) }
      setStep(4)
      void onSubmitted()
      return
    }
    setStep(current => current + 1)
  }

  function back() {
    if (submitting.current) return
    if (step === 1) onHome()
    else { setError(''); setStep(current => current - 1) }
  }

  if (alreadyApplied && step !== 4) return (
    <AppLayout header={<InstatingHeader onHome={onHome} onProfile={onProfile} />}>
      <section className={"text-[#172039] [padding:20px_0_8px] [&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[3px] [&_input:focus-visible]:[outline:2px_solid_#1554ff] [&_input:focus-visible]:outline-offset-[3px] [&_select:focus-visible]:[outline:2px_solid_#1554ff] [&_select:focus-visible]:outline-offset-[3px] [&_textarea:focus-visible]:[outline:2px_solid_#1554ff] [&_textarea:focus-visible]:outline-offset-[3px] text-center [&_h2]:text-[25px] [&_h2]:font-[750] [&_h2]:tracking-[-1px] [&_h2]:mt-[12px] [&_>_p]:text-[13px] [&_>_p]:leading-[1.8] [&_>_p]:text-[#8390a5] [&_>_p]:mt-[14px] [@media(prefers-reduced-motion:reduce)]:[&_*]:[transition:none] instating-apply instating-success"}>
        <span ref={heartRef} className={"grid place-items-center w-[96px] h-[96px] rounded-full [margin:0_auto_22px] bg-[#eef4ff] text-[#1554ff] text-[70px] instating-success-mark"} aria-hidden="true">♡</span>
        <h1 className="text-2xl font-bold">이미 신청을 완료했어요</h1>
        <p>이번 회차의 신청을 완료했어요.<br />마이페이지에서 신청 내역과 결과를 확인해주세요.</p>
        <button type="button" className={"block w-full min-h-[52px] p-[14px] rounded-[8px] text-[15px] font-bold cursor-pointer mt-[28px] bg-[#1554ff] text-[white] [&:hover]:bg-[#1046db] [&:active]:[transform:scale(.99)] instating-primary"} onClick={onProfile}>신청 내역 확인하기</button>
        <button type="button" className={"block w-full min-h-[52px] p-[14px] rounded-[8px] text-[15px] font-bold cursor-pointer text-[#758198] mt-[8px] instating-secondary"} onClick={onHome}>홈으로 돌아가기</button>
      </section>
    </AppLayout>
  )

  return (
    <AppLayout header={<InstatingHeader onHome={onHome} onProfile={onProfile} />}>
      <div className={"text-[#172039] [padding:24px_0_12px] [&_button:focus-visible]:[outline:2px_solid_#1554ff] [&_button:focus-visible]:outline-offset-[3px] [&_input:focus-visible]:[outline:2px_solid_#1554ff] [&_input:focus-visible]:outline-offset-[3px] [&_select:focus-visible]:[outline:2px_solid_#1554ff] [&_select:focus-visible]:outline-offset-[3px] [&_textarea:focus-visible]:[outline:2px_solid_#1554ff] [&_textarea:focus-visible]:outline-offset-[3px] [@media(prefers-reduced-motion:reduce)]:[&_*]:[transition:none] instating-apply"}>
        {step < 4 && <div className={"flex flex-wrap items-center gap-[8px] [&_>_span]:text-[10px] [&_>_span]:font-bold [&_>_span]:tracking-[1.5px] [&_>_span]:text-[#7a88a5] instating-page-heading"}>
          {step < 4 && <button type="button" className={"grid place-items-center w-[32px] h-[32px] cursor-pointer ml-[-8px] instating-back"} onClick={back} aria-label={step === 1 ? '홈으로 돌아가기' : '이전 단계로 돌아가기'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg>
          </button>}
          <span>STEP 0{step} / 03</span>
          <ol className={"flex w-full justify-between mt-[14px] [padding:14px_12px] bg-[#f6f8fc] rounded-[8px] [&_li]:flex [&_li]:items-center [&_li]:gap-[6px] [&_li]:text-[#8a94a7] [&_li]:text-[11px] [&_li_>_span]:grid [&_li_>_span]:place-items-center [&_li_>_span]:w-[22px] [&_li_>_span]:h-[22px] [&_li_>_span]:rounded-full [&_li_>_span]:bg-[#e7ebf2] [&_li_>_span]:text-[10px] [&_li_>_span]:font-bold [&_[aria-current]]:text-[#1554ff] [&_[aria-current]]:font-bold [&_[aria-current]_>_span]:text-[white] [&_[aria-current]_>_span]:bg-[#1554ff] [&_[data-done=true]_>_span]:bg-[#dae5ff] [&_[data-done=true]_>_span]:text-[#1554ff] [@media(max-width:350px)]:px-[8px] [@media(max-width:350px)]:[&_li]:text-[10px] [@media(max-width:350px)]:[&_li]:gap-[4px] instating-steps"} aria-label="신청 진행 단계">{['기본 정보', '취향 선택', '최종 확인'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} data-done={step > index + 1}><span>{index + 1}</span>{label}</li>)}</ol>
        </div>}

        {step < 4 ? <form onSubmit={next}>
          <div className={"[margin:28px_0] [&_h2]:text-[25px] [&_h2]:font-[750] [&_h2]:tracking-[-1px] [&_h2]:leading-[1.4] [&_p]:text-[#7d8493] [&_p]:text-[13px] [&_p]:mt-[8px] [&_p]:leading-[1.6] [&_p]:break-keep instating-intro"}>
            <h2 ref={headingRef} tabIndex={-1}>{step === 1 ? '나를 소개해 주세요' : step === 2 ? '어떤 축제를 선호하나요?' : '신청 정보를 확인해주세요'}</h2>
            <p>{step === 1 ? '내가 입력한 정보와 맞는 친구를 찾아드려요.' : step === 2 ? '취향이 비슷한 친구를 찾는 데 도움이 돼요' : '인스타그램 아이디가 맞는지 꼭 확인해주세요'}</p>
            {step < 3 && <span className={"block text-right text-[11px] text-[#1554ff] mt-[18px] instating-required-note"}>필수 항목 *</span>}
          </div>

          {step === 1 && <div className={"grid gap-[26px] instating-fields"}>
            <div className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}>
              <label htmlFor="instating-nickname">닉네임 <b>*</b></label>
              <input id="instating-nickname" value={application.nickname} onChange={event => update('nickname', event.target.value)} placeholder="닉네임을 입력해주세요" required maxLength={20} autoComplete="nickname" />
            </div>
            <div className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}>
              <label htmlFor="instating-instagram">인스타 아이디 <b>*</b></label>
              <div className={"w-full [border:1px_solid_#e0e4ec] rounded-[8px] bg-white flex items-center overflow-hidden [&_>_span]:pl-[16px] [&_>_span]:text-[#8b96ac] [&_>_span]:text-[20px] [&_input]:w-full [&_input]:min-w-[0] [&_input]:p-[12px] [&_input]:min-h-[50px] [&_input]:text-[16px] instating-instagram-input"}><span aria-hidden="true">@</span><input id="instating-instagram" value={application.instagram} onChange={event => update('instagram', event.target.value.replace(/^@/, ''))} placeholder="instagram_id" required maxLength={30} pattern="[A-Za-z0-9._]+" title="영문, 숫자, 마침표, 밑줄로 된 인스타그램 아이디를 입력해 주세요." autoCapitalize="none" spellCheck={false} aria-describedby="instagram-help" /></div>
              <p id="instagram-help" className={"text-[#838c9e] text-[11px] leading-[1.6] mt-[8px] instating-help"}>매칭되면 상대에게 아이디가 공개돼요.</p>
            </div>
            <fieldset className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}><legend>성별 <b>*</b></legend>
              <div className={"grid grid-cols-[1fr_1fr] gap-[10px] instating-options"}>{['남', '여'].map(gender => <label className={"relative block cursor-pointer [&_input]:absolute [&_input]:w-[1px] [&_input]:h-[1px] [&_input]:opacity-[0] [&_>_span]:flex [&_>_span]:justify-center [&_>_span]:items-center [&_>_span]:gap-[8px] [&_>_span]:min-h-[46px] [&_>_span]:[border:1px_solid_#e0e4ec] [&_>_span]:rounded-[8px] [&_>_span]:text-[14px] [&_>_span]:[transition:background_.15s] [&_input[type=radio]_+_span::before]:[content:''] [&_input[type=radio]_+_span::before]:w-[15px] [&_input[type=radio]_+_span::before]:h-[15px] [&_input[type=radio]_+_span::before]:[border:1px_solid_#c3cad7] [&_input[type=radio]_+_span::before]:rounded-full [&_input:checked_+_span]:[border-color:#1554ff] [&_input:checked_+_span]:bg-[#f1f5ff] [&_input:checked_+_span]:text-[#1554ff] [&_input:checked_+_span]:font-[650] [&_input[type=radio]:checked_+_span::before]:[border:4px_solid_#1554ff] [&_input[type=radio]:checked_+_span::before]:bg-white [&_input:disabled_+_span]:opacity-[.4] [&_input:disabled_+_span]:cursor-not-allowed [&_input:focus-visible_+_span]:[outline:2px_solid_#1554ff] [&_input:focus-visible_+_span]:outline-offset-[3px] instating-option"} key={gender}><input type="radio" name="gender" value={gender} checked={application.gender === gender} onChange={() => update('gender', gender)} required /><span>{gender}</span></label>)}</div>
            </fieldset>
            <fieldset className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}><legend>나이대 <b>*</b></legend>
              <div className={"grid grid-cols-[1fr_1fr] gap-[10px] instating-options"}>{ages.map(age => <label className={"relative block cursor-pointer [&_input]:absolute [&_input]:w-[1px] [&_input]:h-[1px] [&_input]:opacity-[0] [&_>_span]:flex [&_>_span]:justify-center [&_>_span]:items-center [&_>_span]:gap-[8px] [&_>_span]:min-h-[46px] [&_>_span]:[border:1px_solid_#e0e4ec] [&_>_span]:rounded-[8px] [&_>_span]:text-[14px] [&_>_span]:[transition:background_.15s] [&_input[type=radio]_+_span::before]:[content:''] [&_input[type=radio]_+_span::before]:w-[15px] [&_input[type=radio]_+_span::before]:h-[15px] [&_input[type=radio]_+_span::before]:[border:1px_solid_#c3cad7] [&_input[type=radio]_+_span::before]:rounded-full [&_input:checked_+_span]:[border-color:#1554ff] [&_input:checked_+_span]:bg-[#f1f5ff] [&_input:checked_+_span]:text-[#1554ff] [&_input:checked_+_span]:font-[650] [&_input[type=radio]:checked_+_span::before]:[border:4px_solid_#1554ff] [&_input[type=radio]:checked_+_span::before]:bg-white [&_input:disabled_+_span]:opacity-[.4] [&_input:disabled_+_span]:cursor-not-allowed [&_input:focus-visible_+_span]:[outline:2px_solid_#1554ff] [&_input:focus-visible_+_span]:outline-offset-[3px] instating-option"} key={age}><input type="radio" name="age" value={age} checked={application.age === age} onChange={() => update('age', age)} required /><span>{age}</span></label>)}</div>
              <p className={"text-[#838c9e] text-[11px] leading-[1.6] mt-[8px] instating-help"}>입력한 정보는 매칭된 상대에게만 공개돼요.</p>
            </fieldset>
          </div>}

          {step === 2 && <div className={"grid gap-[26px] instating-fields"}>
            <fieldset className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}><legend>관심 태그 <b>*</b></legend>
              <p id="interest-help" className={"text-[#838c9e] text-[11px] leading-[1.6] mt-[-4px] mb-[14px] [&_span]:float-right [&_span]:text-[#1554ff] instating-help instating-help-top"}>최대 3개까지 선택할 수 있어요 <span>{application.tags.length} / 3</span></p>
              <div className={"flex flex-wrap gap-[10px] [&_.instating-option_>_span]:[padding:0_18px] [&_.instating-option_>_span]:rounded-[24px] [&_.instating-option_>_span]:min-h-[40px] [&_.instating-option_>_span]:text-[13px] instating-tags"} aria-describedby="interest-help">{interestOptions.map(tag => <label key={tag.code} className={"relative block cursor-pointer [&_input]:absolute [&_input]:w-[1px] [&_input]:h-[1px] [&_input]:opacity-[0] [&_>_span]:flex [&_>_span]:justify-center [&_>_span]:items-center [&_>_span]:gap-[8px] [&_>_span]:min-h-[46px] [&_>_span]:[border:1px_solid_#e0e4ec] [&_>_span]:rounded-[8px] [&_>_span]:text-[14px] [&_>_span]:[transition:background_.15s] [&_input[type=radio]_+_span::before]:[content:''] [&_input[type=radio]_+_span::before]:w-[15px] [&_input[type=radio]_+_span::before]:h-[15px] [&_input[type=radio]_+_span::before]:[border:1px_solid_#c3cad7] [&_input[type=radio]_+_span::before]:rounded-full [&_input:checked_+_span]:[border-color:#1554ff] [&_input:checked_+_span]:bg-[#f1f5ff] [&_input:checked_+_span]:text-[#1554ff] [&_input:checked_+_span]:font-[650] [&_input[type=radio]:checked_+_span::before]:[border:4px_solid_#1554ff] [&_input[type=radio]:checked_+_span::before]:bg-white [&_input:disabled_+_span]:opacity-[.4] [&_input:disabled_+_span]:cursor-not-allowed [&_input:focus-visible_+_span]:[outline:2px_solid_#1554ff] [&_input:focus-visible_+_span]:outline-offset-[3px] instating-option"}><input type="checkbox" checked={application.tags.includes(tag.code)} disabled={application.tags.length >= 3 && !application.tags.includes(tag.code)} onChange={event => update('tags', event.target.checked ? [...application.tags, tag.code] : application.tags.filter(item => item !== tag.code))} /><span>{tag.label}</span></label>)}</div>
            </fieldset>
            <div className={"min-w-[0] [&_>_label]:block [&_>_label]:text-[15px] [&_>_label]:font-[650] [&_>_label]:mb-[10px] [&_legend]:block [&_legend]:text-[15px] [&_legend]:font-[650] [&_legend]:mb-[10px] [&_b]:text-[#1554ff] [&_>_input]:w-full [&_>_input]:[border:1px_solid_#e0e4ec] [&_>_input]:rounded-[8px] [&_>_input]:bg-white [&_select]:w-full [&_select]:[border:1px_solid_#e0e4ec] [&_select]:rounded-[8px] [&_select]:bg-white [&_>_input]:min-h-[50px] [&_>_input]:[padding:12px_14px] [&_>_input]:text-[16px] [&_select]:min-h-[50px] [&_select]:[padding:12px_14px] [&_select]:text-[16px] [&_input::placeholder]:text-[#a1a7b3] [&_textarea::placeholder]:text-[#a1a7b3] instating-field"}>
              <label htmlFor="instating-introduction">한 줄 소개</label>
              <div className={"w-full [border:1px_solid_#e0e4ec] rounded-[8px] bg-white relative pb-[24px] [&_textarea]:w-full [&_textarea]:block [&_textarea]:p-[14px] [&_textarea]:resize-none [&_textarea]:text-[16px] [&_textarea]:min-h-[90px] [&_>_span]:absolute [&_>_span]:bottom-[10px] [&_>_span]:right-[14px] [&_>_span]:text-[11px] [&_>_span]:text-[#838c9e] instating-textarea"}><textarea id="instating-introduction" value={application.introduction} onChange={event => update('introduction', event.target.value)} placeholder="함께할 친구에게 나를 소개해주세요!" maxLength={40} rows={3} aria-describedby="introduction-count" /><span id="introduction-count">{application.introduction.length} / 40</span></div>
            </div>
          </div>}

          {step === 3 && <>
            <div className={"[border:1px_solid_#e5eaf4] rounded-[12px] p-[22px] [background:linear-gradient(135deg,#f7faff,white)] [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:pb-[18px] [&_h3]:[border-bottom:1px_dashed_#d9e1f0] [&_h3]:mb-[20px] [&_dl]:grid [&_dl]:gap-[18px] [&_dl_>_div]:grid [&_dl_>_div]:grid-cols-[90px_1fr] [&_dl_>_div]:gap-[12px] [&_dl_>_div]:text-[13px] [&_dt]:text-[#808a9d] [&_dd]:wrap-anywhere instating-summary"}>
              <h3>내 신청 정보</h3>
              <dl>
                <div><dt>닉네임</dt><dd>{application.nickname.trim()}</dd></div>
                <div><dt>인스타그램</dt><dd>@{application.instagram}</dd></div>
                <div><dt>성별</dt><dd>{application.gender}</dd></div>
                <div><dt>나이대</dt><dd>{application.age}</dd></div>
                <div><dt>관심 키워드</dt><dd className={"flex flex-wrap gap-[6px] [&_span]:text-[#1554ff] [&_span]:bg-[#e8efff] [&_span]:rounded-[4px] [&_span]:[padding:3px_7px] [&_span]:text-[11px] instating-summary-tags"}>{application.tags.map(tag => <span key={tag}>{interestOptions.find(option => option.code === tag)?.label ?? tag}</span>)}</dd></div>
                <div><dt>한 줄 소개</dt><dd>{application.introduction.trim() || '입력 안 함'}</dd></div>
              </dl>
            </div>
            <div className={"flex items-center gap-[12px] mt-[18px] p-[16px] rounded-[8px] bg-[#f6f8fc] [&_strong]:text-[12px] [&_p]:text-[#838c9e] [&_p]:text-[10px] [&_p]:mt-[5px] instating-privacy"}><span className={"text-[#1554ff] instating-lock"} aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></svg></span><div><strong>매칭 시 인스타 ID가 바로 공개돼요</strong><p>별도 수락 없이 매칭된 상대에게 공개돼요.</p></div></div>
            <fieldset className={"mt-[24px] [&_label]:flex [&_label]:items-center [&_label]:gap-[12px] [&_label]:[padding:12px_4px] [&_label]:cursor-pointer [&_input]:w-[18px] [&_input]:h-[18px] [&_input]:accent-[#1554ff] [&_input]:shrink-0 instating-consents"}><legend className="sr-only">신청 필수 동의</legend>
              <label className={"[border-bottom:1px_solid_#e8edf5] mb-[8px] text-[14px] instating-consent-all"}><input type="checkbox" checked={allConsented} onChange={event => { setConsents(consents.map(() => event.target.checked)); setError('') }} /><strong>전체 동의</strong></label>
              {consentLabels.map((label, index) => <label className={"text-[12px] text-[#788397] instating-consent"} key={label}><input type="checkbox" checked={consents[index]} required onChange={event => { setConsents(current => current.map((value, i) => i === index ? event.target.checked : value)); setError('') }} /><span>{label}</span></label>)}
            </fieldset>
          </>}
          {tagsError && <p role="alert" className="mt-3 text-sm text-red-700">{tagsError}<button type="button" className="ml-2 underline" onClick={() => setTagReload(value => value + 1)}>다시 불러오기</button></p>}
          {!canApply && <p role="status" className="mt-3 text-sm text-[#63708a]">접수 기간이 아니거나 신청 상태를 확인 중이에요.</p>}
          <p className={"text-[#c42d45] text-[13px] mt-[14px] [&:empty]:hidden instating-error"} role="alert">{error}</p>
          <button className={"block w-full min-h-[52px] p-[14px] rounded-[8px] text-[15px] font-bold cursor-pointer mt-[28px] bg-[#1554ff] text-[white] [&:hover]:bg-[#1046db] [&:active]:[transform:scale(.99)] instating-primary"} type="submit" disabled={saving || !canApply || interestOptions.length === 0}>{saving ? '신청 저장 중…' : step === 3 ? '신청 완료하기' : '다음 단계로'}</button>
          <p className={"mt-[14px] text-[11px] text-center text-[#8390a5] leading-[1.6] instating-local-note"}>신청 완료 후 마이페이지에서 신청 내역을 확인할 수 있어요.</p>
        </form> : <section className={"text-center [padding:20px_0_8px] [&_h2]:text-[25px] [&_h2]:font-[750] [&_h2]:tracking-[-1px] [&_h2]:mt-[12px] [&_>_p]:text-[13px] [&_>_p]:leading-[1.8] [&_>_p]:text-[#8390a5] [&_>_p]:mt-[14px] instating-success"}>
          <span ref={heartRef} className={"grid place-items-center w-[96px] h-[96px] rounded-full [margin:0_auto_22px] bg-[#eef4ff] text-[#1554ff] text-[70px] instating-success-mark"} aria-hidden="true">♡</span>
          <span className={"block text-[10px] font-bold tracking-[2px] text-[#1554ff] instating-success-eyebrow"}>YOU'RE ON THE LIST</span>
          <h2 ref={headingRef} tabIndex={-1}>신청이 완료되었습니다!</h2>
          <p>축제를 함께 즐길 새로운 친구,<br />두근두근, 조금만 기다려주세요.</p>
          <div className={"mt-[28px] [padding:26px_22px] text-left [border:1px_solid_#dfe8fb] rounded-[12px] [background:linear-gradient(140deg,#f1f6ff,#fff)] [&_>_span]:text-[9px] [&_>_span]:tracking-[1.5px] [&_>_span]:text-[#8795ac] [&_h3]:mt-[18px] [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:wrap-anywhere [&_>_p]:text-[#8390a5] [&_>_p]:text-[12px] [&_>_p]:leading-[1.8] [&_>_p]:mt-[8px] [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:gap-[12px] [&_>_div]:mt-[24px] [&_>_div]:pt-[20px] [&_>_div]:[border-top:1px_dashed_#ccd9ee] [&_>_div]:text-[13px] [&_strong]:text-[#1554ff] instating-completion-ticket"}><span>2026 YU FESTA · INSTA-TING</span><h3>{application.nickname}님의 신청서</h3><p>@{application.instagram}</p><div><span>매칭 결과 발표</span><strong>{publishAt && Number.isFinite(parseMatchTime(publishAt)) ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parseMatchTime(publishAt)) : '발표 예정'}</strong></div><p>발표 후 마이페이지에서 카드를 두드려<br />나의 매칭 결과를 확인해보세요.</p></div>
          <p className={"mt-[14px] text-[11px] text-center text-[#8390a5] leading-[1.6] instating-local-note"}>서버에 신청이 접수되었습니다.</p>
          <button type="button" className={"block w-full min-h-[52px] p-[14px] rounded-[8px] text-[15px] font-bold cursor-pointer mt-[28px] bg-[#1554ff] text-[white] [&:hover]:bg-[#1046db] [&:active]:[transform:scale(.99)] instating-primary"} onClick={onProfile}>마이페이지에서 확인하기</button>
          <button type="button" className={"block w-full min-h-[52px] p-[14px] rounded-[8px] text-[15px] font-bold cursor-pointer text-[#758198] mt-[8px] instating-secondary"} onClick={onHome}>홈으로 돌아가기</button>
        </section>}
      </div>
    </AppLayout>
  )
}
