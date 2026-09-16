# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## YU FESTA PWA

`vite-plugin-pwa` 설정은 `vite.config.ts`에서 관리합니다. 빌드할 때 매니페스트,
서비스 워커와 등록 스크립트가 생성되며, 앱은 `YU FESTA`라는 이름의 독립 창으로
실행되도록 설정되어 있습니다.

```sh
npm run build
npm run preview
```

미리보기 주소를 브라우저에서 열고 개발자 도구의 Application에서 Manifest와
Service Workers를 확인할 수 있습니다. 첫 방문 후 서비스 워커 활성화를 확인하고
새로고침한 다음, Network를 Offline으로 바꾸고 다시 새로고침하면 기본 화면의
오프라인 동작을 확인할 수 있습니다. 실제 설치와 실행은 배포한 HTTPS 주소에서도
확인해야 합니다.

- 개발 서버에서는 서비스 워커를 비활성화합니다. PWA 검증은 빌드 미리보기에서 합니다.
- 빌드에 포함된 HTML, JavaScript, CSS, 이미지, 폰트를 사전 캐시합니다.
  API 응답은 캐시하지 않으며 `/api` 경로는 앱 화면으로 대체하지 않습니다.
- 새 서비스 워커는 자동 활성화되고, 이전 버전의 불필요한 사전 캐시는 정리됩니다.
- `public/favicon.svg`와 PNG 아이콘은 임시 `YU` 이니셜입니다. 실제 브랜드 아이콘으로
  교체할 때는 192px, 512px, Apple용 180px 파일을 함께 변경하세요. 512px 아이콘은
  maskable 용도로도 사용하므로 중요한 내용은 중앙 안전 영역에 배치해야 합니다.

