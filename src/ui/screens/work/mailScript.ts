import { SAMPLE_APPLICATIONS } from '@/ui/screens/laptop/jobSiteSample'
import type { Mail } from './WorkMailbox'

// shortcut: 대본 데이터(src/data/days)가 v1-2로 채워지기 전까지 쓰는 임시 값. 채워지면 그쪽에서 넘긴다.
// 본문은 대본 v1-2 문구 그대로다. 제목, 보낸 주소, 불합격 메일의 뒷문장은 대본에 없어 지어냈다.

/** 대본: 쉰세 통이 전부 이 문장으로 시작한다 */
export const REJECTION_OPENING = '귀하의 뛰어난 역량에도 불구하고'

/** 1일차 장면 2: 불합격 메일 53통. 취업 사이트 지원 현황의 서류 탈락 53건과 회사, 순서가 같다 */
export const REJECTION_MAILS: readonly Mail[] = SAMPLE_APPLICATIONS.map((application, index) => ({
  id: `reject_${index + 1}`,
  from: application.company,
  subject: '서류 전형 결과 안내',
  time: application.appliedAt,
  body: `${REJECTION_OPENING} 이번 채용에서는 모시지 못하게 되었습니다.`,
}))

const HR = { from: '오버레이 인사팀', address: 'recruit@overlay.example' }

/** 1일차 장면 4·6: 도착하는 순서대로 */
export const DAY1_MAILS: readonly Mail[] = [
  {
    ...HR,
    id: 'm_pass',
    subject: '서류 전형 결과 안내',
    time: '10:12',
    body: '{name} 님, 서류 전형에 합격하셨습니다. 보내 주신 포트폴리오를 인상 깊게 보았습니다.',
  },
  {
    ...HR,
    id: 'm_app',
    subject: '화상 면접 안내',
    time: '10:15',
    body: "보안을 위해 면접은 전용 '보안 화상면접 앱'으로만 진행합니다. 설치 후 접속해 주세요.",
    action: { id: 'btn_install_interview_app', label: '면접 앱 설치하기' },
  },
  {
    ...HR,
    id: 'm_final',
    subject: '최종 합격 안내',
    time: '13:30',
    body: '{name} 님, 최종 합격을 축하드립니다. 업무 환경을 다 세팅한 노트북을 보내 드렸어요.',
  },
]

// shortcut: 임시 주소. 원격 관리 프로그램 관리자 계정 화면(#55)과 같은 값이어야 하므로 확정되면 한곳에서 가져온다.
export const INVITE_SENDER_ADDRESS = 'admin@seum-partners.example'

/** 5일차 장면 2: 취임식 초대 */
export const DAY5_MAILS: readonly Mail[] = [
  {
    id: 'm_d5_invite',
    from: '세움파트너스 운영지원',
    address: INVITE_SENDER_ADDRESS,
    subject: '대표이사 취임식 안내',
    time: '09:10',
    body: '{name} 님, 그동안의 성과를 인정받아 대표이사로 모시게 되었습니다. 오전 10시, 화상으로 취임식을 진행합니다.',
  },
]
