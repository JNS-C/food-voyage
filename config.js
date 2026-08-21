/**
 * 카카오 **JavaScript 키**. REST 키가 아니다.
 *
 * 이 파일은 커밋한다. JavaScript 키는 브라우저 노출이 전제된 키라 숨길 수단이
 * 없다 — 빌드로 주입해도 배포본에 그대로 실린다. 실제 방어는 Kakao Developers의
 * [앱] > [플랫폼 키] > [JavaScript 키] > JavaScript SDK 도메인이 한다.
 * 등록되지 않은 도메인에서의 요청은 401로 거절된다.
 *
 * 등록해 둘 도메인: http://localhost:8000 (로컬), 배포 URL.
 *
 * Gemini 키는 여기 두지 않는다. 그건 서버에서만 쓰는 진짜 비밀이라
 * Vercel 환경변수에 두고 브라우저는 /api/gemini만 호출한다 (PRD §4).
 */
window.KAKAO_JS_KEY = '047f4befc0612694f3e813d9aae22232';
