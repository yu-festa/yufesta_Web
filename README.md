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

## 첫 접속 및 축제 시작 전환

스플래시는 같은 브라우저·사이트 주소에서 최초 1회 표시됩니다. 방문 기록은 localStorage에
저장하므로 새로고침, 새 탭, 재방문, 로그인 복귀 시에는 반복하지 않습니다. 사이트 데이터
삭제 또는 시크릿 브라우저에서는 다시 표시될 수 있고, 영구 저장소가 차단되면 세션 저장소를 사용합니다.
제공된 이미지가 준비되면 1.8초 동안 표시한 뒤 0.4초 동안 페이드아웃합니다.

일반 루트(`/`) 접속은 로그인 여부와 관계없이 2026년 10월 2일 0시(한국 시간) 전에는
랜딩을 표시합니다. 카운트다운이 끝나면 화면과 주소가 `/main`으로 전환됩니다.
시작 이후에는 루트 재방문·뒤로 가기에도 랜딩을 표시하지 않으며 로그인·로그아웃 후에도
메인으로 이동합니다. 로그인 성공의 리다이렉트 주소는 `/main`이며,
서버 권한이 `STAFF`·`OWNER`인 계정은 확인 직후 `/admin`으로 이동합니다.
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

1. 방문 기록이 없는 브라우저에서 첫 접속 시 스플래시가 표시되고, 새로고침·새 탭에는 생략되는지 확인합니다.
2. 스플래시 종료 후 시작 전에는 랜딩, 시작 이후에는 `/main`이 표시되는지 확인합니다. `npm run test:launch`로 시각 경계와 방문 기록 처리를 검사합니다.
3. 320px, 390px, 480px, 768px, 1440px에서 잘림과 가로 스크롤이 없는지 확인합니다.
4. `npm run build`와 `npm run lint`를 실행합니다.

## 운영자 센터

소셜로그인 후 `/api/v1/auth/me`의 `role`로 사용자와 운영자를 구분합니다.
`USER`는 `/main`, `STAFF`·`OWNER`는 `/admin`으로 이동합니다. 이메일 목록이나
로컬 저장소로 운영 권한을 부여하지 않으며, 계정 등록은 백엔드에서 진행합니다.
비로그인의 `/admin` 접근은 로그인 화면으로 연결하고, 일반 계정에는 접근 불가 안내를 표시합니다.
축제 시작 전 일반 루트(`/`) 접속의 랜딩 및 브라우저 최초 1회 스플래시 동작은 유지합니다.

- **인스타팅**: 회차 목록·배치 결과 조회, 접수 시작, 마감 및 매칭 실행, 재실행,
  발표, 시각 수정. 발표는 `OWNER` 전용이며 발표 완료 후 수정·재실행을 차단합니다.
- **신고 검토**: 미검토·검토 완료·전체 필터, 페이지 이동, 제재 확정·기각·재검토.
- **공지**: 최근 50건 조회, ID로 상세 조회, 등록·수정·삭제, 긴급 배너 여부 저장.
  배너 값은 서버에 저장하며, 일반 메인 상단의 공연 안내는 기존 예시 UI를 유지합니다.
- **장소·이벤트**: 공개 장소 목록·상세, 장소 등록·수정·노출 설정, 이벤트 등록·수정.
  현재 명세에는 비공개 장소 조회와 장소·이벤트 삭제 API가 없습니다.
  장소 수정 시 조회되지 않는 표시 순서는 직접 입력합니다. 이 화면에서 저장한 응답은
  머무르는 동안 재사용하며, 비공개 장소를 떠난 후 다시 불러오는 기능은 제공하지 않습니다.

