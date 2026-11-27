import type { Application, PortfolioPage, Posting } from './JobSiteStatus'

// shortcut: 대본 데이터(src/data)에 취업 사이트 칸이 생기기 전까지 쓰는 임시 값. 칸이 생기면 그쪽에서 넘긴다.
// 회사 이름은 모두 지어낸 가상 이름이다. 실제 회사와 겹치는지는 확인하지 못했다.

const ROLES = [
  '브랜드 디자이너',
  'UX/UI 디자이너',
  '그래픽 디자이너',
  '편집 디자이너',
  '콘텐츠 디자이너',
]

const COMPANIES = [
  '늘봄디자인',
  '파란섬스튜디오',
  '온새미랩',
  '모아그래픽스',
  '해솔커뮤니케이션',
  '새벽별미디어',
  '오롯디자인랩',
  '소담컴퍼니',
  '바른선크리에이티브',
  '한결브랜딩',
  '나래인터랙티브',
  '이음디자인',
  '빛길미디어',
  '가온스튜디오',
  '푸른결컴퍼니',
  '달무리디자인',
  '솔빛그래픽',
  '하늬바람랩',
  '도담커뮤니케이션',
  '여울스튜디오',
  '라온브랜딩',
  '미리내미디어',
  '한빛나래',
  '초롱디자인랩',
  '다솜크리에이티브',
  '누리결스튜디오',
  '은가람디자인',
  '별하랩',
  '꽃가람컴퍼니',
  '아라그래픽스',
  '마루디자인',
  '시나브로스튜디오',
  '윤슬커뮤니케이션',
  '단미브랜딩',
  '노을빛미디어',
  '그린나래랩',
  '해밀디자인',
  '포근컴퍼니',
  '새솔스튜디오',
  '하람그래픽스',
  '예그리나디자인',
  '찬솔미디어',
  '가람결랩',
  '솔다움스튜디오',
  '빛나래컴퍼니',
  '고운결디자인',
  '바다숲그래픽',
  '물빛크리에이티브',
  '한울브랜딩',
  '이든스튜디오',
  '새길디자인랩',
  '온누리그래픽스',
  '들꽃미디어',
]

const WHEN = [
  '어제',
  '2일 전',
  '3일 전',
  '4일 전',
  '5일 전',
  '6일 전',
  '1주 전',
  '2주 전',
  '3주 전',
  '1개월 전',
  '2개월 전',
  '3개월 전',
]

/** 서류 탈락 53건. 위에서부터 최근 지원 순 */
export const SAMPLE_APPLICATIONS: readonly Application[] = COMPANIES.map((company, i) => ({
  id: `a${String(i + 1).padStart(2, '0')}`,
  company,
  role: ROLES[i % ROLES.length] as string,
  appliedAt: WHEN[Math.min(WHEN.length - 1, Math.floor(i / 5))] as string,
}))

/** 채용 공고 탭. 모레온은 넣지 않는다(주인공은 모레온에 지원한 기억이 없다) */
export const SAMPLE_POSTINGS: readonly Posting[] = [
  {
    id: 'p1',
    company: '봄결스튜디오',
    role: '브랜드 디자이너',
    career: '신입·경력 3년',
    place: '서울 마포구',
    due: 'D-3',
  },
  {
    id: 'p2',
    company: '해든컴퍼니',
    role: 'UX/UI 디자이너',
    career: '경력 2년 이상',
    place: '서울 성동구',
    due: 'D-5',
  },
  {
    id: 'p3',
    company: '소리결미디어',
    role: '콘텐츠 디자이너 (계약직 6개월)',
    career: '신입 가능',
    place: '경기 성남시',
    due: 'D-7',
  },
  {
    id: 'p4',
    company: '나무결그래픽스',
    role: '편집 디자이너',
    career: '신입',
    place: '서울 중구',
    due: 'D-9',
  },
  {
    id: 'p5',
    company: '별빛나래랩',
    role: '그래픽 디자이너 (인턴)',
    career: '신입',
    place: '서울 강남구',
    due: '상시',
  },
  {
    id: 'p6',
    company: '맑은샘상회',
    role: '패키지 디자이너',
    career: '경력 1-3년',
    place: '서울 종로구',
    due: 'D-2',
  },
  {
    id: 'p7',
    company: '새싹브랜딩',
    role: 'BX 디자이너',
    career: '신입·경력 2년',
    place: '서울 용산구',
    due: 'D-12',
  },
  {
    id: 'p8',
    company: '단비러닝',
    role: '교육 콘텐츠 디자이너',
    career: '경력 무관',
    place: '경기 고양시',
    due: '상시',
  },
]

/**
 * 내 포트폴리오 탭. 4일차 "포트폴리오 세 번째 장에는 이런 게 없다"와 맞도록
 * 세 번째 장에는 손글씨 메뉴판·안내문 사진을 넣지 않는다.
 */
export const SAMPLE_PORTFOLIO: readonly PortfolioPage[] = [
  { no: 1, title: '동네 빵집 브랜드 리뉴얼', kind: '로고, 포장지' },
  { no: 2, title: '구립 도서관 안내 표지판', kind: '사인 시스템' },
  { no: 3, title: '청년 창업 박람회 포스터', kind: '포스터 3종' },
  { no: 4, title: '반찬 가게 모바일 주문 화면', kind: '앱 화면 12장' },
  { no: 5, title: '독립 출판 시집 표지', kind: '표지, 내지' },
]
