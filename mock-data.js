/**
 * 8/14 랜딩 전용 가짜 데이터.
 * 8/18에 이 파일 하나만 통째로 갈아끼운다. 그래서 mock 접두사를 붙인다.
 *
 * 상호는 전부 가상이다. 실제 가게에 없는 평가를 붙이지 않기 위해서다.
 * 일반 명사 조합은 실존 가능성이 높아 살짝 비틀어 지었다.
 */

/** 서로 다른 동네에 사는 별개의 사용자 2명. */
const mockUsers = [
  { id: 'u-ilsan', name: '준서', homeArea: '일산' },
  { id: 'u-seongsu', name: '수민', homeArea: '성수' },
];

/**
 * 재방문율 내림차순 정렬.
 * 비율은 저장하지 않는다 — revisitYes / revisitTotal로 계산한다.
 * 반올림값을 저장하면 8/25 도넛 차트에서 원본이 필요해진다.
 * tone: 색면 썸네일의 크림 3단계 인덱스 (0·1·2 순환)
 */
const mockRestaurants = [
  {
    id: 'r-1',
    name: '밀밭걸음',
    neighborhood: '정발산',
    area: '일산',
    revisitYes: 27,
    revisitTotal: 30,
    initial: '밀',
    tone: 0,
  },
  {
    id: 'r-2',
    name: '물결식당',
    neighborhood: '서울숲',
    area: '성수',
    revisitYes: 21,
    revisitTotal: 25,
    initial: '물',
    tone: 1,
  },
  {
    id: 'r-3',
    name: '등대상회',
    neighborhood: '마두',
    area: '일산',
    revisitYes: 18,
    revisitTotal: 23,
    initial: '등',
    tone: 2,
  },
  {
    id: 'r-4',
    name: '낮달분식',
    neighborhood: '뚝섬',
    area: '성수',
    revisitYes: 13,
    revisitTotal: 19,
    initial: '낮',
    tone: 0,
  },
  {
    id: 'r-5',
    name: '화요일의카레',
    neighborhood: '주엽',
    area: '일산',
    revisitYes: 9,
    revisitTotal: 16,
    initial: '화',
    tone: 1,
  },
  {
    id: 'r-6',
    name: '붉은벽돌수프',
    neighborhood: '연무장길',
    area: '성수',
    revisitYes: 6,
    revisitTotal: 14,
    initial: '붉',
    tone: 2,
  },
];

/**
 * 항해일지 5편 — 준서(일산) 3편, 수민(성수) 2편.
 * willRevisit은 'yes' | 'once' | 'maybe' 3상태다. 불린으로 줄이지 않는다.
 * 랜딩에는 'yes'만 노출한다. once·maybe는 8/25 도넛 차트에서 쓴다.
 */
const mockLogs = [
  {
    id: 'l-1',
    userId: 'u-ilsan',
    quote: '국물이 맑은데 끝이 묵직했다. 다음 주에 또 갔다.',
    restaurantName: '밀밭걸음',
    neighborhood: '정발산',
    date: '2026-08-12',
    willRevisit: 'yes',
  },
  {
    id: 'l-2',
    userId: 'u-seongsu',
    quote: '점심에 줄이 길길래 저녁에 갔다. 줄 설 만했다.',
    restaurantName: '물결식당',
    neighborhood: '서울숲',
    date: '2026-08-11',
    willRevisit: 'yes',
  },
  {
    id: 'l-3',
    userId: 'u-ilsan',
    quote: '반찬이 일곱 가지인데 하나도 남기지 않았다.',
    restaurantName: '등대상회',
    neighborhood: '마두',
    date: '2026-08-09',
    willRevisit: 'yes',
  },
  {
    id: 'l-4',
    userId: 'u-seongsu',
    quote: '떡볶이 국물에 밥을 비벼 먹으라고 숟가락을 먼저 준다.',
    restaurantName: '낮달분식',
    neighborhood: '뚝섬',
    date: '2026-08-07',
    willRevisit: 'yes',
  },
  {
    id: 'l-5',
    userId: 'u-ilsan',
    quote: '혼자 앉기 좋은 자리가 하나 있다. 그게 이 집의 메뉴다.',
    restaurantName: '화요일의카레',
    neighborhood: '주엽',
    date: '2026-08-05',
    willRevisit: 'yes',
  },
];

/** 아직 없는 기능. Coming Soon 뱃지로만 소개한다. */
const mockFeatures = [
  {
    title: 'AI 리뷰 요약',
    description: '여러 편의 항해일지를 한 줄로 압축한다. 긴 기록을 다시 읽지 않아도 된다.',
    releaseDate: '2026-08-21',
  },
  {
    title: '감성 분석',
    description: '글에 담긴 온도를 읽어 재방문 판정 옆에 나란히 둔다.',
    releaseDate: '2026-08-21',
  },
  {
    title: '항해 기록 대시보드',
    description: '또 갈 곳과 한 번이면 충분한 곳의 비율, 자주 쓴 표현을 한눈에 본다.',
    releaseDate: '2026-08-25',
  },
];
