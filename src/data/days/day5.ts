// 5일차 결단 (입사 8주 차). 서명하기 전에 멈추고 신고하는 날.
// 문장은 초안이다. 구조(id, trigger, effects)는 대본 가이드의 ID 목록을 따랐다.
// 원격 초기화는 대본이 아니라 엔진이 시작한다(취임식 중 경계심이 SUSPICION.remoteWipeOnDay5를 넘으면 remote_wipe 장면).
import { SUSPICION } from '../rules'
import type { DayScript } from '../types'

export const day5: DayScript = {
  info: { day: 5, week: 8, title: '결단' },

  evidence: [
    {
      id: 'summons',
      title: '출석 요구서',
      detail: '세움파트너스 투자 사기 사건의 피의자로 내일 오후까지 출석하라는 경찰의 요구서.',
    },
    {
      id: 'inauguration_invite',
      title: '취임식 초대 메일',
      detail: '“오전 10시, 화상으로 대표이사 취임식을 진행합니다.” 보낸 주소가 팀장의 것이 아니다.',
    },
    {
      id: 'admin_account',
      title: '원격 관리 프로그램 관리자 계정',
      detail:
        '지급 노트북에 깔린 원격 관리 프로그램의 관리자 계정. 취임식 초대 메일을 보낸 주소와 같다.',
    },
  ],

  sentences: [
    {
      id: 's_same_operator',
      day: 5,
      text: '오버레이의 팀장과 세움파트너스의 운영자는 [0]을 쓰는 같은 사람이다',
      answers: ['admin_account'],
    },
  ],

  events: [
    {
      id: 'd5_summons_arrives',
      trigger: { type: 'dayStart' },
      note: '기관 이름은 가상. 봉투 이미지에는 이름을 넣지 않는다',
      effects: [
        { type: 'goal', text: '현관에 또 우편물이 와 있다' },
        {
          type: 'message',
          message: {
            id: 'm_summons',
            channel: 'post',
            from: '경찰서 수사과',
            time: '08:30',
            body: '출석 요구서\n{name} 님은 주식회사 세움파트너스 투자 사기 사건의 피의자로 내일 오후 2시까지 출석해 주시기 바랍니다.',
          },
        },
      ],
    },
    {
      id: 'd5_open_summons',
      trigger: { type: 'interact', objectId: 'interact_mail' },
      effects: [
        { type: 'evidence', cardId: 'summons' },
        {
          type: 'message',
          message: {
            id: 'm_invite',
            channel: 'mail',
            from: '세움파트너스 운영지원',
            time: '09:10',
            body: '{name} 님, 그동안의 성과를 인정받아 대표이사로 모시게 되었습니다. 오전 10시, 화상으로 취임식을 진행합니다.',
          },
        },
        { type: 'evidence', cardId: 'inauguration_invite' },
        { type: 'goal', text: '오전 10시 취임식. 서명하기 전에 증거를 맞춰야 한다' },
      ],
    },
    {
      id: 'd5_inauguration',
      trigger: { type: 'interact', objectId: 'btn_join_inauguration' },
      note: '약 5분의 실시간 장면. 웹캠이 켜진 채 진행된다',
      effects: [
        { type: 'webcam', on: true },
        { type: 'scene', sceneId: 'inauguration' },
        {
          type: 'message',
          message: {
            id: 'm_sign_request',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '10:01',
            body: '{name} 대표님, 축하드려요! 화면에 띄운 취임 승낙서랑 인감 위임장에 전자 서명 부탁드릴게요 :)',
          },
        },
        {
          type: 'choice',
          prompt: '취임 승낙서에 서명할까',
          choices: [
            {
              id: 'c_d5_sign',
              label: '서명한다',
              effects: [{ type: 'flag', key: 'signedInauguration', value: true }],
            },
            {
              id: 'c_d5_stall',
              label: '“서류를 천천히 읽어 보고 서명할게요.”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.taskPostponed }],
            },
            {
              id: 'c_d5_ask',
              label: '“제가 왜 대표가 되는 거죠?”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.probeWrong }],
            },
          ],
        },
      ],
    },
    {
      id: 'd5_read_aloud',
      trigger: { type: 'afterEvent', eventId: 'd5_inauguration', delaySec: 20 },
      note: '얼굴과 목소리를 한 번 더 얻으려는 요구. 읽으면 gaveNewInfo가 기록된다',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_read_request',
            channel: 'messenger',
            from: '박재훈 팀장',
            time: '10:03',
            body: '그럼 먼저 카메라 보면서 승낙문을 소리 내어 읽어 주세요. 기록용이라서요. 저희 서로 믿어야죠.',
          },
        },
        {
          type: 'choice',
          prompt: '카메라를 보고 승낙문을 읽을까',
          choices: [
            {
              id: 'c_d5_read',
              label: '카메라를 보고 읽는다',
              effects: [{ type: 'flag', key: 'gaveNewInfo', value: true }],
            },
            {
              id: 'c_d5_water',
              label: '“목이 잠겨서요. 물 좀 가져올게요.”',
              effects: [
                { type: 'suspicion', delta: SUSPICION.delta.taskPostponed },
                { type: 'goal', text: '웹캠이 안 보는 곳에서 휴대폰을 열자' },
              ],
            },
            {
              id: 'c_d5_mic',
              label: '“마이크가 이상한 것 같아요. 잠시만요.”',
              effects: [{ type: 'suspicion', delta: SUSPICION.delta.excuseRepeated }],
            },
          ],
        },
      ],
    },
    {
      id: 'd5_admin_account',
      trigger: { type: 'interact', objectId: 'btn_phone_open_remote_info' },
      note: '휴대폰으로 원격 관리 프로그램의 관리자 계정을 확인한다. 취임식 초대 메일의 주소와 맞대면 마지막 문장이 풀린다',
      effects: [
        { type: 'evidence', cardId: 'admin_account' },
        { type: 'goal', text: '메모장에서 마지막 문장을 완성하자' },
      ],
    },
    {
      id: 'd5_ready_to_report',
      trigger: { type: 'sentenceSolved', sentenceId: 's_same_operator' },
      effects: [{ type: 'goal', text: '증거는 충분하다. 서명하지 말고 신고하자' }],
    },
    {
      id: 'd5_pull_plug',
      trigger: { type: 'interact', objectId: 'interact_router_plug' },
      note: '원격 초기화가 시작됐을 때 공유기 전원을 뽑아 막는다. 엔진이 이 기록을 보고 laptopWiped를 정한다',
      effects: [
        { type: 'flag', key: 'pulledRouterPlug', value: true },
        { type: 'goal', text: '노트북은 지켰다. 이제 신고하자' },
      ],
    },
    {
      id: 'd5_report',
      trigger: { type: 'interact', objectId: 'btn_report' },
      note: '신고처 번호는 확인된 것만 화면에 넣는다. 화면을 그대로 둔 채 기다린다',
      effects: [
        { type: 'flag', key: 'reported', value: true },
        { type: 'scene', sceneId: 'ending' },
      ],
    },
  ],
}
