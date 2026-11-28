import { day1 } from '@/data/days/day1'
import type { DayNumber } from '@/data/types'
import { type DatedMessage, dateOfDay, usePhoneStore } from '@/stores/phoneStore'
import { INTERVIEW_LINES } from '@/ui/screens/laptop/videoScript'
import type { BankAccount, BankCard } from './BankApp'
import type { BlablaPost } from './BlablaApp'
import type { Contact } from './CallApp'
import type { PhotoVideo } from './PhotosApp'
import type { SnsPost } from './SnsApp'

/**
 * 휴대폰 안에 들어 있는 내용. 본편(PhoneView)과 테스트 페이지(?sandbox=gangyi)가 함께 쓴다.
 * 대본에 있는 것은 대본 그대로 적었고, 대본에 없는 것(계좌 번호, 연락처, 통화 기록 등)은 임의로 넣은 견본이다.
 * 대본 데이터(src/data/days)에 자리가 생기면 그쪽으로 옮긴다.
 */

/** 휴대폰을 든 손 이미지와 그 안의 화면 자리(px). 이미지의 검은 화면 영역을 픽셀로 잰 값이다 */
export const HAND_URL = `${import.meta.env.BASE_URL}images/hand_phone_day.webp`
export const IMAGE_SIZE = { width: 1239, height: 1269 }
export const SCREEN = { left: 418, top: 149, right: 818, bottom: 1000, radius: 41 }
/**
 * 손 이미지를 아래로 내리는 정도. 소매는 보이게 두고, 소매가 이미지 옆 선에 잘린 맨 아래쪽만 화면 밖으로 내보낸다.
 * 잘린 곳은 왼쪽이 아래 2.7%(1269px 가운데 위에서 1235px부터), 오른쪽이 아래 4.7%(1209px부터)다.
 * 숨 쉬는 움직임(0.4%)까지 쳐서 조금 더 내린다.
 */
export const HAND_SINK = 0.055

/** 잠금 화면 왼쪽 위에 보이는 가상 통신망 이름(도담텔레콤의 줄임말). 실존 통신사 이름은 쓰지 않는다 */
export const CARRIER = 'DT'

/** 대본의 은행 이름. 실존 은행과 겹치지 않는지 팀 확인이 필요하다 */
export const BANK = '하나로은행'

/**
 * 내 명의 계좌 견본. 대본에는 "계좌 3개"와 "내가 만든 건 하나뿐"만 있어서,
 * 원래 계좌 하나에 2일차 개설 알림 두 건이 올 때마다 하나씩 늘어나게 했다.
 * 계좌 번호와 잔액은 대본에 없어 임의로 넣었다.
 */
export const ACCOUNTS: (Omit<BankAccount, 'opened'> & { openedBy?: string })[] = [
  { id: 'mine', label: '입출금통장', number: '412-208-173904', balance: 847_200 },
  {
    id: 'opened-1',
    label: '입출금통장',
    number: '412-208-518327',
    balance: 0,
    openedBy: 'd2-bank-open-1',
  },
  {
    id: 'opened-2',
    label: '입출금통장',
    number: '412-208-518401',
    balance: 0,
    openedBy: 'd2-bank-open-2',
  },
]

/** 내 카드 견본. 대본에 없어 임의로 넣었다 */
export const CARDS: BankCard[] = [
  { id: 'check', label: '하나로 체크카드', last4: '2917', spent: 128_400 },
]

/**
 * 사진 앱에 들어 있는 면접 녹화(1일차 장면 5, 약 30초). 영상 파일은 아직 없어서 임시 화면으로 재생된다.
 * 자막은 노트북의 화상 면접 화면과 같은 대사다.
 */
export const RECORDING = { id: 'interview_recording', label: '김아영 · 모레온', duration: 30 }

/** 가상 SNS 이름. 대본에는 "SNS"라고만 있어 임시로 지었다. 팀 확인이 필요하다 */
export const SNS = '픽담'

/**
 * 내 SNS 게시물(4일차 장면 3). 글은 대본 그대로다.
 * 사진 일곱 장은 아직 없어 임시 그림이 나오고, 대본대로 세 번째 사진(3/7)부터 보인다.
 * 좋아요, 팔로워, 팔로잉 수는 대본에 없어 임의로 넣었다.
 */
