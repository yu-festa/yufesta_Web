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
페이지 내부 이동을 위한 라우터는 아직 없으며, 앱 시작 상태는 `src/App.tsx`에서 관리합니다.

- `src/pages/Splash.tsx`: 이미지와 표시 시간, 종료 처리, 기기 상단 테마 색상
- `src/pages/Splash.css`: 지정된 그라데이션, 반응형 이미지 배치, 모션 줄이기 설정
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

`src/pages/Main.css`에서 메인 스타일을 관리합니다. 타임테이블 포스터와 응원 목록은
가로로 스크롤할 수 있으며, 나머지 페이지는 세로 스크롤을 사용합니다.
현재 공연 안내·남은 시간·타임테이블·응원은 정적인 예시 데이터입니다.
알림, 신청, 타임테이블, 응원, 지도, 분실물 버튼은 안내 창을 열고 실제 신청이나 전송은 하지 않습니다.
안내 창은 닫기 버튼, Escape 키, 바깥 영역 클릭으로 닫을 수 있습니다.

제공된 로고는 `src/assets/mainlogo.png`, 나머지 이미지는 `src/assets/Main/`을 사용합니다.
인스타팅 제목의 Rubik One은 [Google Fonts 원본](https://github.com/google/fonts/tree/main/ofl/rubikone)을
`src/assets/fonts/`에 라이선스와 함께 보관합니다. PWA 사전 캐시에 폰트도 포함됩니다.

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
