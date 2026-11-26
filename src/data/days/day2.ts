// 2일차 흔적 (입사 3주 차). 내 이름으로 뭔가 벌어지고 있다는 걸 처음 알게 되는 날.
// 문장은 초안이다. 구조(id, trigger, effects)는 대본 가이드의 ID 목록을 따랐다.
import { SUSPICION } from '../rules'
import type { DayScript } from '../types'

export const day2: DayScript = {
  info: { day: 2, week: 3, title: '흔적' },

  evidence: [
    {
      id: 'registered_mail',
      title: '등기 우편',
      detail: '주식회사 세움파트너스 법인 설립 등기 완료. 대표이사 {name}.',
    },
    {
      id: 'account_alert',
      title: '계좌 개설 알림',
      detail: '개설한 적 없는 하나로은행 계좌 2개와 본인 인증 완료 문자.',
    },
    {
      id: 'invest_notice_day2',
      title: '검수한 투자 안내문',
      detail: '“지금 가입하시면 대표가 직접 운용합니다.” 회사 일과 상관없는 문서였다.',
    },
  ],

  sentences: [
    {
      id: 's_registered_ceo',
      day: 2,
      text: '세움파트너스의 대표로 등기된 사람은 [0]이다',
      answers: ['registered_mail'],
    },
  ],

  events: [
    {
      id: 'd2_post_arrives',
      trigger: { type: 'dayStart' },
      note: '등기 우편은 현관 바닥의 interact_mail로 놓인다. 봉투 이미지에는 이름을 넣지 않는다',
      effects: [
        { type: 'goal', text: '현관에 우편물이 와 있다' },
        {
          type: 'message',
          message: {
            id: 'm_registered_mail',
            channel: 'post',
            from: '법인등기 안내',
            time: '08:40',
            body: '법인 설립 등기가 완료되었음을 알려 드립니다.\n상호: 주식회사 세움파트너스\n대표이사: {name}',
          },
        },
      ],
    },
    {
      id: 'd2_open_post',
      trigger: { type: 'interact', objectId: 'interact_mail' },
      note: '첫 반응 장면. 대표이사 칸에 플레이어가 입력한 이름이 보인다',
      effects: [
        { type: 'evidence', cardId: 'registered_mail' },
        { type: 'goal', text: '일단 출근 시간이다. 노트북을 켜자' },
      ],
    },
    {
      id: 'd2_work',
      trigger: { type: 'interact', objectId: 'interact_laptop' },
      note: '반복되는 이름 황보미진이 명단에 처음 눈에 띈다. 명단 정리 미니게임은 나중에 붙인다',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_task_day2',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '09:03',
            body: '{name} 씨 좋은 아침이에요! 오늘은 안내문 맞춤법 검수랑 고객 명단 정리 부탁해요 :)',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_notice_day2',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '09:04',
            body: '[검수 요청] “지금 가입하시면 대표가 직접 운용합니다.”\n[고객명단_수요일] 황보미진, 도경석, 황보미진, 변하늘',
          },
        },
        { type: 'evidence', cardId: 'invest_notice_day2' },
        { type: 'suspicion', delta: SUSPICION.delta.taskDone },
      ],
    },
    {
      id: 'd2_account_alerts',
      trigger: { type: 'afterEvent', eventId: 'd2_work', delaySec: 5 },
      note: '휴대폰 알림. 은행과 본인 인증 이름은 가상 이름',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_account_opened',
            channel: 'bank',
            from: '하나로은행',
            time: '11:27',
            body: '{name} 님 명의의 입출금 계좌가 개설되었습니다. 본인이 아니면 고객센터로 연락해 주세요.',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_identity_verified',
            channel: 'sms',
            from: '본인인증',
            time: '11:27',
            body: '[본인인증] {name} 님의 본인 인증이 완료되었습니다.',
          },
        },
        {
          type: 'message',
          message: {
            id: 'm_account_opened_2',
            channel: 'bank',
            from: '하나로은행',
            time: '11:31',
            body: '{name} 님 명의의 입출금 계좌가 개설되었습니다.',
          },
        },
        { type: 'evidence', cardId: 'account_alert' },
        { type: 'goal', text: '세움파트너스가 뭘까. 밤에 찾아보자' },
      ],
    },
    {
      id: 'd2_night_search',
      trigger: { type: 'interact', objectId: 'btn_search_seum' },
      note: '노트북으로 검색한다. 아직 감시를 모르는 상태. 이 검색이 3일차 발각의 계기다',
      effects: [
        { type: 'flag', key: 'searchedSeumOnLaptop', value: true },
        { type: 'suspicion', delta: SUSPICION.delta.laptopSearch },
        { type: 'goal', text: '검색 결과가 거의 없다. 내일 다시 알아보자' },
      ],
    },
  ],
}
