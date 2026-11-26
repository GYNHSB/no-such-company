import type { EndingId } from '@/data/types'

/** 엔딩 판정에 쓰는 기록 */
export interface EndingInput {
  signedInauguration: boolean // 5일차 취임 서류 서명
  gaveNewInfo: boolean // 영상 재촬영, 인증번호 등 새 정보 넘김
  vanished: boolean // 경계심 100으로 잠적
  reported: boolean // 신고함
  allSentencesSolved: boolean
  laptopWiped: boolean // 원격 초기화를 못 막음
}

/** 판정 순서: 공범 → 서류 위의 주범 → 잡히지 않은 사람 → 휴 위험했다 */
export function decideEnding(s: EndingInput): EndingId {
  if (s.signedInauguration || s.gaveNewInfo) return 'accomplice'
  if (s.vanished || !s.reported || !s.allSentencesSolved) return 'scapegoat'
  if (s.laptopWiped) return 'escaped'
  return 'safe'
}
