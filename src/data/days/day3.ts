// 3일차 감시 (입사 4주 차). 노트북이 감시 도구였다는 걸 알게 되는 날(중간점).
// 문장은 초안이다. 구조(id, trigger, effects)는 대본 가이드의 ID 목록을 따랐다.
import { SUSPICION } from '../rules'
import type { DayScript } from '../types'

export const day3: DayScript = {
  info: { day: 3, week: 4, title: '감시' },

  evidence: [
    {
      id: 'search_known',
      title: '팀장의 한마디',
      detail:
        '“어젯밤에 ‘세움파트너스’ 검색하셨던데, 무슨 일 있어요?” 내 방에서 혼자 한 검색이었다.',
    },
    {
      id: 'webcam_light',
      title: '웹캠 불빛',
      detail: '켠 적 없는 노트북 웹캠에 불이 들어와 있다.',
    },
    {
      id: 'invest_notice_day3',
      title: '안내문 속 내 이름',
      detail: '오늘 검수한 투자 안내문 끝에 “세움파트너스 대표이사 {name}”이라고 적혀 있다.',
    },
  ],

  sentences: [], // 3일차에는 새 빈칸 문장 없음

  events: [
    {
      id: 'd3_boss_knows',
      trigger: { type: 'dayStart' },
      note: '중간점. 메시지가 뜨는 순간 웹캠 불빛이 켜져 있다',
      effects: [
        { type: 'webcam', on: true },
        {
          type: 'message',
          message: {
            id: 'm_boss_knows',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '09:01',
            body: '{name} 씨, 어젯밤에 ‘세움파트너스’ 검색하셨던데, 무슨 일 있어요?',
          },
        },
        { type: 'evidence', cardId: 'search_known' },
        { type: 'evidence', cardId: 'webcam_light' },
        {
          type: 'choice',
          prompt: '팀장에게 뭐라고 답할까',
          choices: [
            {
              id: 'c_d3_excuse',
              label: '“검수한 안내문에 나온 회사라 궁금해서요.”',
              effects: [{ type: 'flag', key: 'd3Excused', value: true }],
            },
            {
              id: 'c_d3_agree',
              label: '“아무것도 아니에요. 오늘 업무 바로 시작할게요!”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.agree }],
            },
            {
              id: 'c_d3_probe',
              label: '“제 이름으로 등기 우편이 왔던데요. 팀장님은 아세요?”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.probeWrong }],
            },
          ],
        },
      ],
    },
    {
      id: 'd3_resolve',
      trigger: { type: 'afterEvent', eventId: 'd3_boss_knows', delaySec: 2 },
      note: '그만두지 않기로 결심한다. 이때부터 노트북은 업무용, 조사는 휴대폰으로',
      effects: [
        {
          type: 'goal',
          text: '노트북은 보고 있다. 조사는 휴대폰으로, 웹캠이 안 보는 곳에서',
        },
      ],
    },
    {
      id: 'd3_work',
      trigger: { type: 'afterEvent', eventId: 'd3_resolve', delaySec: 3 },
      note: '일하는 척한다. 안내문에 플레이어 이름이 대표이사로 나온다. 반복되는 이름 황보미진',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_task_day3',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '09:20',
            body: '오늘도 안내문 검수랑 명단 정리 부탁해요 :)\n[검수 요청] “… 문의: 세움파트너스 대표이사 {name}”\n[고객명단_금요일] 황보미진, 마동현, 황보미진, 도경석',
          },
        },
        { type: 'evidence', cardId: 'invest_notice_day3' },
        { type: 'suspicion', delta: SUSPICION.delta.taskDone },
      ],
    },
    {
      id: 'd3_phone_check',
      trigger: { type: 'interact', objectId: 'interact_phone' },
      note: '웹캠 시야 안에서 휴대폰을 보면 엔진이 phoneInWebcamView만큼 경계심을 올린다(대본에는 넣지 않음)',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_account_balance',
            channel: 'bank',
            from: '하나로은행',
            time: '12:40',
            body: '{name} 님 명의 계좌 3개. 이 중 2개는 내가 만든 적이 없다.',
          },
        },
        { type: 'goal', text: '그만두면 내 이름만 남는다. 일하는 척하면서 증거를 모으자' },
      ],
    },
  ],
}
