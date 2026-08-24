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

/**
 * Supabase **anon(publishable) 키**. service_role 키가 아니다.
 *
 * 카카오 JS 키와 같은 종류다 — 브라우저가 받아가는 값이라 숨길 수단이 없다.
 * 실제 방어는 Row Level Security가 한다. 도메인 허용목록이 카카오 키를 지키듯,
 * RLS가 이 키로 할 수 있는 일을 "공개 읽기 + 본인 행 쓰기"로 잠근다.
 *
 * service_role 키는 절대 여기 두지 않는다. 그건 RLS를 통째로 우회한다.
 *
 * Supabase 대시보드 > Settings > API 에서 복사한다. 최근 프로젝트는 anon JWT 대신
 * sb_publishable_... 형태를 주는데, 둘 다 createClient에 그대로 넣으면 된다.
 */
window.SUPABASE_URL = '';
window.SUPABASE_ANON_KEY = '';
