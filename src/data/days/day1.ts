// 1일차 입사. 대본 v1-2(docs/261126_대본_v1-2.md)의 장면 1~9를 옮겼다. 대본 담당이 이 파일을 견본 삼아 day2~day5를 쓴다.
// 구조(id, trigger, effects)만 지키면 문장은 다듬어도 된다.
// 메시지 id는 화면 쪽 견본과 같다: 메일 mailScript.ts, 메신저 messengerScript.ts. 화면은 이 id로 제목과 버튼을 찾는다.
// 누르는 것(objectId): interact_laptop(노트북 앞에 앉기), interact_phone(휴대폰 보기), 그 밖은 화면 버튼 id.
// laptop_tab:사이트는 브라우저에서 그 사이트의 탭을 앞으로 가져왔을 때, laptop_leave는 노트북에서 눈을 뗐을 때 온다(laptopSignal).
// objectId를 배열로 적으면 그 가운데 하나만 와도 사건이 일어난다.
import { laptopSignal } from '@/engine/laptopSignal'
import type { DayScript, Message } from '../types'

const HR = '모레온 인사팀'
const LEAD = '김아영 팀장'

const mail = (id: string, time: string, body: string): Message => ({
  id,
  channel: 'mail',
  from: HR,
  time,
  body,
})
const fromLead = (id: string, time: string, body: string): Message => ({
  id,
  channel: 'messenger',
  from: LEAD,
  time,
  body,
})

