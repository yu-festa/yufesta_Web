import pretendardUrl from './assets/fonts/PretendardVariable.woff2'
import rubikOneUrl from './assets/fonts/RubikOne-Regular.ttf'

// 스타일은 Tailwind 클래스로 지정하고, 로컬 글꼴만 FontFace API로 등록합니다.
const faces = [
  new FontFace('Pretendard', `url(${pretendardUrl})`, { weight: '45 920', display: 'swap' }),
  new FontFace('Rubik One', `url(${rubikOneUrl})`, { weight: '400', display: 'swap' }),
]

for (const face of faces) document.fonts.add(face)
void Promise.allSettled(faces.map(face => face.load()))
