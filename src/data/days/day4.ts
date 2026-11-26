// 4일차 추리 (입사 6주 차). 나만 노린 게 아니라는 것, 세상은 나를 범인으로 본다는 것을 알게 되는 날.
// 문장은 초안이다. 구조(id, trigger, effects)는 대본 가이드의 ID 목록을 따랐다.
import { SUSPICION } from '../rules'
import type { DayScript } from '../types'

export const day4: DayScript = {
  info: { day: 4, week: 6, title: '추리' },

  evidence: [
    {
      id: 'blink_interval',
      title: '똑같은 깜빡임',
      detail: '면접 녹화 속 팀장은 말하는 중에도 정확히 5초마다 눈을 깜빡인다.',
    },
    {
      id: 'my_sns_post',
      title: '내 SNS 게시물',
      detail:
        '사진 시리즈 「동네 가게들의 손글씨 메뉴판·안내문」의 세 번째 사진. 포트폴리오에는 넣은 적이 없다.',
    },
    {
      id: 'blabla_posts',
      title: '블라블라 게시글',
      detail: '회사 이름은 다른데 면접에서 들은 칭찬이 같다. “남들이 안 보는 걸 보시더라고요.”',
    },
    {
      id: 'complaint_sms',
      title: '항의 문자',
      detail:
        '“세움파트너스 대표 {name} 씨 맞죠? 원금 보장이라면서요. 제 돈 돌려주세요.” 보낸 사람 황보미진.',
    },
  ],

  sentences: [
    {
      id: 's_praise_source',
      day: 4,
      text: '면접에서 칭찬받은 내용은 포트폴리오가 아니라 [0]에 있었다',
      answers: ['my_sns_post'],
    },
    {
      id: 's_same_praise',
      day: 4,
      text: '같은 칭찬을 들은 사람이 [0]에 여럿 있다',
      answers: ['blabla_posts'],
    },
  ],

  events: [
    {
      id: 'd4_start',
      trigger: { type: 'dayStart' },
      effects: [
        { type: 'webcam', on: true },
        {
          type: 'message',
          message: {
            id: 'm_task_day4',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '09:02',
            body: '{name} 씨, 오늘은 명단 정리만 해 주세요. 요즘 믿고 맡길 수 있어서 좋아요 :)',
          },
        },
        { type: 'goal', text: '업무를 해 두고, 휴대폰으로 면접 녹화를 다시 보자' },
      ],
    },
    {
      id: 'd4_replay',
      trigger: { type: 'interact', objectId: 'btn_phone_open_recording' },
      note: '면접 녹화 다시 보기 장면. 일시정지하며 시간을 재면 깜빡임 간격이 늘 같다',
      effects: [
        { type: 'scene', sceneId: 'interview_replay' },
        { type: 'evidence', cardId: 'blink_interval' },
        { type: 'goal', text: '칭찬받은 “포트폴리오 세 번째 장”을 직접 확인해 보자' },
      ],
    },
    {
      id: 'd4_sns',
      trigger: { type: 'interact', objectId: 'btn_phone_open_sns' },
      note: '포트폴리오에는 그런 내용이 없고, 같은 장면이 개인 SNS 세 번째 사진에 있다',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_my_sns_post',
            channel: 'sns',
            from: '{name}',
            time: '2년 전',
            body: '동네 가게들의 손글씨 메뉴판·안내문 (3/7)\n삐뚤빼뚤한 글씨인데 이상하게 제일 잘 읽힌다.',
          },
        },
        { type: 'evidence', cardId: 'my_sns_post' },
        { type: 'goal', text: '나 말고도 이런 칭찬을 들은 사람이 있을까' },
      ],
    },
    {
      id: 'd4_blabla',
      trigger: { type: 'interact', objectId: 'btn_phone_open_blabla' },
      note: '오버레이 회사 게시판은 글 0개. 전체 게시판에 같은 칭찬을 들은 합격자들. 회사 이름은 모두 가상',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_blabla_1',
            channel: 'blabla',
            from: '재택 풀타임 합격했어요 (주식회사 다온링크)',
            time: '3주 전',
            body: '면접관이 제 포트폴리오 보고 “남들이 안 보는 걸 보시더라고요”래요. 6년 만에 처음 듣는 말이라 울컥했어요.',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_blabla_2',
            channel: 'blabla',
            from: '꿈의 회사 붙었습니다 (주식회사 한빛웍스)',
            time: '2주 전',
            body: '“남들이 안 보는 걸 보시더라고요.” 이 한마디에 바로 입사 서류 냈네요.',
          },
        },
        { type: 'evidence', cardId: 'blabla_posts' },
      ],
    },
    {
      id: 'd4_complaints',
      trigger: { type: 'afterEvent', eventId: 'd4_blabla', delaySec: 4 },
      note: '가장 어두운 순간. 문구는 1~3일차에 검수한 안내문과 겹친다. 보낸 사람은 명단에 반복되던 이름',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_complaint_1',
            channel: 'sms',
            from: '황보미진',
            time: '15:11',
            body: '세움파트너스 대표 {name} 씨 맞죠? 원금 보장이라면서요. 제 돈 돌려주세요.',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_complaint_2',
            channel: 'sms',
            from: '모르는 번호',
            time: '15:13',
            body: '대표가 직접 운용한다면서요. {name} 대표님, 전화 좀 받으세요.',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_complaint_3',
            channel: 'sms',
            from: '모르는 번호',
            time: '15:14',
            body: '매월 8% 확정 수익이라더니 출금이 안 됩니다. 신고합니다.',
          },
        },
        { type: 'evidence', cardId: 'complaint_sms' },
      ],
    },
    {
      id: 'd4_new_request',
      trigger: { type: 'afterEvent', eventId: 'd4_complaints', delaySec: 6 },
      note: '공범 선택지. 영상을 다시 넘기면 gaveNewInfo가 기록된다',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_face_again',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '16:30',
            body: '{name} 씨, 보안 정책이 바뀌어서 본인 확인 영상을 다시 찍어 주셔야 해요. 오늘 안에 부탁해요 :)',
          },
        },
        {
          type: 'choice',
          prompt: '영상을 다시 찍어 보낼까',
          choices: [
            {
              id: 'c_d4_send',
              label: '찍어서 보낸다',
              effects: [
                { type: 'flag', key: 'gaveNewInfo', value: true },
                { type: 'suspicion', delta: SUSPICION.delta.taskDone },
              ],
            },
            {
              id: 'c_d4_excuse',
              label: '“웹캠이 고장 난 것 같아요. 내일 보내 드릴게요.”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.taskPostponed }],
            },
            {
              id: 'c_d4_refuse',
              label: '“지난번에 보낸 영상으로는 안 되나요?”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.probeRight }],
            },
          ],
        },
        { type: 'goal', text: '오늘 모은 것을 메모장에서 맞춰 보자' },
      ],
    },
  ],
}