export const day1: DayScript = {
  info: { day: 1, week: 1, weekday: '월', title: '입사' },

  evidence: [
    {
      id: 'offer_mail',
      title: '합격 메일',
      detail: '“보내 주신 포트폴리오를 인상 깊게 보았습니다.”',
    },
    {
      id: 'interview_recording',
      title: '면접 녹화',
      detail: '보안 화상면접 앱에 남은 면접 녹화.',
    },
    {
      id: 'face_video_request',
      title: '얼굴 영상 요청',
      detail: '“보안 정책상 정면 5초, 왼쪽 5초, 오른쪽 5초.”',
    },
  ],

  sentences: [], // 1일차에는 빈칸 문장 없음

  events: [
    // 장면 1. 반지하 원룸, 아침
    {
      id: 'd1_wake',
      trigger: { type: 'dayStart' },
      effects: [
        {
          type: 'monologue',
          lines: [
            '나는 {name}.',
            '서른 살. 취업 준비 6년 차.',
            '6년이면 대학을 한 번 더 다니고도 남는다.',
            '이 반지하에서 지원서만 몇 장을 썼는지 모르겠다.',
            '오늘도 눈 뜨자마자 할 일은 하나다.',
            '메일함 확인.',
          ],
        },
        { type: 'goal', text: '책상 위 노트북을 확인하세요.' },
        // 브라우저에 탭 두 개가 떠 있다. 취업 사이트, 메일함 순서로 열고 취업 사이트를 앞에 둔다
        { type: 'laptop', screen: 'jobsite' },
        { type: 'laptop', screen: 'mail' },
        { type: 'laptop', screen: 'jobsite' },
        // 주인공이 원래 쓰던 계좌. 은행 앱에 처음부터 보인다. 계좌 번호와 잔액은 대본에 없어 임의로 넣었다
        {
          type: 'bankOpen',
          account: { id: 'mine', label: '입출금통장', number: '412-208-173904', opening: 847_200 },
        },
      ],
    },

    // 장면 2. 노트북: 취업 사이트와 메일함
    {
      id: 'd1_jobsite',
      trigger: { type: 'interact', objectId: 'interact_laptop', after: 'd1_wake' },
      note: '메일함 탭을 누르거나 취업 사이트 탭을 닫으면 메일함으로 넘어간다',
      hint: '책상으로 가서 노트북에 커서를 올리고 클릭해 보세요.',
      effects: [{ type: 'monologue', lines: ['서류 탈락. 서류 탈락. 서류 탈락.'] }],
    },
    {
      id: 'd1_rejections',
      // 메일함 탭을 앞으로 가져오면 일어난다. 탭을 눌렀든, 취업 사이트 탭을 닫아서 드러났든 같다
      trigger: { type: 'interact', objectId: laptopSignal.tab('mail'), after: 'd1_jobsite' },
      note: '불합격 메일 53통은 화면에서 목록으로만 보여 준다',
      hint: '취업 사이트를 다 봤으면 위쪽의 받은편지함 탭을 눌러 보세요.',
      effects: [
        { type: 'laptop', screen: 'mail' },
        {
          type: 'monologue',
          lines: [
            '메일함도 똑같다.',
            '"귀하의 뛰어난 역량에도 불구하고."',
            '쉰세 통이 전부 이 문장으로 시작한다.',
            '뛰어나면 붙여 주든가.',
            '포트폴리오 조회 수는 오늘도 0이다.',
            '…그만 닫자.',
          ],
        },
      ],
    },
    {
      id: 'd1_close_mail',
      // 메일함을 확인한 뒤 메일함 탭을 닫거나 노트북에서 눈을 떼면 일어난다
      trigger: {
        type: 'interact',
        objectId: ['btn_mail_close', laptopSignal.leave()],
        after: 'd1_rejections',
      },
      hint: '메일함을 다 봤으면 Esc를 눌러 노트북에서 일어나 보세요.',
      effects: [{ type: 'laptop', screen: 'off' }],
    },

    // 장면 3. 휴대폰 문자
    {
      id: 'd1_sms',
      trigger: { type: 'afterEvent', eventId: 'd1_close_mail', delaySec: 2 },
      effects: [
        {
          type: 'message',
          message: {
            id: 'd1-sms-hr',
            channel: 'sms',
            from: HR,
            time: '10:11',
            body: '[모레온] {name} 님, 서류 전형 결과를 메일로 보내 드렸습니다. 확인 부탁드립니다.',
          },
        },
        { type: 'goal', text: '문자가 도착했습니다. 휴대폰을 확인하세요.' },
      ],
    },
    {
      id: 'd1_sms_read',
      trigger: { type: 'interact', objectId: 'interact_phone', after: 'd1_sms' },
      hint: '휴대폰에 문자가 왔어요. 책상 위 휴대폰을 클릭해서 확인해 보세요.',
      effects: [
        {
          type: 'monologue',
          lines: ['모레온?', '…내가 여기도 넣었었나.', '어차피 또 "불구하고"겠지.'],
        },
        { type: 'goal', text: '노트북에서 메일을 확인하세요.' },
        {
          type: 'message',
          message: mail(
            'm_pass',
            '10:12',
            '{name} 님, 서류 전형에 합격하셨습니다. 보내 주신 포트폴리오를 인상 깊게 보았습니다.',
          ),
        },
        { type: 'laptop', screen: 'mail' },
      ],
    },

    // 장면 4. 합격 메일
    {
      id: 'd1_pass',
      trigger: { type: 'interact', objectId: 'interact_laptop', after: 'd1_sms_read' },
      hint: '휴대폰을 내려놓고 노트북에서 메일을 확인해 보세요.',
      effects: [
        { type: 'evidence', cardId: 'offer_mail' },
        {
          type: 'monologue',
          lines: ['…합격?', '잠깐. 다시.', '"합격하셨습니다."', '6년 만에 처음 보는 단어다.'],
        },
      ],
    },
    {
      id: 'd1_app',
      trigger: { type: 'afterEvent', eventId: 'd1_pass', delaySec: 10 },
      effects: [
        {
          type: 'message',
          message: mail(
            'm_app',
            '10:15',
            "보안을 위해 면접은 전용 '보안 화상면접 앱'으로만 진행합니다. 설치 후 접속해 주세요.",
          ),
        },
        {
          type: 'monologue',
          lines: [
            '전용 앱으로만 면접을 본다고?',
            '보안이 철저한 회사인가 보다.',
            '좋은 회사일수록 그렇다더라.',
          ],
        },
        { type: 'goal', text: "'면접 앱 설치하기'를 눌러 면접에 접속하세요." },
      ],
    },
    {
      id: 'd1_install',
      trigger: { type: 'interact', objectId: 'btn_install_interview_app', after: 'd1_app' },
      hint: '받은편지함에서 면접 안내 메일을 열고 면접 앱을 설치해 보세요.',
      effects: [{ type: 'laptop', screen: 'install' }],
    },

    // 장면 5. 화상 면접
    {
      id: 'd1_interview',
      trigger: { type: 'interact', objectId: 'btn_interview_join', after: 'd1_install' },
      note: '팀장이 SNS 내용을 포트폴리오로 착각해 칭찬. 5초 간격 깜빡임은 숨은 위화감',
      hint: '설치 화면에서 면접에 접속해 보세요.',
      effects: [
        { type: 'laptop', screen: 'interview' },
        { type: 'evidence', cardId: 'interview_recording' },
      ],
    },
    {
      id: 'd1_interview_end',
      trigger: { type: 'interact', objectId: 'interview_end', after: 'd1_interview' },
      note: 'interview_end: 면접 영상이 끝났을 때 화면이 보내는 신호',
      effects: [
        { type: 'laptop', screen: 'mail' },
        {
          type: 'monologue',
          lines: [
            '세 번째 장을… 봤다고?',
            '거긴 아무도 안 보는 줄 알았는데.',
            '내 작업을 끝까지 봐 준 사람은 처음이다.',
          ],
        },
      ],
    },

    // 장면 6. 최종 합격과 업무용 노트북
    {
      id: 'd1_final',
      trigger: { type: 'afterEvent', eventId: 'd1_interview_end', delaySec: 9 },
      effects: [
        { type: 'dateCard', text: '그날 오후' },
        {
          type: 'message',
          message: mail(
            'm_final',
            '13:30',
            '{name} 님, 최종 합격을 축하드립니다. 업무 환경을 다 세팅한 노트북을 보내 드렸어요.',
          ),
        },
        {
          type: 'monologue',
          lines: ['됐다.', '진짜 됐다.', '엄마한테 전화해야 하는데, 손이 떨려서 못 하겠다.'],
        },
        { type: 'goal', text: '업무용 노트북이 도착했습니다. 노트북을 열어 보세요.' },
        { type: 'laptop', screen: 'work' },
      ],
    },
    {
      id: 'd1_work_laptop',
      trigger: { type: 'interact', objectId: 'interact_laptop', after: 'd1_final' },
      hint: '노트북을 다시 확인해 보세요.',
      effects: [
        {
          type: 'monologue',
          lines: ['업무 환경이 다 세팅돼 있다.', '나는 켜기만 하면 된다.', '이런 게 회사구나.'],
        },
      ],
    },

    // 장면 7. 입사 서류
    {
      id: 'd1_documents',
      trigger: { type: 'afterEvent', eventId: 'd1_work_laptop', delaySec: 8 },
      effects: [
        {
          type: 'message',
          message: fromLead(
            'm_docs',
            '14:02',
            '{name} 씨 환영해요! 노트북 받으셨죠? 입사 서류(신분증 사본, 등본, 통장 사본, 졸업증명서) 올려주세요 :)',
          ),
        },
        {
          type: 'monologue',
          lines: [
            '신분증, 등본, 통장 사본, 졸업증명서.',
            '어느 회사나 내는 서류다.',
            '6년을 기다렸는데 이 정도야.',
          ],
        },
        { type: 'goal', text: '입사 서류를 올리세요.' },
      ],
    },
    {
      id: 'd1_documents_sent',
      trigger: { type: 'interact', objectId: 'btn_work_send', after: 'd1_documents' },
      hint: '메신저에서 팀장이 요청한 서류를 골라 보내 보세요.',
      effects: [{ type: 'flag', key: 'submittedDocuments', value: true }],
    },

    // 장면 8. 얼굴 영상
    {
      id: 'd1_face_video',
      trigger: { type: 'afterEvent', eventId: 'd1_documents_sent', delaySec: 3 },
      note: '이야기상 반드시 넘긴다. 공범 조건 아님',
      effects: [
        {
          type: 'message',
          message: fromLead(
            'm_face',
            '14:20',
            '보안 정책상 본인 확인 영상이 필요해요. 정면 5초, 왼쪽 5초, 오른쪽 5초만 찍어서 보내주세요!',
          ),
        },
        { type: 'evidence', cardId: 'face_video_request' },
        {
          type: 'monologue',
          lines: [
            '정면, 왼쪽, 오른쪽?',
            '좀 이상하긴 한데… 보안 정책이라잖아.',
            '첫날부터 까다로운 사람으로 보이긴 싫다.',
          ],
        },
        { type: 'goal', text: '영상을 찍어 보내세요.' },
      ],
    },

    // 장면 9. 첫 업무
    {
      id: 'd1_first_work',
      trigger: { type: 'interact', objectId: 'btn_work_video_send', after: 'd1_face_video' },
      hint: '메신저에서 얼굴 영상을 찍어 보내 보세요.',
      effects: [
        {
          type: 'message',
          message: fromLead(
            'm_first_work',
            '14:40',
            '첫 업무예요! 안내문 맞춤법 검수랑 고객 명단 정리, 천천히 해 주세요 :)\n[검수 요청] "원금 100% 보장, 메월 8% 확정 수익."\n[고객명단_월요일] 황보미진, 도경석, 변하늘',
          ),
        },
        {
          type: 'monologue',
          lines: [
            '맞춤법 검수라니. 쉬운 일부터 주는구나.',
            '그런데 우리 회사가 투자 상품도 하던가.',
            '뭐, 신입이 알 게 뭐람.',
            '오늘은 일찍 자야지. 내일도 출근이니까.',
          ],
        },
        { type: 'goal', text: '1일차가 끝났습니다.' },
        { type: 'dayEnd' },
      ],
    },
  ],
}
