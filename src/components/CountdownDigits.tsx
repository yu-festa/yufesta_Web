import { Fragment } from 'react'
import { useMotion } from '../hooks/useMotion'

const digitFrames: Keyframe[] = [
  { opacity: 0, transform: 'translateY(-100%)', filter: 'blur(2px)' },
  { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
]
const digitTiming: KeyframeAnimationOptions = { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }

function CountdownDigit({ digit }: { digit: string }) {
  const digitRef = useMotion<HTMLSpanElement>(digitFrames, digitTiming, digit)
  return <span className="grid h-[clamp(48px,14cqw,64px)] min-w-0 flex-1 place-items-center overflow-hidden rounded-xl border border-[#b9d9ff]/15 bg-linear-to-b from-[#a7d4ff]/12 to-[#102d58]/25 text-[clamp(24px,7.5cqw,36px)] leading-none font-semibold tabular-nums text-[#f1f8ff] shadow-[inset_0_1px_0_#d9edff1a,0_4px_16px_#0313291a] backdrop-blur-[3px] [text-shadow:0_0_14px_#8ac7ff40]">
    <span ref={digitRef} className="block">{digit}</span>
  </span>
}

interface CountdownUnit {
  value: number
  label: string
  displayLabel?: string
}

export default function CountdownDigits({ units, className = '' }: { units: CountdownUnit[]; className?: string }) {
  return <div className={`relative isolate flex w-full items-end gap-1 before:pointer-events-none before:absolute before:-inset-x-4 before:inset-y-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_center,#04163080_0%,transparent_72%)] @max-[350px]:gap-0.5 ${className}`} aria-hidden="true">
    {units.map(unit => <Fragment key={unit.label}>
      {String(unit.value).padStart(2, '0').split('').map((digit, index) => <CountdownDigit key={index} digit={digit} />)}
      <span className="mb-1.5 w-3 shrink-0 text-center text-[11px] leading-none font-normal text-[#c8ddf5] [text-shadow:0_1px_6px_#031329]">{unit.displayLabel ?? unit.label}</span>
    </Fragment>)}
  </div>
}
