# 신규 운영자 API 연결

기준: 2026-09-26 운영 서버 admin OpenAPI 문서(`/v3/api-docs/admin`). 운영자 인증은 `/api/v1/auth/me`의 `STAFF` 또는 `OWNER` 역할을 사용합니다. 쓰기 요청에는 CSRF 토큰을 보냅니다. 전체 API 대조 결과는 [최신 점검 문서](./api-audit-2026-09-26.md)에 기록했습니다.

- `/admin#timetable`: `GET/POST /admin/timetable`, `PATCH/DELETE /admin/timetable/{id}`, `PATCH /times`, `PATCH /live`, `PATCH /delay`, `PUT /admin/timetable/order`를 연결했습니다. 무대는 공개 장소 목록의 STAGE를 참고하고 동아리는 관리자 동아리 목록에서 선택합니다.
- LIVE API는 true/false 수동 지정만 허용합니다. 수동 지정을 null로 지워 자동 시간 판정으로 복귀시키는 API는 현재 없습니다.
- `/admin#clubs`: `GET/POST /admin/clubs`, `PATCH/DELETE /admin/clubs/{id}`를 연결했습니다. 등록·수정 본문에서 제거된 `photoUrl`은 보내지 않습니다.
- 대표 사진은 `POST /admin/clubs/{id}/photo`의 multipart `file`로 업로드·교체하고 `DELETE /admin/clubs/{id}/photo`로 삭제합니다. JPEG·PNG, 빈 파일 여부, 10MB 제한을 전송 전에 검사합니다. 파일 선택 후 미리보기를 보여주고 저장 버튼을 눌렀을 때 전송합니다. 삭제 전 확인창을 표시합니다.
- 새 동아리는 정보 저장 성공 후 반환된 ID로 사진 편집 화면을 엽니다. 사진 저장 실패로 동아리 등록을 중복 실행하지 않습니다. 업로드 성공 응답 형태가 명세에 없으므로 업로드·삭제 후 동아리 목록을 재조회합니다.
- `/admin#places`: 최신 카테고리 `STAGE`, `TOILET`, `DELIVERY_ZONE`으로 장소 등록·수정을 처리합니다. 기존 부스·편의·안내 선택지는 제거했습니다.
- `/admin#moderation`: `GET /admin/content-reports`의 검토 상태·대상·페이지 필터, `PATCH /admin/content-reports/{id}/review`, `PATCH /admin/cheers/{id}/visibility`, `POST /admin/lost-items`, `PATCH /admin/lost-items/{id}/visibility`, `PATCH /admin/lost-items/{id}/resolve`를 연결했습니다.
- 신고 대상 필터에 `LOST_ITEM_COMMENT`(분실물 댓글)를 추가했습니다. 댓글·답글 신고도 검토 상태로 조회하고 검토 완료 처리할 수 있습니다.
- `PATCH /api/v1/admin/lost-items/{lostItemId}/comments/{commentId}/visibility`로 댓글·답글을 숨기거나 다시 공개합니다. 공개 분실물의 ‘댓글 관리’에서 해당 글의 댓글을 조회하거나 글 번호를 직접 입력합니다. 실행 전 글 번호·댓글 번호·공개 상태를 확인합니다.
- 댓글 신고 응답에는 원글 번호가 없어 신고에서 숨김/복구를 선택하면 댓글 번호를 채우고 글 번호 입력을 요청합니다. 숨긴 댓글도 두 번호를 직접 입력해 복구할 수 있습니다. 대상이 댓글일 때 글 자체의 숨김 API를 호출하지 않습니다.
- 숨긴 응원·분실물 전체를 조회하는 관리자 API는 없습니다. 공개 목록에는 공개된 최근 글만 보이며, 숨긴 글은 신고 목록의 대상 ID 또는 직접 입력한 ID로 재공개할 수 있습니다.
- 운영 서버에서는 공개 GET 응답만 확인했습니다. 등록·수정·삭제·신고 등 실제 쓰기 동작은 운영 데이터에 영향을 주므로 실행하지 않았습니다. 메서드, 경로, 요청 본문, CSRF 처리는 모의 응답 테스트로 검증했습니다.
