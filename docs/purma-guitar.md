# 랜딩 푸르마 이미지

- 파일: `src/assets/Landing/purma-guitar.png`
- 원본: 사용자가 첨부한 기타 연주 푸르마 이미지
- 처리: 내장 `image_gen` 도구로 외부 흰 배경 제거, 투명 PNG 저장
- 캐릭터와 기타 내부의 흰색은 유지. 랜딩 페이지에서만 사용.

## 편집 프롬프트

Use case: background-extraction. Edit target: the attached white-background illustration of Purma playing a blue electric guitar. Remove ONLY the exterior white/off-white paper background and output a PNG with genuine transparent alpha, NOT a checkerboard pattern or solid background. Preserve the exact existing character, pose, face, thick black outlines, guitar, colors, shapes, and all floating black musical notes and accent strokes. Crucially keep the opaque white fills INSIDE the character body, eyes and guitar pickguard; these white regions are part of the artwork and must not become transparent. Remove background in empty gaps between limbs and around the detached musical notes. Do not redraw, restyle, add anything or change composition. Clean antialiased edges without white halo for use over a dark navy starfield website. Fit all existing artwork in the frame with a modest transparent margin, no clipping.
