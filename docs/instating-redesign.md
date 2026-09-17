# 인스타팅 신청 · 결과 UI

## 디자인
- Figma 파일 `MoUDeXRChGAkoaEkDFquZC`의 신청 `131:2292`, 결과 카드 `131:2375`, 성공 `131:2665`, 실패 `131:2689`, 신청 완료 `131:2463`을 참고했다.
- 원본의 흰색 폼·탭·파스텔 카드 구성을 YU FESTA 블루로 적용했다. 기존 닉네임, 인스타그램, 성별, 나이대, 취향, 공연, 소개, 동의 항목과 3단계 흐름은 유지했다.
- 원본의 소 대신 기존 푸르마 원본(`bfa3a9c^:src/assets/Splash/YUICON.svg`)을 참조한 생성 이미지 2장을 사용한다.
- 닫기·복사 아이콘은 Figma에서 내려받은 원본이다.

## 진입 · 결과 공개
- 신청: `/instating/apply`, 마이페이지: `/main#profile`.
- 마이페이지 참여 내역에서 결과 조회: `/main#profile/result/<신청 ID>`.
- 결과가 발표된 경우에만 카드가 나타난다. 터치/클릭/Enter/Space로 총 5회 입력 후 성공 또는 실패 화면을 공개한다. 4회까지 상대 계정은 DOM에 렌더링하지 않는다.
- 결과 공개는 서버 접근 통제가 아닌 UI 연출이다. API 연결 시 로그인한 본인의 발표된 결과만 전달해야 한다.
- 대기 상태는 시간 미정 안내, 알 수 없는 ID는 내역 없음 안내를 표시한다.
- 모션 감소 설정에서는 카드·완료 애니메이션을 사용하지 않는다.

## API 연결 전 미리보기
- 신청은 한 번만 가능하다. 완료 후 마이페이지의 재신청 버튼을 없애고 메인 배너는 신청 내역 확인으로 바뀐다. 신청 URL 직접 접속 시에도 이미 신청했다는 안내를 표시한다.
- 저장 직전에 기존 내역을 다시 확인하며, 지원 브라우저에서는 Web Locks로 여러 탭의 제출을 직렬화한다. 저장 중 중복 클릭도 차단한다. 결과 체험용 내역은 신청 횟수에 포함하지 않는다.
- 현재 제한 범위는 같은 브라우저·사이트의 로컬 저장소다. API 연동 시 사용자 ID 기준의 서버 유일성 제약이 필요하다.
- 완료된 신청은 `yufesta.instating.applications.v1` localStorage에 저장하며, 마이페이지에 발표 대기로 표시한다. 로그인·서버 신청·매칭 처리는 아직 연결하지 않았다.
- 저장 실패 시 완료 화면으로 넘어가지 않고 오류를 표시한다.
- 기존 `VITE_PROFILE_PREVIEW`가 활성화된 경우 별도의 체험 내역으로 성공/실패/대기 상태를 확인할 수 있다. 예시 계정은 실제 Instagram으로 연결하지 않는다.
- 미리보기 비활성 시 비로그인의 프로필 및 결과 직접 진입은 로그인 화면으로 간다. 실제 로그인 사용자의 내역에는 로컬 미리보기 데이터를 섞지 않는다.
- 운영 연동 지점: `getCurrentProfileUser`, `InstatingParticipation.result`(`pending`, `matched`, `unmatched`), 신청 저장 함수. 발표 일정은 아직 미정이다.

## 생성 이미지
- 도구: 내장 `image_gen` (CLI/API 대체 경로 사용 안 함).
- 참조: `src/assets/Instating/purma-reference.png`.
- 성공: `src/assets/Instating/purma-success.png`.
- 실패: `src/assets/Instating/purma-unmatched.png`.
- 투명 배경 원본을 그대로 보존했다.

### 사용한 프롬프트

1. Use case: identity-preserve. Create a single website mascot illustration for a successful friendship match result card. Input reference is the existing Yeungnam University Purma mascot. Preserve recognizable identity exactly: cute white horse, long rounded muzzle, one curved ear, dark navy blue scalloped mane, small blue wing and tail, cyan hoof tips, thick very dark brown outlines, friendly black eyes. Change pose: centered full-body Purma joyfully hugging a coral-pink heart with both front hooves, two little floating hearts. Premium soft 3D clay illustration, rounded forms, clean silhouette and smooth matte material. Transparent background with true alpha. No stage, no lettering, no logo, no extra characters. Leave comfortable margin around full character. Square 1024 image.

2. Use case: identity-preserve. Create a single website mascot illustration for an unsuccessful friendship match result card. Input reference is existing Yeungnam University Purma mascot. Preserve recognizable identity exactly: cute white horse, long rounded muzzle, one curved ear, dark navy blue scalloped mane, small blue wing and tail, cyan hoof tips, dark brown outlines, friendly black eyes. Change pose: centered full-body Purma with gently drooping ears, slightly disappointed but kind reassuring expression, one small blue teardrop, holding a small pale blue heart close to chest. Cute premium soft 3D clay illustration matching a companion success asset, rounded smooth matte forms. Transparent background with true alpha. No stage, no lettering, no logo, no extra characters. Comfortable margin around full character. Square 1024 image.
