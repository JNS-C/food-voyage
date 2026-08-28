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
 * 항해일지 5편 — 준서(일산) 3편, 수민(성수) 2편.
 * willRevisit은 'yes' | 'once' | 'maybe' 3상태다. 불린으로 줄이지 않는다.
 * 랜딩에는 'yes'만 노출한다. once·maybe는 8/25 도넛 차트에서 쓴다.
 *
 * ── quote를 고칠 때 ─────────────────────────────────────
 * 두 사람이 쓴 글이지 한 사람이 쓴 다섯 편이 아니다. 목소리를 갈라 둔다.
 *   준서 — 다체. 짧고 무뚝뚝하다.
 *   수민 — 요체. 상황을 한 번 더 설명한다.
 *
 * 다섯 편이 전부 같은 길이·같은 종결어미면 한 사람이 지어낸 티가 난다.
 * 그리고 **문장마다 결정적인 한 줄로 끝내지 않는다.** 실제 후기는 대부분
 * 그렇게 안 끝나고, 다섯 개가 연달아 그러면 광고 문구로 읽힌다.
 * 대신 각 편에 확인 가능한 구체값(시간·개수·가격)을 하나씩 둔다.
 * 무난했다는 말도 그대로 둔다 — 전부 극찬이면 그게 더 가짜다.
 *
 * 상호는 계속 가상이어야 한다(PRD §8-5). 실존 가게에 지어낸 평가를 붙이지 않는다.
 * 카드는 380px 폭에 25px 활자라 50자를 넘기면 카드가 세로로 길어진다.
 */
const mockLogs = [
  {
    id: 'l-1',
    userId: 'u-ilsan',
    quote: '국물이 맑길래 심심하겠다 싶었는데 끝맛이 묵직했다. 다음 주에 또 갔다.',
    restaurantName: '밀밭걸음',
    neighborhood: '정발산',
    date: '2026-08-12',
    willRevisit: 'yes',
  },
  {
    id: 'l-2',
    userId: 'u-seongsu',
    quote: '점심에 웨이팅 40분이라길래 돌아섰다가 저녁에 다시 왔어요. 여섯 시 전엔 바로 앉네요.',
    restaurantName: '물결식당',
    neighborhood: '서울숲',
    date: '2026-08-11',
    willRevisit: 'yes',
  },
  {
    id: 'l-3',
    userId: 'u-ilsan',
    quote: '반찬이 일곱 가지 나온다. 하나도 안 남겼더니 콩자반을 더 주셨다.',
    restaurantName: '등대상회',
    neighborhood: '마두',
    date: '2026-08-09',
    willRevisit: 'yes',
  },
  {
    id: 'l-4',
    userId: 'u-seongsu',
    quote: '떡볶이에 숟가락을 같이 주시길래 뭔가 했더니 국물에 밥 비벼 먹으래요. 공기밥 천 원.',
    restaurantName: '낮달분식',
    neighborhood: '뚝섬',
    date: '2026-08-07',
    willRevisit: 'yes',
  },
  {
    id: 'l-5',
    userId: 'u-ilsan',
    quote: '카레는 무난하다. 근데 혼자 앉기 좋은 창가 자리가 있어서 또 가게 된다.',
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
