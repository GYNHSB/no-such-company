// 1일차 입사. 대본 담당이 이 파일을 견본 삼아 day2~day5를 쓴다.
// 문장은 초안이다. 다듬어서 바꿔도 된다. 구조(id, trigger, effects)만 지킨다.
import type { DayScript } from '../types'

export const day1: DayScript = {
  info: { day: 1, week: 1, weekday: '월', title: '입사' },

  evidence: [
    {
      id: 'offer_mail',
      title: '합격 메일',
      detail: '“포트폴리오 세 번째 장, 남들이 안 보는 걸 보시더라고요.”',
    },
    {
      id: 'interview_recording',
      title: '면접 녹화',
      detail: '보안 화상면접 앱에 남은 30분짜리 녹화.',
    },
    {
      id: 'face_video_request',
      title: '얼굴 영상 요청',
      detail: '“보안 정책상 정면 5초, 왼쪽 5초, 오른쪽 5초.”',
    },
  ],

  sentences: [], // 1일차에는 빈칸 문장 없음

  events: [
    {
      id: 'd1_inbox',
      trigger: { type: 'dayStart' },
      note: '불합격 메일 53통은 화면에서 목록으로만 보여준다',
      effects: [
        { type: 'goal', text: '노트북 메일함을 확인하자' },
        {
          type: 'message',
          message: {
            id: 'm_offer',
            channel: 'mail',
            from: '모레온 인사팀',
            time: '10:12',
            body: '{name} 님, 최종 합격을 축하드립니다.',
          },
        },
        { type: 'evidence', cardId: 'offer_mail' },
      ],
    },
    {
      id: 'd1_app',
      trigger: { type: 'afterEvent', eventId: 'd1_inbox', delaySec: 2 },
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_app',
            channel: 'mail',
            from: '모레온 인사팀',
            time: '10:15',
            body: '보안을 위해 면접은 전용 ‘보안 화상면접 앱’으로만 진행합니다. 설치 후 접속해 주세요.',
          },
        },
        { type: 'goal', text: '면접 앱을 설치하고 접속하자' },
      ],
    },
    {
      id: 'd1_interview',
      trigger: { type: 'interact', objectId: 'btn_install_interview_app' },
      note: '화상 면접 장면. 팀장이 SNS 내용을 포트폴리오로 착각해 칭찬. 5초 간격 깜빡임은 숨은 위화감',
      effects: [
        { type: 'scene', sceneId: 'interview' },
        { type: 'evidence', cardId: 'interview_recording' },
      ],
    },
    {
      id: 'd1_documents',
      trigger: { type: 'afterEvent', eventId: 'd1_interview', delaySec: 1 },
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_docs',
            channel: 'messenger',
            from: '김아영 팀장',
            time: '14:02',
            body: '{name} 씨 환영해요! 노트북 받으셨죠? 입사 서류(신분증 사본, 등본, 통장 사본, 졸업증명서) 올려주세요 :)',
          },
        },
        { type: 'flag', key: 'submittedDocuments', value: true },
      ],
    },
    {
      id: 'd1_face_video',
      trigger: { type: 'afterEvent', eventId: 'd1_documents', delaySec: 3 },
      note: '이야기상 반드시 넘긴다. 공범 조건 아님',
      effects: [
        {
          type: 'message',
          message: {
            id: 'm_face',
            channel: 'messenger',
            from: '김아영 팀장',
            time: '14:20',
            body: '보안 정책상 본인 확인 영상이 필요해요. 정면 5초, 왼쪽 5초, 오른쪽 5초만 찍어서 보내주세요!',
          },
        },
        { type: 'evidence', cardId: 'face_video_request' },
        { type: 'goal', text: '첫 업무를 시작하자' },
      ],
    },
  ],
}
