# 신규 운영자 API 연결

기준: 2026-09-24 운영 서버 admin OpenAPI 문서(`/v3/api-docs/admin`). 운영자 인증은 `/api/v1/auth/me`의 `STAFF` 또는 `OWNER` 역할을 사용합니다. 쓰기 요청에는 CSRF 토큰을 보냅니다.

- `/admin#timetable`: `GET/POST /admin/timetable`, `PATCH/DELETE /admin/timetable/{id}`, `PATCH /times`, `PATCH /live`, `PATCH /delay`, `PUT /admin/timetable/order`를 연결했습니다. 무대는 공개 장소 목록의 STAGE를 참고하고 동아리는 관리자 동아리 목록에서 선택합니다.
- LIVE API는 true/false 수동 지정만 허용합니다. 수동 지정을 null로 지워 자동 시간 판정으로 복귀시키는 API는 현재 없습니다.
- `/admin#clubs`: `GET/POST /admin/clubs`, `PATCH/DELETE /admin/clubs/{id}`를 연결했습니다. 사진 업로드 API는 없어 대표 사진 URL을 입력합니다.
- `/admin#moderation`: `GET /admin/content-reports`의 검토 상태·대상·페이지 필터, `PATCH /admin/content-reports/{id}/review`, `PATCH /admin/cheers/{id}/visibility`, `POST /admin/lost-items`, `PATCH /admin/lost-items/{id}/visibility`, `PATCH /admin/lost-items/{id}/resolve`를 연결했습니다.
- 숨긴 응원·분실물 전체를 조회하는 관리자 API는 없습니다. 공개 목록에는 공개된 최근 글만 보이며, 숨긴 글은 신고 목록의 대상 ID 또는 직접 입력한 ID로 재공개할 수 있습니다.
- 운영 서버에서는 공개 GET 응답만 확인했습니다. 등록·수정·삭제·신고 등 실제 쓰기 동작은 운영 데이터에 영향을 주므로 실행하지 않았습니다. 메서드, 경로, 요청 본문, CSRF 처리는 모의 응답 테스트로 검증했습니다.
