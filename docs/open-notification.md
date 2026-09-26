# 랜딩 오픈 알림

- 실제 오픈 알림 발송 시각: **2026-10-02 10:00:00 한국 시간** (`2026-10-02T01:00:00Z`).
- 실제 축제 랜딩 종료 시각은 **10월 2일 0시**로 유지합니다. 알림 발송 시각과 별개이며, 알림을 클릭하면 `/main`으로 이동합니다.
- 비로그인 사용자가 랜딩의 ‘오픈 알림 받기’를 누르고 알림 권한을 허용하면 해당 브라우저의 푸시 구독을 QStash에 예약합니다. QStash의 저장 응답을 받은 뒤에만 버튼에 ‘알림 신청 완료’를 표시합니다. 버튼 아래 날짜·테스트 모드·신청 완료 안내 문구는 표시하지 않으며, 권한 안내나 실패 메시지는 유지합니다.
- QStash가 지정 시각 이후 Vercel 발송 함수를 호출하므로 사용자가 페이지를 닫아도 동작합니다. 장치 전원·인터넷·알림 설정 등에 따라 실제 표시 시각은 늦어질 수 있습니다. 초 단위의 도착을 보장하지 않습니다.

## 최초 설정

1. [Upstash Console](https://console.upstash.com/)에 로그인하여 **QStash**를 엽니다. Redis 데이터베이스는 이 구현에 필요하지 않습니다.
2. QStash의 토큰 및 서명키를 아래 이름으로 Vercel 프로젝트 → Settings → Environment Variables의 **Production**에 등록합니다. 비밀값은 채팅이나 Git에 올리지 않습니다.
3. 기존 테스트 푸시에서 쓰던 VAPID 키 쌍을 유지합니다. 서버 설정을 마친 뒤 이 코드가 포함된 Production 배포를 생성합니다. 환경변수만 등록해도 기존 배포가 자동 갱신되지는 않습니다.

| 환경변수 | 값 |
| --- | --- |
| `QSTASH_TOKEN` | QStash 토큰 |
| `QSTASH_CURRENT_SIGNING_KEY` | QStash 현재 서명키 |
| `QSTASH_NEXT_SIGNING_KEY` | QStash 다음 서명키 |
| `VAPID_PUBLIC_KEY` | 기존 공개키 |
| `VAPID_PRIVATE_KEY` | 기존 비밀키 |
| `VAPID_SUBJECT` | 기존 설정 유지, 선택 사항 |
| `PUSH_PUBLIC_ORIGIN` | 실제 Production 기본 도메인, 예: `https://yufesta.com` (경로·마지막 `/` 생략) |
| `PUSH_OPEN_AT` | `2026-10-02T10:00:00+09:00` |
| `PUSH_OPEN_MODE` | `opening` |

- 환경변수에 `VITE_` 접두사를 붙이지 않습니다. 비밀키·QStash 토큰·서명키가 클라이언트 번들에 포함되면 안 됩니다.
- `PUSH_PUBLIC_ORIGIN`은 리다이렉트 없이 API에 접근할 수 있는 배포 도메인으로 설정합니다. Vercel Deployment Protection이 활성화돼 외부 호출을 차단하는 Preview 주소는 사용하지 않습니다.
- Vercel Cron 설정은 필요하지 않습니다. QStash의 `notBefore`로 구독별 일회성 작업을 저장합니다. Hobby Cron의 시간 단위 오차를 피하는 방식이지만 QStash·네트워크·OS 전달 지연까지 없애지는 못합니다.

## 기기 테스트 순서

1. 새 코드가 배포된 사이트를 홈 화면에 추가합니다. iPhone/iPad는 추가한 홈 화면 앱에서 실행해야 합니다.
2. 랜딩에서 **오픈 알림 받기**를 누르고 알림을 허용합니다.
3. 버튼이 **알림 신청 완료**로 바뀌는지 확인합니다. 버튼만 누르거나 알림 권한만 허용한 상태는 예약 완료가 아닙니다. 예약 시각은 `GET /api/open-notification` 응답의 `sendAt`과 QStash에서 확인합니다.
4. 사이트를 닫고 기기의 인터넷·알림 허용을 유지합니다.
5. 10월 2일 오전 10시 이후 ‘YU FESTA가 열렸어요!’ 알림을 확인하고 누르면 `/main`이 열리는지 확인합니다.
6. QStash의 Messages/Logs에서 예약과 전달 결과를 확인합니다. Vercel의 `/api/open-notification-deliver` 로그에서는 응답 상태를 확인합니다. 구독 원문·키는 로그에 남기지 않습니다.

예약 시각 10초 전부터 신규 신청을 마감합니다. 이미 시각이 지났다면 `PUSH_OPEN_AT`을 미래 시각으로 변경하고 재배포한 뒤 다시 신청합니다. 기존 예약은 자동 이동되지 않습니다. 서버 시각·모드가 달라진 기존 작업은 발송 시 건너뜁니다.

## 실제 오픈 알림으로 전환

- `PUSH_OPEN_AT=2026-10-02T10:00:00+09:00`
- `PUSH_OPEN_MODE=opening`
- 변경 후 Production 재배포 및 실제 오픈 알림 재신청 필요. 테스트 신청을 실제 오픈 신청으로 자동 전환하지 않습니다.
- 코드 기본값보다 Vercel 환경변수가 우선합니다. 기존 테스트 시각과 `test` 모드가 등록돼 있으면 위 두 값으로 변경하고 수정 코드와 함께 재배포합니다.

## 구현 및 제한

- `GET /api/open-notification`: 공개키, 발송 시각, 테스트/실제 모드, 신청 가능 여부만 반환합니다. 설정 누락은 503으로 알리며 성공처럼 표시하지 않습니다.
- `POST /api/open-notification`: 같은 출처의 JSON 요청과 유효한 브라우저 푸시 구독을 검사하고 QStash 예약을 생성합니다. 클라이언트가 발송 시각·문구·목적지를 임의로 변경할 수 없습니다.
- `POST /api/open-notification-deliver`: QStash 서명·본문·수신 URL을 검증하고 예정 시각 이후 Web Push를 발송합니다. 만료된 구독(404/410), 변경된 캠페인, 한 시간 이상 지난 작업은 건너뜁니다. 일시 오류는 QStash가 최대 3회 재시도합니다.
- 구독 주소와 암호화 키는 VAPID 비밀키에서 용도별로 도출한 별도 AES-GCM 키로 암호화하여 예약 메시지에 보관합니다. **예약 이후 VAPID 비밀키를 바꾸면 해당 작업을 복호화할 수 없으므로 키를 유지합니다.**
- 서버의 10분 중복 예약 방지와 브라우저의 신청 완료 기록, 알림의 동일 태그를 사용합니다. QStash는 at-least-once 전달이므로 별도 저장소 기반의 엄밀한 exactly-once 보장은 없습니다. 사이트 데이터 삭제나 반복적인 장시간 재신청은 새 예약을 만들 수 있습니다.
- 이 화면의 구독은 로그인 계정이 아닌 기기/브라우저 단위입니다. 알림 권한을 해제하면 수신하지 않습니다. 서비스 내 개별 예약 취소 UI는 아직 제공하지 않습니다.
- QStash 무료 플랜의 최대 지연 7일에 맞춰 7일 이내만 신청받습니다. 메시지 수·요금 한도는 사용 중인 QStash 플랜에서 확인합니다.
- 일반 `npm run dev`는 Vite 프론트만 실행하므로 `/api/open-notification` 서버 함수를 실행하지 않습니다. 실제 예약은 환경변수가 설정된 Vercel 배포에서 확인합니다.

## 검증

- Vercel 함수 빌드가 읽는 루트 `tsconfig.json`에 `rewriteRelativeImportExtensions`를 설정했습니다. 배포 파일에서 `pushSchedule.ts`를 찾던 500 오류를 막고, 변환된 `pushSchedule.js`를 불러오도록 합니다.
- `npm run test:push`: 기존 테스트 푸시 13개와 예약·서명·암호화·시각·오류 처리 10개, 빌드된 서버 모듈 실행 1개를 포함한 총 24개.
- 프로덕션 빌드 및 린트 검사.
- 9월 26일 테스트 알림 수신은 사용자 확인 완료. 10월 2일 실제 발송 예약은 환경변수 변경·Production 재배포 후 다시 신청해야 합니다.

참고: [QStash 절대 시각 지연](https://upstash.com/docs/qstash/features/delay), [서명 검증](https://upstash.com/docs/qstash/howto/signature), [중복 처리 범위](https://upstash.com/docs/qstash/features/deduplication), [Vercel Cron 시간 제한](https://vercel.com/docs/cron-jobs/usage-and-pricing).