설정 참고: [Vite PWA 공식 가이드](https://vite-pwa-org.netlify.app/guide/).

## Splash → Main

앱을 새로 열거나 새로고침하면 스플래시가 표시됩니다. 제공된 이미지가 준비되면
1.8초 동안 표시한 뒤 0.4초 동안 페이드아웃하고 Main 기본 화면을 보여줍니다.
이미지 준비는 최대 4초만 기다리므로 요청이 멈춰도 메인 진입을 계속 막지 않습니다.
메인·타임테이블·응원·지도 사이의 해시 경로와 앱 시작 상태는 `src/App.tsx`에서 관리합니다.

- `src/pages/Splash.tsx`: 이미지와 표시 시간, 종료 처리, 기기 상단 테마 색상
- 스플래시 그라데이션과 반응형 배치는 `Splash.tsx`의 Tailwind 클래스로 관리합니다.
- `src/pages/Main.tsx`: 공연 안내, 인스타팅 배너, 타임테이블, 응원, 지도·분실물 바로가기
- `src/assets/Splash/`: 제공된 SplashLogo.svg와 YUICON.svg 원본

스플래시도 공통 최대 너비 480px를 사용하며, 넓은 화면에서는 가운데에 배치됩니다.
상단·하단 안전 영역을 고려하고, 스플래시가 떠 있는 동안 Main은 조작 및 스크린 리더
탐색 대상에서 제외됩니다. 기기 시계·배터리·상태 표시줄은 앱 내부에 복제하지 않습니다.

### 확인 방법

1. `npm run dev`로 실행하고 새로고침하여 스플래시의 이미지와 그라데이션을 확인합니다.
2. 이미지 준비 후 약 2.2초 뒤 스플래시가 사라지고 메인 홈 화면이 표시되는지 확인합니다.
3. 320px, 390px, 480px, 768px, 1440px에서 잘림과 가로 스크롤이 없는지 확인합니다.
4. `npm run build`와 `npm run lint`를 실행합니다.

## Main 홈 화면

`src/pages/Main.tsx`의 Tailwind 클래스로 메인 스타일을 관리합니다. 타임테이블 포스터와 응원 목록은
가로로 스크롤할 수 있으며, 나머지 페이지는 세로 스크롤을 사용합니다.
공연 안내·타임테이블·응원은 정적인 예시 데이터입니다.
결과 발표 타이머는 `src/utils/countdown.ts`의 `ANNOUNCEMENT_AT`을 기준으로 실시간 동작합니다.
현재 기준은 **2026년 10월 2일 오전 11시(한국 시간)**이며, 일·시간·분·초를 표시합니다.
백그라운드에서 돌아오면 실제 시각으로 보정하고, 예정 시간이 지나면 0에서 멈춥니다.
이 타이머는 발표 시각만 안내하며 결과 공개 여부를 서버에서 확인하는 기능은 아닙니다.
숫자 전환과 반지 움직임은 기기의 모션 줄이기 설정을 따릅니다.
`npm run test:countdown`으로 날짜·시간 경계와 종료 처리를 검증할 수 있습니다.
타임테이블, 응원, 지도 버튼은 해시 경로로 상세 화면을 엽니다.
알림, 신청, 분실물 버튼은 안내 창을 열고 실제 신청이나 전송은 하지 않습니다.
안내 창은 닫기 버튼, Escape 키, 바깥 영역 클릭으로 닫을 수 있습니다.

제공된 로고는 `src/assets/mainlogo.svg`, 나머지 이미지는 `src/assets/Main/`의 SVG를 사용합니다.
인스타팅 제목의 Rubik One은 [Google Fonts 원본](https://github.com/google/fonts/tree/main/ofl/rubikone)을
`src/assets/fonts/`에 라이선스와 함께 보관합니다. PWA 사전 캐시에 폰트도 포함됩니다.
INSTA-TING 배너 제목만 Rubik One을 사용하며, 나머지 문구와 카운트다운 숫자는
`index.html`의 Tailwind 클래스를 상속해 Pretendard를 사용합니다.
[Pretendard 공식 배포본](https://github.com/orioncactus/pretendard/tree/v1.3.9)의 가변 폰트와
라이선스도 같은 폴더에 포함해 외부 CDN 없이 사용할 수 있습니다.

### Tailwind 스타일 관리

`src/main.tsx`에서 Tailwind 패키지의 기본 스타일을
가져오며, 화면 스타일은 컴포넌트의 유틸리티 클래스로 지정합니다.
지도 라이브러리의 마커·툴팁 스타일은 `src/pages/FestivalMap.css`에서 관리합니다.
`src/layout/layoutTokens.ts`에서 최대 너비(480px)와 공통 패딩(20px)을 관리합니다.
패딩 없는 영역은 AppLayout의 `padded={false}`를 사용하고, 일반 페이지 안에서만
전체 너비가 필요하면 `w-[calc(100%+2*var(--app-content-padding))] -mx-(--app-content-padding)`를 사용합니다.
로컬 글꼴은 `src/fonts.ts`의 FontFace API로 등록합니다. 숫자와 반지 애니메이션은
`src/hooks/useMotion.ts`에서 Web Animations API로 실행하며 모션 줄이기 설정을 따릅니다.
작은 설명·날짜와 섹션 제목은 약 2px 키우고, 배너의 초소형 문구는 10~12px로 조정했습니다.

## 축제 지도

메인의 **축제 지도** 버튼 또는 `#map`으로 진입합니다. Leaflet과 OpenStreetMap을 사용해
API 키 없이 확대·이동할 수 있으며, 전체/공연장/화장실/배달존 필터와 장소 설명을 제공합니다.
지도 코드는 상세 화면에 진입할 때 불러옵니다.

- **현재 위치** 버튼을 누르면 브라우저 권한을 요청하고, 실제 좌표와 정확도 범위를 표시합니다.
  HTTPS 또는 localhost가 필요합니다. 위치 권한 거부·측정 실패·시간 초과를 안내하고 재시도할 수 있습니다.
  좌표를 별도로 저장하거나 서버에 전송하지 않고, 화면을 나가면 위치 구독을 해제합니다.
  지도 이동에 필요한 타일은 외부 지도 제공자에게 요청합니다.
- **축제 장소로** 버튼으로 캠퍼스에 돌아갑니다. 뒤로 가기와 해시 직접 진입을 지원합니다.
- 배경 타일은 온라인 연결이 필요합니다. 앱 서비스 워커에서 지도 타일을 사전 다운로드하지 않습니다.
  OpenStreetMap 출처 표기를 유지하고 [타일 이용 정책](https://operations.osmfoundation.org/policies/tiles/)을 따릅니다.

### 위치 데이터의 범위와 출처

`src/data/festivalMap.ts`에서 장소와 출처를 관리합니다. **2025년 가을축제 배치도는 확인하지 못했습니다.**
가을축제 자료라고 임의 표기하지 않고, 다음 확인 가능한 정보를 화면에서도 구분합니다.

- 공연장 2곳: [영대신문의 2025년 5월 26~28일 천마대동제 기사](https://yumedia.yu.ac.kr/news/articleView.html?idxno=23455)에
  나온 천연잔디축구장과 천마로 시계탑 인근 버스킹 구역입니다. 올해 운영 여부를 확정하는 정보가 아닙니다.
- 화장실 3곳: [교내 화장실 관련 기사](https://yumedia.yu.ac.kr/news/articleView.html?idxno=23152)에
  언급된 학생회관, 중앙도서관, 이종우과학도서관의 상설 시설입니다. 임시 화장실이나 야간 개방을 뜻하지 않습니다.
- 좌표: [영남대학교 공식 캠퍼스맵](https://www.yu.ac.kr/main/intro/campus-map.do)의 시설 대표 좌표입니다.
  건물 출입구나 개별 화장실의 좌표가 아닙니다. 확인일: 2026-09-16.
- **배달존은 공식 위치 자료를 확인하지 못해 데이터가 비어 있습니다.** 필터를 선택하면 위치 확인 중 안내를 보여줍니다.
  검증된 배치도가 확보되면 `category: 'delivery'` 장소와 출처를 추가하면 같은 마커·필터 동작이 적용됩니다.

`npm run test:map`으로 위치 갱신·권한 오류·구독 해제·잘못된 좌표·장소 필터를 검증합니다.
실제 기기의 GPS 정확도는 HTTPS로 접속한 휴대폰에서 별도로 확인해야 합니다.

## 기존 Web Push 구현

수신 확인이 완료된 푸시 테스트 화면과 접속 시 자동 발송 연결은 제거했습니다.
현재 첫 화면에서는 알림 권한 요청이나 푸시 테스트 요청을 보내지 않습니다.
기존 서버 API(`api/push-test.ts`), 서비스 워커(`public/push-sw.js`), 자동 테스트는 유지합니다.
구독 정보를 저장하거나 전체 사용자에게 일괄 전송하는 기능은 없습니다.

기존 API를 별도로 사용할 때는 같은 실행에서 생성한 VAPID_PUBLIC_KEY와 VAPID_PRIVATE_KEY를
Vercel 배포 환경에 등록하고 다시 배포해야 합니다. 비밀키는 클라이언트 코드나 Git에 넣지 않습니다.
선택 변수 VAPID_SUBJECT와 설정 이름은 `.env.example`을 참고하세요.

Node.js 22.18 이상에서 `npm run test:push`로 기존 API와 서비스 워커 동작을 검증합니다.
외부 푸시 전송은 모의 처리하므로 실제 기기의 알림 수신까지 검증하는 검사는 아닙니다.
