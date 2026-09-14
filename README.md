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
