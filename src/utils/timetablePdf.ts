import { jsPDF } from 'jspdf'
import mainLogo from '../assets/mainlogo.svg'
import { festivalTitle, getTimetableShapes, timetableHeight, timetableLayout } from '../data/timetable'

export async function downloadTimetablePdf() {
  // Canvas에 로컬 한글 글꼴을 렌더링해 PDF에서도 글자가 깨지지 않게 합니다.
  await Promise.all([document.fonts.load('400 15px Pretendard'), document.fonts.load('500 15px Pretendard')])
  const logo = new Image()
  logo.src = mainLogo
  await logo.decode()

  const width = timetableLayout.width
  const headerHeight = 128
  const height = Math.ceil(headerHeight + timetableHeight)
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

  for (const shape of getTimetableShapes()) {
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
    } else {
      context.font = `${shape.weight} ${shape.size}px Pretendard, sans-serif`
      context.textAlign = shape.anchor === 'middle' ? 'center' : 'right'
      context.fillText(shape.text, shape.x, shape.y)
    }
    context.restore()
  }

  // 긴 한 페이지로 저장해 화면 밖 공연과 자정 이후 일정도 잘리지 않습니다.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width, height], hotfixes: ['px_scaling'], compress: true })
  pdf.setProperties({ title: `${festivalTitle} 타임테이블`, creator: 'YU FESTA' })
  pdf.addImage(canvas, 'PNG', 0, 0, width, height, undefined, 'FAST')
  await pdf.save(`${festivalTitle}_타임테이블.pdf`, { returnPromise: true })
}
