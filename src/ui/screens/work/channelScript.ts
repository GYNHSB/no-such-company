import type { ChannelMessage } from './WorkChannelView'

// shortcut: 채널 글은 대본에 없어 지어낸 임시 값이다. 작가가 확정하면 src/data로 옮긴다.
// 직원 이름은 모두 지어낸 가상 이름이다. '{name}'은 플레이어 이름으로 바뀐다.

interface ChannelScript {
  /** 이름 옆 짧은 설명 */
  topic: string
  messages: ChannelMessage[]
}

/** 채널 id(workNav.ts) → 채널에 보이는 글 */
export const CHANNELS: Record<string, ChannelScript> = {
  notice: {
    topic: '전사 공지 채널입니다. 문의는 인사팀으로 보내 주세요.',
    messages: [
      {
        id: 'n1',
        name: '모레온 인사팀',
        time: '09:00',
        text: '📢 *급여 지급 안내*\n이번 달 급여는 *25일*에 지급됩니다. 급여 명세서는 당일 메일로 보내 드려요.',
        reactions: [
          { emoji: '👍', count: 6 },
          { emoji: '🙏', count: 2 },
        ],
      },
      {
        id: 'n2',
        name: '모레온 인사팀',
        time: '09:01',
        text: '연말 정산 서류 안내는 다음 주에 다시 공지하겠습니다 🗓️',
        continued: true,
      },
      {
        id: 'n3',
        name: '모레온 보안팀',
        time: '10:30',
        text: '🔒 *보안 정책 안내*\n• 업무는 회사에서 보내 드린 노트북으로만 진행해 주세요.\n• 개인 기기로 고객 자료를 열면 안 됩니다.',
        reactions: [
          { emoji: '✅', count: 9 },
          { emoji: '👀', count: 2 },
        ],
      },
      {
        id: 'n4',
        name: '모레온 인사팀',
        time: '14:00',
        text: '@channel 새로 오신 분들은 *입사 서류*와 *본인 확인 영상*을 담당 팀장님께 제출해 주세요. 제출이 끝나야 계정 권한이 열립니다 🙏',
        reactions: [{ emoji: '✅', count: 4 }],
      },
    ],
  },
  general: {
    topic: '누구나 편하게 이야기하는 채널',
    messages: [
      {
        id: 'g1',
        name: '권태민',
        time: '09:02',
        text: '좋은 아침입니다! ☀️ 이번 주도 화이팅이에요',
        reactions: [
          { emoji: '👋', count: 3 },
          { emoji: '💪', count: 2 },
        ],
      },
      { id: 'g2', name: '유나경', time: '09:05', text: '좋은 아침이에요~ ☕' },
      {
        id: 'g3',
        name: '임선우',
        time: '09:11',
        text: '📅 오늘 *오후 2시* 주간 회의는 화상으로 진행합니다. 링크는 10분 전에 올릴게요.',
        reactions: [{ emoji: '✅', count: 5 }],
      },
      {
        id: 'g4',
        name: '채은솔',
        time: '13:40',
        text: '혹시 화상 회의 때 마이크가 자꾸 끊기는 분 계신가요? 저만 그런 건지… 🥲',
      },
      {
        id: 'g5',
        name: '권태민',
        time: '13:52',
        text: '@채은솔 저도 그랬는데 노트북 재부팅하니까 됐어요!',
      },
      {
        id: 'g6',
        name: '채은솔',
        time: '13:55',
        text: '오 해결됐어요. 감사합니다 🙇',
        reactions: [{ emoji: '❤️', count: 1 }],
      },
    ],
  },
  work_share: {
    topic: '진행 중인 업무와 일정을 공유합니다',
    messages: [
      {
        id: 'w1',
        name: '임선우',
        time: '09:20',
        text: '🗂️ *이번 주 안내문 발송 일정*\n• 월요일 오전\n• 수요일 오전\n• 금요일 오전',
        reactions: [{ emoji: '👍', count: 4 }],
      },
      {
        id: 'w2',
        name: '임선우',
        time: '09:21',
        text: '검수는 *발송 전날*까지 끝내 주시면 돼요.',
        continued: true,
      },
      {
        id: 'w3',
        name: '유나경',
        time: '10:05',
        text: '고객 명단 양식이 조금 바뀌었어요. 파일 이름은 `고객명단_요일` 형식으로 맞춰 주세요 📎',
        reactions: [
          { emoji: '👀', count: 3 },
          { emoji: '✅', count: 2 },
        ],
      },
      { id: 'w4', name: '권태민', time: '10:12', text: '확인했습니다! 🙆' },
      {
        id: 'w5',
        name: '채은솔',
        time: '16:48',
        text: '오늘 맡은 명단 정리 끝냈습니다 ✅ 내일 오전에 이어서 할게요.',
        reactions: [{ emoji: '👏', count: 2 }],
      },
    ],
  },
  newcomer: {
    topic: '새로 오신 분들을 위한 안내',
    messages: [
      {
        id: 'c1',
        name: '서지안',
        time: '14:10',
        text: '🎉 이번에 합류하신 @{name} 님을 환영합니다! 궁금한 점은 이 채널에 편하게 남겨 주세요 :)',
        reactions: [
          { emoji: '🎉', count: 5 },
          { emoji: '👋', count: 4 },
          { emoji: '❤️', count: 2 },
        ],
      },
      { id: 'c2', name: '권태민', time: '14:12', text: '환영합니다! 🙌' },
      { id: 'c3', name: '채은솔', time: '14:13', text: '반갑습니다 @{name} 님 😊' },
      {
        id: 'c4',
        name: '서지안',
        time: '14:15',
        text: '📝 *첫 주에 하실 일*\n1. 입사 서류 제출\n2. 본인 확인 영상 제출\n3. 업무용 노트북 수령 확인',
        reactions: [{ emoji: '✅', count: 1 }],
      },
    ],
  },
  lunch: {
    topic: '오늘 점심 자랑하는 곳',
    messages: [
      { id: 'l1', name: '유나경', time: '11:48', text: '오늘 점심 뭐 드세요? 🍽️' },
      {
        id: 'l2',
        name: '권태민',
        time: '11:50',
        text: '저는 냉장고 털어서 김치볶음밥이요 🍳',
        reactions: [{ emoji: '😋', count: 2 }],
      },
      { id: 'l3', name: '채은솔', time: '11:53', text: '재택의 장점… 저는 어제 남은 카레요 🍛' },
      {
        id: 'l4',
        name: '임선우',
        time: '12:20',
        text: '컵라면에 삼각김밥 🍜🍙 반성합니다.',
        reactions: [{ emoji: '😂', count: 4 }],
      },
      { id: 'l5', name: '유나경', time: '12:24', text: '그것도 훌륭한 한 끼예요 ㅎㅎ' },
    ],
  },
}
