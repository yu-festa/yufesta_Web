import mainLogo from '../assets/mainlogo.svg'
import type { TimetableSlot } from '../api/timetable.ts'
import { buildTimetable, festivalTitle } from '../data/timetable.ts'

export async function downloadTimetableImage(slots: TimetableSlot[]) {
  await Promise.all([400, 500, 700].map(weight => document.fonts.load(`${weight} 15px Pretendard`)))
  const logo = new Image()
  logo.src = mainLogo
  await logo.decode()

  const { layout, shapes } = buildTimetable(slots)
  const width = layout.width
  const headerHeight = 128
  const height = Math.ceil(headerHeight + layout.height)
  const scale = 3
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const context = canvas.getContext('2d')
  if (!context) throw new Error('타임테이블 이미지를 만들 수 없습니다.')

  context.scale(scale, scale)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(logo, 8, 10, 152, 56)
  context.font = '500 19px Pretendard, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#111111'
  context.fillText(festivalTitle, width / 2, 92)
  context.translate(0, headerHeight)

  for (const shape of shapes) {
    context.save()
    context.fillStyle = shape.fill
    if (shape.kind === 'rect') {
      if (shape.shadow) {
        context.shadowColor = '#00000033'
        context.shadowBlur = 3 * scale
        context.shadowOffsetX = 2 * scale
        context.shadowOffsetY = 3 * scale
      }
      context.fillRect(shape.x, shape.y, shape.width, shape.height)
    } else if (shape.kind === 'circle') {
      context.beginPath()
      context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
      context.fill()
    } else {
      context.font = `${shape.weight} ${shape.size}px Pretendard, sans-serif`
      context.textAlign = shape.anchor === 'middle' ? 'center' : 'right'
      context.fillText(shape.text, shape.x, shape.y)
    }
    context.restore()
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('타임테이블 이미지를 만들 수 없습니다.')), 'image/png')
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${festivalTitle}_타임테이블.png`
  document.body.appendChild(link)
  try { link.click() }
  finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
