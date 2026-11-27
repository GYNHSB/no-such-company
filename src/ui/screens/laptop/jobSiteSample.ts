import type { Application } from './JobSiteStatus'

// shortcut: 대본 데이터(src/data)에 지원 목록 칸이 생기기 전까지 쓰는 임시 값. 칸이 생기면 그쪽에서 넘긴다.
// 회사 이름은 모두 지어낸 가상 이름이다. 실제 회사와 겹치는지는 확인하지 못했다.
export const SAMPLE_APPLICATIONS: readonly Application[] = [
  { id: 'a01', company: '늘봄디자인', role: '브랜드 디자이너', appliedAt: '어제' },
  { id: 'a02', company: '파란섬스튜디오', role: 'UX/UI 디자이너', appliedAt: '2일 전' },
  { id: 'a03', company: '온새미랩', role: '그래픽 디자이너', appliedAt: '3일 전' },
  { id: 'a04', company: '모아그래픽스', role: '편집 디자이너', appliedAt: '4일 전' },
  { id: 'a05', company: '해솔커뮤니케이션', role: '브랜드 디자이너', appliedAt: '5일 전' },
  { id: 'a06', company: '새벽별미디어', role: '콘텐츠 디자이너', appliedAt: '6일 전' },
  { id: 'a07', company: '오롯디자인랩', role: 'UX/UI 디자이너', appliedAt: '1주 전' },
  { id: 'a08', company: '소담컴퍼니', role: '그래픽 디자이너', appliedAt: '1주 전' },
  { id: 'a09', company: '바른선크리에이티브', role: '편집 디자이너', appliedAt: '1주 전' },
  { id: 'a10', company: '한결브랜딩', role: '브랜드 디자이너', appliedAt: '2주 전' },
  { id: 'a11', company: '나래인터랙티브', role: 'UX/UI 디자이너', appliedAt: '2주 전' },
  { id: 'a12', company: '이음디자인', role: '그래픽 디자이너', appliedAt: '2주 전' },
  { id: 'a13', company: '빛길미디어', role: '콘텐츠 디자이너', appliedAt: '3주 전' },
  { id: 'a14', company: '가온스튜디오', role: '편집 디자이너', appliedAt: '3주 전' },
  { id: 'a15', company: '푸른결컴퍼니', role: '브랜드 디자이너', appliedAt: '3주 전' },
]

/** 대본의 불합격 메일 53통과 맞춘 수 */
export const SAMPLE_REJECTED_TOTAL = 53