2026-09-24 기준 [관리자 Swagger](https://api.yufesta.com/swagger-ui/index.html?urls.primaryName=admin)의
16개 연산을 `src/api/admin.ts`에 연결했습니다. 한국 시간으로 일정을 입력하며 접수 시작 < 마감,
발표 − 마감 = 10분을 검사합니다. 모든 쓰기는 공통 클라이언트의 쿠키·CSRF 처리를 사용합니다.
401·403에서 운영 권한을 재확인하며, 실패한 쓰기를 자동 재전송하지 않습니다.

`npm run test:admin`은 요청 경로·본문·CSRF·권한·시각 제약을 모의 응답으로 검증합니다.
운영 계정 로그인과 실제 배치·발표·신고 제재는 배포 후 해당 서버에서 최종 확인해야 합니다.
로컬 UI 검증에서는 운영 데이터에 변경 요청을 보내지 않습니다.

## Main 홈 화면

인스타팅은 사용자 API에 연결되어 있습니다. 신청·취소·재참여·결과·신고 연결 범위와
미확인 응답 구조는 [인스타팅 API 연동 기록](docs/match-api-integration.md)을 참고하세요.

`src/pages/Main.tsx`의 Tailwind 클래스로 메인 스타일을 관리합니다. 타임테이블 포스터와 응원 목록은
가로로 스크롤할 수 있으며, 나머지 페이지는 세로 스크롤을 사용합니다.
공연 안내·타임테이블·응원은 정적인 예시 데이터입니다.
결과 발표 타이머는 `src/utils/countdown.ts`의 `ANNOUNCEMENT_AT`을 기준으로 실시간 동작합니다.
서버 요약 API의 발표 시각을 우선 사용하고, 값이 없으면 **2026년 10월 2일 오전 11시(한국 시간)**를 사용합니다.
배너는 시·분·초만 표시하며, 남은 날짜는 시간에 합산합니다(1일 2시간 → 26시).
백그라운드에서 돌아오면 실제 시각으로 보정하고, 예정 시간이 지나면 0에서 멈춥니다.
이 타이머는 발표 시각만 안내하며 결과 공개 여부를 서버에서 확인하는 기능은 아닙니다.
숫자 전환과 반지 움직임은 기기의 모션 줄이기 설정을 따릅니다.
`npm run test:countdown`으로 날짜·시간 경계와 종료 처리를 검증할 수 있습니다.
타임테이블, 응원, 지도 버튼은 해시 경로로 상세 화면을 엽니다.
인스타팅 신청은 서버에 전송하며, 신청 내역과 결과는 마이페이지에서 확인합니다.
알림 버튼은 안내 창을 열고, 분실물 버튼은 게시판으로 이동합니다.
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
지도 마커 스타일은 `src/hooks/useKakaoFestivalMap.ts`의 Tailwind 클래스로 관리합니다.
`src/layout/layoutTokens.ts`에서 최대 너비(480px)와 공통 패딩(20px)을 관리합니다.
패딩 없는 영역은 AppLayout의 `padded={false}`를 사용하고, 일반 페이지 안에서만
전체 너비가 필요하면 `w-[calc(100%+2*var(--app-content-padding))] -mx-(--app-content-padding)`를 사용합니다.
로컬 글꼴은 `src/fonts.ts`의 FontFace API로 등록합니다. 숫자와 반지 애니메이션은
`src/hooks/useMotion.ts`에서 Web Animations API로 실행하며 모션 줄이기 설정을 따릅니다.
작은 설명·날짜와 섹션 제목은 약 2px 키우고, 배너의 초소형 문구는 10~12px로 조정했습니다.

## 축제 지도

메인의 **축제 지도** 버튼 또는 `#map`으로 진입합니다. 카카오맵 JavaScript SDK를 사용하며,
전체/공연장/화장실/배달존 필터와 장소 설명을 제공합니다. SDK는 지도 화면 진입 시 한 번 불러옵니다.

`.env.local`의 `VITE_KAKAO_MAP_KEY`에 카카오 JavaScript 키를 설정합니다.
카카오디벨로퍼스에서 카카오맵 사용 설정을 ON으로 하고, 해당 키의 JavaScript SDK 도메인에
`http://localhost:5173`, `http://127.0.0.1:5173`과 실제 배포 도메인인
`https://yufesta.com`, `https://www.yufesta.com`을 등록하세요. 다른 로컬 포트를 사용한다면 해당 주소도 등록합니다.
Vercel의 Settings > Environment Variables에 `VITE_KAKAO_MAP_KEY`를 등록하고 Production 환경에
적용한 뒤 다시 배포해야 합니다. Preview 배포를 검사하려면 해당 환경과 도메인도 별도로 설정합니다.
로컬에서는 환경변수 수정 후 개발 서버를 재시작합니다. 로컬 키 파일은 Git에서 제외됩니다.
키·도메인·사용 설정은 [카카오맵 공식 안내](https://apis.map.kakao.com/web/guide/)를 참고하세요.

배포 직전에 열어 둔 페이지가 이전 지도 JavaScript 파일을 요청하면 로딩 오류가 날 수 있습니다.
이때 흰 화면 대신 새로고침·돌아가기 안내를 표시합니다. `vercel.json`은 실제 화면 경로만
`index.html`로 연결하고, 없는 `/assets` 파일은 HTML로 대체하지 않습니다. 앱 HTML은 `no-cache`로
재검증하며 PWA에서도 `/assets` 요청을 앱 화면으로 대체하지 않습니다.

### 현재 위치와 직선 거리

장소를 선택한 뒤 **현재 위치와 거리 확인**을 누르면 브라우저의 `navigator.geolocation`으로 위치 권한을 요청합니다. 현재 위치와 장소 핀을 함께 보여주고, 두 좌표 사이의 직선 거리를 브라우저에서 계산합니다. 위치가 갱신되면 마커와 거리도 갱신됩니다.

- 지도 표시에는 기존 JavaScript 키만 사용하며, REST API 키나 경로 조회 서버가 필요하지 않습니다.
- 거리는 미터 또는 킬로미터로 표시합니다. 실제 보행 거리·예상 시간·경로선은 제공하지 않습니다.
- 핀은 건물 대표 위치입니다. 실내 화장실은 층별 안내에서 확인합니다.

- **현재 위치** 버튼을 누르면 브라우저 권한을 요청하고, 실제 좌표와 정확도 범위를 표시합니다.
  HTTPS 또는 localhost가 필요합니다. 위치 권한 거부·측정 실패·시간 초과를 안내하고 재시도할 수 있습니다.
  좌표를 별도로 저장하거나 서버에 전송하지 않고, 화면을 나가면 위치 구독을 해제합니다.
  지도 이동에 필요한 타일은 외부 지도 제공자에게 요청합니다.
- **축제 장소로** 버튼으로 캠퍼스에 돌아갑니다. 뒤로 가기와 해시 직접 진입을 지원합니다.
- 배경 타일은 온라인 연결이 필요합니다. 앱 서비스 워커에서 지도 타일을 사전 다운로드하지 않습니다.
  카카오맵 SDK가 제공하는 로고와 저작권 표기를 유지합니다.

### 위치 데이터의 범위와 출처

`src/data/festivalMap.ts`에서 장소와 출처를 관리합니다. **2025년 가을축제 배치도는 확인하지 못했습니다.**
가을축제 자료라고 임의 표기하지 않고, 다음 확인 가능한 정보를 화면에서도 구분합니다.

- 공연장 2곳: [영대신문의 2025년 5월 26~28일 천마대동제 기사](https://yumedia.yu.ac.kr/news/articleView.html?idxno=23455)에
  나온 천연잔디축구장과 천마로 시계탑 인근 버스킹 구역입니다. 올해 운영 여부를 확정하는 정보가 아닙니다.
- 화장실 안내 건물 8곳: 공식 도서관 도면에서 실내 위치를 확인한 19개 항목과 캠퍼스맵에 층이 명시된 7개 항목을 안내합니다.
  학생회관·박물관은 건물만 확인된 상태로 구분합니다. 모든 화장실을 포함한 목록이나 축제·야간 개방 안내는 아닙니다.
  [조사 기록과 원본 출처](docs/restroom-sources.md)에 건물별 확인 범위와 미확인 내용을 정리했습니다.
- 좌표: [영남대학교 공식 캠퍼스맵](https://www.yu.ac.kr/main/intro/campus-map.do)의 시설 대표 좌표입니다.
  건물 출입구나 개별 화장실의 좌표가 아닙니다. 확인일: 2026-09-16.
- **배달존은 공식 위치 자료를 확인하지 못해 데이터가 비어 있습니다.** 필터를 선택하면 위치 확인 중 안내를 보여줍니다.
  검증된 배치도가 확보되면 `category: 'delivery'` 장소와 출처를 추가하면 같은 마커·필터 동작이 적용됩니다.

화장실 핀의 **상세 위치 보기** 또는 **화장실 건물·층별 목록**에서 건물을 검색하고 층·남녀 구분으로 필터링할 수 있습니다.
`src/data/restrooms.ts`의 상세 정보를 지도 핀과 연결하며, 각 층의 공식 도면은 새 탭에서 확인합니다.
호실 번호가 확인되지 않은 곳은 추정하지 않습니다. 상경관 등 상세 자료를 확보하지 못한 건물은 목록에서 미확인으로 표시합니다.

`npm run test:map`으로 위치 갱신·권한 오류·구독 해제·잘못된 좌표·장소 필터와 화장실 층별 필터·출처·미확인 정보 처리를 검증합니다.
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
