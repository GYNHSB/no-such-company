// 게임 데이터 타입. 대본 담당은 이 타입대로 src/data/days/dayN.ts를 쓴다.
// 이 파일은 개발자 승인 없이 바꾸지 않는다.

export type DayNumber = 1 | 2 | 3 | 4 | 5

export type Weekday = '월' | '화' | '수' | '목' | '금' | '토' | '일'

/** 화면 표기 "3일차 · 입사 5주 차" */
export interface DayInfo {
  day: DayNumber
  week: number // 입사 N주 차
  weekday: Weekday // 그 주의 무슨 요일인지. 휴대폰에 보이는 날짜를 정한다
  title: string // 내부용 이름: 입사, 흔적, 감시, 추리, 결단
}

/** 메시지가 도착하는 곳 */
export type Channel =
  | 'mail' // 노트북 메일
  | 'messenger' // 노트북 모레온 워크 메신저 (감시됨)
  | 'sms' // 휴대폰 문자 (감시 안 됨)
  | 'bank' // 휴대폰 은행 알림
  | 'sns' // 휴대폰 내 SNS
  | 'blabla' // 휴대폰 블라블라 앱
  | 'post' // 원룸 현관 우편물(3D)

export interface Message {
  id: string
  channel: Channel
  from: string // 표시 이름. 주인공은 '{name}'
  time: string // 화면에 보이는 시각 "09:03"
  body: string // '{name}'은 플레이어가 입력한 이름으로 바뀐다
  attachment?: string // public/images/ 아래 경로
  vanishAfterSec?: number // 몇 초 뒤 사라지는 메시지(캡처 대상)
}

/** 메모장의 증거 카드. 빈칸에 끌어다 놓는다 */
export interface EvidenceCard {
  id: string
  title: string // 카드 위에 보이는 짧은 이름
  detail: string // 카드를 펼쳤을 때 보이는 내용
  image?: string
}

/** 빈칸 문장. text 안의 [0], [1]이 빈칸 자리 */
export interface BlankSentence {
  id: string
  day: DayNumber // 이 날부터 맞출 수 있다
  text: string // 예: '세움파트너스의 대표로 등기된 사람은 [0]이다'
  answers: string[] // 빈칸 순서대로 정답 증거 카드 id
}

/** 플레이어 선택지 */
export interface Choice {
  id: string
  label: string
  effects: Effect[]
}

/** 사건이 일으키는 일 */
export type Effect =
  | { type: 'message'; message: Message }
  | { type: 'evidence'; cardId: string } // 증거 카드 획득
  | { type: 'suspicion'; delta: number } // 경계심 증감 (rules.ts의 값 사용 권장)
  | { type: 'flag'; key: string; value: boolean } // 엔딩 판정용 기록
  | { type: 'choice'; prompt: string; choices: Choice[] }
  | { type: 'scene'; sceneId: string } // 화상 면접, 취임식 같은 특수 장면
  | { type: 'webcam'; on: boolean }
  | { type: 'goal'; text: string } // 화면 위 목표 문구
  | { type: 'monologue'; lines: string[] } // 화면 아래 혼잣말 창에 한 줄씩. '{name}'은 이름으로 바뀐다
  | { type: 'dateCard'; text: string } // "그날 오후"처럼 시간이 건너뛸 때 뜨는 카드
  | { type: 'laptop'; screen: string } // 노트북에 띄울 화면(gameStore의 LaptopScreen). 'off'면 끈다

/** 사건이 언제 일어나는지 */
export type Trigger =
  | { type: 'dayStart' }
  | { type: 'afterEvent'; eventId: string; delaySec?: number }
  // 3D 오브젝트 interact_* 또는 화면 버튼 id. after가 있으면 그 사건이 실행된 뒤에만 일어난다
  | { type: 'interact'; objectId: string; after?: string }
  | { type: 'evidenceCollected'; cardId: string }
  | { type: 'sentenceSolved'; sentenceId: string }

export interface GameEvent {
  id: string
  trigger: Trigger
  effects: Effect[]
  note?: string // 작성자 메모. 게임에 안 보임
}

export interface DayScript {
  info: DayInfo
  events: GameEvent[]
  evidence: EvidenceCard[]
  sentences: BlankSentence[]
}

export type EndingId = 'accomplice' | 'scapegoat' | 'escaped' | 'safe'
// 공범, 서류 위의 주범, 잡히지 않은 사람, 휴 위험했다
