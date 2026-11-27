import type { Message } from '@/data/types'
import type { MessengerDay } from './WorkMessenger'

// shortcut: 대본(docs/261126_대본_v1-2.md)의 메신저 문구를 옮긴 임시 값. src/data/days/day1~5.ts에 v1-2 대본이 들어가면 그쪽에서 넘긴다.

const fromLead = (id: string, time: string, body: string): Message => ({
  id,
  channel: 'messenger',
  from: '박재훈 팀장',
  time,
  body,
})

export const MESSENGER_DAYS: readonly MessengerDay[] = [
  {
    info: { day: 1, week: 1, title: '입사' },
    messages: [
      fromLead(
        'm_docs',
        '14:02',
        '{name} 씨 환영해요! 노트북 받으셨죠? 입사 서류(신분증 사본, 등본, 통장 사본, 졸업증명서) 올려주세요 :)',
      ),
      fromLead(
        'm_face',
        '14:20',
        '보안 정책상 본인 확인 영상이 필요해요. 정면 5초, 왼쪽 5초, 오른쪽 5초만 찍어서 보내주세요!',
      ),
      fromLead(
        'm_first_work',
        '14:40',
        '첫 업무예요! 안내문 맞춤법 검수랑 고객 명단 정리, 천천히 해 주세요 :)\n[검수 요청] "원금 100% 보장, 매월 8% 확정 수익."\n[고객명단_월요일] 황보미진, 도경석, 변하늘',
      ),
    ],
  },
  {
    info: { day: 2, week: 3, title: '흔적' },
    messages: [
      fromLead(
        'm_d2_morning',
        '09:03',
        '{name} 씨 좋은 아침이에요! 오늘은 안내문 맞춤법 검수랑 고객 명단 정리 부탁해요 :)',
      ),
      fromLead(
        'm_d2_work',
        '09:04',
        '[검수 요청] "지금 가입하시면 대표가 직접 운용합니다."\n[고객명단_수요일] 황보미진, 도경석, 황보미진, 변하늘',
      ),
    ],
  },
  {
    info: { day: 3, week: 4, title: '감시' },
    messages: [
      fromLead(
        'm_d3_search',
        '09:01',
        "{name} 씨, 어젯밤에 '세움파트너스' 검색하셨던데, 무슨 일 있어요?",
      ),
      fromLead(
        'm_d3_work',
        '09:20',
        '오늘도 안내문 검수랑 명단 정리 부탁해요 :)\n[검수 요청] "… 문의: 세움파트너스 대표이사 {name}"\n[고객명단_금요일] 황보미진, 마동현, 황보미진, 도경석',
      ),
    ],
  },
  {
    info: { day: 4, week: 6, title: '추리' },
    messages: [
      fromLead(
        'm_d4_morning',
        '09:02',
        '{name} 씨, 오늘은 명단 정리만 해 주세요. 요즘 믿고 맡길 수 있어서 좋아요 :)',
      ),
      fromLead(
        'm_d4_face_again',
        '16:30',
        '{name} 씨, 보안 정책이 바뀌어서 본인 확인 영상을 다시 찍어 주셔야 해요. 오늘 안에 부탁해요 :)',
      ),
    ],
  },
  {
    info: { day: 5, week: 8, title: '결단' },
    messages: [
      fromLead(
        'm_d5_sign',
        '10:01',
        '{name} 대표님, 축하드려요! 화면에 띄운 취임 승낙서랑 인감 위임장에 전자 서명 부탁드릴게요 :)',
      ),
      fromLead(
        'm_d5_read',
        '10:03',
        '그럼 먼저 카메라 보면서 승낙문을 소리 내어 읽어 주세요. 기록용이라서요. 저희 서로 믿어야죠.',
      ),
    ],
  },
]