export const SNS_POSTS: SnsPost[] = [
  {
    id: 'sns_handwriting',
    ago: '2년 전',
    photos: Array.from({ length: 7 }, () => undefined),
    photoLabel: '손글씨 메뉴판·안내문',
    startAt: 2,
    lines: ['동네 가게들의 손글씨 메뉴판·안내문', '삐뚤빼뚤한 글씨인데 이상하게 제일 잘 읽힌다.'],
    likes: 4,
  },
]

/**
 * 연락처 견본. 대본에는 "엄마한테 전화해야 하는데"만 있어서 엄마를 넣었고, 나머지는 임의로 넣었다.
 * 번호는 실제로 쓰이지 않게 010-0000으로 시작한다.
 */
export const CONTACTS: Contact[] = [
  { id: 'mom', name: '엄마', number: '01000000412' },
  { id: 'dad', name: '아빠', number: '01000000413' },
  { id: 'landlord', name: '집주인', number: '01000002207' },
  { id: 'office', name: '관리실', number: '01000003301' },
  { id: 'friend', name: '서준', number: '01000005128' },
  { id: 'senior', name: '박 대리', number: '01000007744' },
]

/**
 * 통화 기록 견본. 대본에 없어 임의로 넣었다. 하루를 시작할 때 그날을 기준으로 스토어에 넣어 둔다(seedCalls).
 * daysAgo는 그날에서 며칠 전인지다. 오늘 통화는 그날의 첫 사건보다 이르게 잡았다.
 * onlyDay가 있는 통화는 그 날(몇 일차)에만 넣는다. 4일차의 부재중 전화는 항의 문자의 "전화 좀 받으세요"에 맞췄다.
 */
export const CALL_HISTORY: {
  number: string
  kind: 'in' | 'out' | 'missed'
  daysAgo: number
  time: string
  onlyDay?: DayNumber
}[] = [
  { number: '01000007744', kind: 'out', daysAgo: 9, time: '18:44' },
  { number: '01000003301', kind: 'in', daysAgo: 4, time: '11:30' },
  { number: '01000000412', kind: 'missed', daysAgo: 2, time: '20:17' },
  { number: '01000000412', kind: 'out', daysAgo: 2, time: '20:41' },
  { number: '01000005128', kind: 'out', daysAgo: 1, time: '21:05' },
  { number: '01000000412', kind: 'in', daysAgo: 0, time: '08:52' },
  { number: '01000009031', kind: 'missed', daysAgo: 0, time: '15:09', onlyDay: 4 },
  { number: '01000006618', kind: 'missed', daysAgo: 0, time: '15:10', onlyDay: 4 },
]

/** 신고처 번호. 엔딩 화면의 안내와 같은 번호(경찰 112, 금융감독원 1332)만 연결된다 */
export const REPORT_NUMBERS = ['112', '1332']

/** 대본의 직장인 익명 게시판 이름 */
export const BLABLA = '블라블라'

/** 블라블라가 홈 화면에 나타나는 날. 1일차에는 아직 입사하기 전이라 없다 */
export const BLABLA_FROM_DAY: DayNumber = 2

/** 내가 다니는 회사. 대본: "모레온 게시판에는 글이 하나도 없다." */
export const MY_COMPANY = '모레온'

/**
 * 블라블라 게시글. 아래 두 글(4일차 장면 4)은 제목, 회사, 올린 때, 본문이 대본 그대로다.
 * 위의 "실시간 인기 글" 네 개는 앱이 비어 보이지 않게 임의로 넣은 것이고, 줄거리와 상관없다.
 * 임의로 넣은 글은 회사 이름을 짓지 않고 업종으로만 적었다. 조회, 좋아요, 댓글 수도 임의 값이다.
 */
