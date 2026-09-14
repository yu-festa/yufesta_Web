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

## 접속 3초 후 실제 푸시 테스트

첫 화면의 테스트는 Vercel 함수 `api/push-test.ts`에서 Web Push를 보내고,
`public/push-sw.js`가 수신하여 기기의 알림을 표시하는 방식입니다.

### 배포 설정

1. 다음 명령으로 VAPID 키 쌍을 **한 번만** 생성합니다.

   ```sh
   npx web-push generate-vapid-keys
   ```

2. Vercel 프로젝트의 **Settings → Environment Variables**에 다음 두 값을 등록합니다.
   테스트할 배포 환경(Production 또는 Preview)에 모두 적용해야 합니다.
   - `VAPID_PUBLIC_KEY`: 출력된 Public Key
   - `VAPID_PRIVATE_KEY`: 출력된 Private Key
3. 환경변수를 저장한 후 이 브랜치의 코드를 새로 배포하거나 Redeploy합니다.
4. 배포된 HTTPS 주소에 접속합니다. 처음에는 **알림 허용하고 테스트**를 누르고
   브라우저 권한 요청을 허용합니다. 이미 구독한 기기는 다음 방문부터 자동으로 테스트합니다.

비밀키에는 `VITE_` 접두사를 붙이지 말고 Git에 올리지 마세요. 공개키만 API를 통해
브라우저로 전달됩니다. 설정 이름은 `.env.example`에서도 확인할 수 있습니다.
키를 바꾸면 기존 구독은 다시 연결해야 하며, 화면 버튼에서 재연결할 수 있습니다.

### 기대 동작과 제한

- 이미 연결된 기기는 페이지 진입, 처음 연결하는 기기는 권한 허용을 기준으로 3초를 계산합니다.
  구독 준비에 걸린 시간을 제외한 나머지 시간을 서버에서 기다렸다가 한 번 전송합니다.
- 최초 구독·서비스 워커 업데이트·네트워크·운영체제 상황에 따라 실제 도착은 3초보다 늦을 수 있습니다.
- 서버의 성공 응답은 푸시 서비스가 전송을 접수했다는 뜻입니다. 실제 `push` 이벤트 수신 후
  화면이 **푸시 수신 완료**로 바뀝니다. 알림을 누르면 앱 첫 화면으로 돌아옵니다.
- iPhone·iPad는 iOS/iPadOS 16.4 이상에서 Safari로 홈 화면에 추가한 앱을 실행해야 합니다.
- `npm run dev`와 `npm run preview`는 Vercel 함수를 실행하지 않으므로 실제 전송은 배포 주소에서
  확인합니다. 권한을 차단한 경우 사이트 또는 기기 설정에서 허용 후 새로고침해야 합니다.
- 구독을 데이터베이스에 저장하지 않는 일회성 테스트입니다. 테스트 종료 후에는 첫 화면의
  `PushNotificationTest` 연결과 API를 제거하거나 VAPID 환경변수를 제거하여 전송을 중지하세요.

### 자동 검증

Node.js 22.18 이상에서 `npm run test:push`를 실행합니다. 외부 전송은 모의 처리하며,
3초 대기·중복 없는 발송·비밀키 비공개·잘못된 대상 차단·만료/실패 응답·서비스 워커의
알림 표시 및 클릭 처리를 검증합니다. 실제 푸시 서비스와 기기 알림 표시까지의 전체 검증은
위 배포 절차를 따라 별도로 진행해야 합니다.
