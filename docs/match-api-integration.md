# 인스타팅 사용자 API 연결

2026-09-24 public OpenAPI 명세를 확인하고 실제 응답 구조로 갱신했습니다.
전체 27개 공개 API의 연결 화면, 동작, 운영 확인 사항은 [공개 API 연결 내역](./public-api-integration.md)을 참고하세요.

## 기존 임시 계약에서 바뀐 부분

- 결과는 cards가 아닌 partners 배열입니다. 나이대·소개·태그·공통 태그와 서버의 카드 순서를 사용합니다.
- canRejoin, hasNextRoundApplication, nextRoundSeq를 이용해 재참여와 다음 회차 상태를 표시합니다.
- 신청 수정 PATCH /api/v1/match/applications/me를 연결했습니다.
- 닉네임 2~8자, 나이대·태그 선택 사항, 소개 40자, 태그 최대 3개 조건을 반영했습니다.
- 신고 사유는 PROFILE / FAKE / OTHER이며 상세 설명은 선택 사항, 최대 500자입니다.
- 신규 신청과 재참여의 성공 응답은 MatchApplication, 신고는 ID·matchId·reason·createdAt을 포함하는 응답으로 타입을 정의했습니다.
- 약관·개인정보 버전은 기존 2026-09-01을 유지합니다. 서버가 실제 사용하는 버전 변경 시 함께 갱신해야 합니다.

404(현재 신청 없음), 409(결과 발표 전), 실제 조회 실패를 구분합니다. 모든 쓰기 요청은 인증 쿠키와 CSRF 처리 경로를 사용하며 성공 후에만 완료 상태를 표시합니다.