export const BLABLA_POSTS: BlablaPost[] = [
  {
    id: 'filler_lunch',
    topic: '회사생활',
    title: '출근하니까 점심값이 제일 무섭다',
    company: '금융권',
    ago: '12분 전',
    body: '재택 끝나고 다시 나오는데 김치찌개가 만 이천 원이에요. 도시락 싸는 분들 어떻게 하세요?',
    views: 1284,
    likes: 46,
    comments: 31,
    hot: true,
  },
  {
    id: 'filler_raise',
    topic: '연봉',
    title: '연봉 협상 시즌인데 다들 몇 프로 부르세요',
    company: 'IT 스타트업',
    ago: '1시간 전',
    body: '작년엔 동결이었고 올해는 말이라도 꺼내 보려고요. 기준을 어떻게 잡아야 할지 모르겠네요.',
    views: 3912,
    likes: 88,
    comments: 104,
    hot: true,
  },
  {
    id: 'filler_meeting',
    topic: '자유',
    title: '월요일 아침 회의만 없어도 살 것 같다',
    company: '제조 대기업',
    ago: '3시간 전',
    body: '주말에 쉬다 와서 바로 한 시간 회의. 저만 힘든가요.',
    views: 760,
    likes: 23,
    comments: 12,
    hot: true,
  },
  {
    id: 'filler_move',
    topic: '취업·이직',
    title: '3년 차 이직, 지금이 맞을까요',
    company: '유통',
    ago: '어제',
    body: '일은 익숙해졌는데 배우는 게 없는 느낌이에요. 비슷한 고민 해 보신 분 계신가요.',
    views: 2105,
    likes: 37,
    comments: 45,
    hot: true,
  },
  {
    id: 'blabla_hanbit',
    topic: '취업·이직',
    title: '꿈의 회사 붙었습니다',
    company: '주식회사 한빛웍스',
    ago: '2주 전',
    body: '"남들이 안 보는 걸 보시더라고요." 이 한마디에 바로 입사 서류 냈네요.',
    views: 214,
    likes: 7,
    comments: 2,
  },
  {
    id: 'blabla_daon',
    topic: '취업·이직',
    title: '재택 풀타임 합격했어요',
    company: '주식회사 다온링크',
    ago: '3주 전',
    body: '면접관이 제 포트폴리오 보고 "남들이 안 보는 걸 보시더라고요"래요. 6년 만에 처음 듣는 말이라 울컥했어요.',
    views: 389,
    likes: 12,
    comments: 3,
  },
]

/** 검색창 아래에 미리 보여 줄 검색어. 내 회사 이름과, 면접에서 들은 칭찬이다 */
export const BLABLA_SUGGESTIONS = [MY_COMPANY, '남들이 안 보는 걸 보시더라고요']

/**
 * 휴대폰 브라우저의 첫 화면. 노트북의 검색 화면(SearchScreen)과 같은 이름의 가상 검색 사이트 "찾아봄"이다.
 * 주소는 실제로 쓰이지 않는 것으로 골랐다(2026-11-27에 등록되지 않은 것을 확인).
 */
export const SEARCH_SITE = { name: '찾아봄', address: 'm.chajabom.co.kr' }

/**
 * 원격 관리 프로그램의 기기 정보(5일차 장면 4). 대본에는 "관리자 계정"과 "초대 메일을 보낸 그 주소"만 있다.
 * 프로그램 이름은 노트북의 원격 초기화 화면과 같고, 허용된 것은 면접 앱 설치 화면의 권한 목록과 같다.
 * 페이지 주소는 임의로 지었다(2026-11-27에 등록되지 않은 것을 확인).
 */
export const REMOTE = {
  address: 'remote-agent.co.kr/device',
  program: '원격 관리 에이전트',
  permissions: ['카메라와 마이크 사용', '화면 녹화', '원격 지원 연결', '부팅할 때 자동 실행'],
}

/** 그날을 기준으로 통화 기록 견본을 스토어에 넣는다. 새로 시작해서 통화 기록이 비어 있을 때 한 번 부른다 */
export function seedCalls(today: Date, day: DayNumber) {
  const { logCall } = usePhoneStore.getState()
  CALL_HISTORY.filter((c) => c.onlyDay === undefined || c.onlyDay === day).forEach((c) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - c.daysAgo)
    logCall({ number: c.number, kind: c.kind, time: c.time, date })
  })
}

/** 지금 내 명의로 된 계좌. 개설 알림이 온 계좌만 보이고, 만들어진 때는 그 알림을 받은 때다 */
export function accountsFrom(notices: DatedMessage[]): BankAccount[] {
  return ACCOUNTS.flatMap(({ openedBy, ...account }) => {
    if (!openedBy) return [account]
    const notice = notices.find((n) => n.id === openedBy)
    return notice ? [{ ...account, opened: { date: notice.date, time: notice.time } }] : []
  })
}

/** 사진 앱에 들어 있는 면접 녹화. 1일차에 찍힌 것이고, 자막의 {name}은 넘긴 이름으로 바뀐다 */
export function interviewRecording(weekOne: Date, name: string): PhotoVideo {
  return {
    ...RECORDING,
    date: dateOfDay(weekOne, day1.info),
    captions: INTERVIEW_LINES.map((line) => ({
      ...line,
      text: line.text.replaceAll('{name}', name),
    })),
  }
}
