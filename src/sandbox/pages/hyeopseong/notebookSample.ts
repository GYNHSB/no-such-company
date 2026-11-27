import type { BlankSentence, DayNumber, EvidenceCard } from '@/data/types'

/**
 * 메모장 테스트용 견본. 대본 v1-2의 "얻는 증거"와 "빈칸 문장"을 옮겼다.
 * 카드 설명(detail)은 대본의 해당 장면 문장을 짧게 따왔다. 실제 자료는 날짜 담당이 dayN.ts에 쓴다.
 */
export const SAMPLE_CARDS: (EvidenceCard & { day: DayNumber })[] = [
  {
    day: 1,
    id: 'offer_mail',
    title: '합격 메일',
    detail: '"보내 주신 포트폴리오를 인상 깊게 보았습니다."',
  },
  {
    day: 1,
    id: 'interview_recording',
    title: '면접 녹화',
    detail: '"세 번째 장 보고 놀랐어요. 남들이 안 보는 걸 보시더라고요."',
  },
  {
    day: 1,
    id: 'face_video_request',
    title: '얼굴 영상 요청',
    detail: '정면 5초, 왼쪽 5초, 오른쪽 5초.',
  },
  {
    day: 2,
    id: 'registry_mail',
    title: '등기 우편',
    detail: '상호: 주식회사 세움파트너스. 대표이사: 내 이름.',
  },
  {
    day: 2,
    id: 'checked_notice',
    title: '검수한 투자 안내문',
    detail: '"지금 가입하시면 대표가 직접 운용합니다."',
  },
  {
    day: 2,
    id: 'account_alert',
    title: '계좌 개설 알림',
    detail: '내 명의의 입출금 계좌가 두 개 개설됐다.',
  },
  {
    day: 3,
    id: 'leader_remark',
    title: '팀장의 한마디',
    detail: '"어젯밤에 \'세움파트너스\' 검색하셨던데, 무슨 일 있어요?"',
  },
  { day: 3, id: 'webcam_light', title: '웹캠 불빛', detail: '켠 적 없는 웹캠에 불이 들어와 있다.' },
  {
    day: 3,
    id: 'my_name_in_notice',
    title: '안내문 속 내 이름',
    detail: '"문의: 세움파트너스 대표이사 ○○"',
  },
  {
    day: 4,
    id: 'same_blink',
    title: '똑같은 깜빡임',
    detail: '하나, 둘, 셋, 넷, 다섯. 깜빡. 또 다섯. 깜빡.',
  },
  {
    day: 4,
    id: 'my_sns_post',
    title: '내 SNS 게시물',
    detail: '2년 전에 올린 손글씨 메뉴판 사진(3/7).',
  },
  {
    day: 4,
    id: 'blabla_posts',
    title: '블라블라 게시글',
    detail: '"남들이 안 보는 걸 보시더라고요." 다른 회사, 같은 칭찬.',
  },
  {
    day: 4,
    id: 'complaint_texts',
    title: '항의 문자',
    detail: '"세움파트너스 대표 ○○ 씨 맞죠? 제 돈 돌려주세요."',
  },
  {
    day: 5,
    id: 'summons',
    title: '출석 요구서',
    detail: '투자 사기 사건의 피의자로 내일 오후 2시까지 출석.',
  },
  {
    day: 5,
    id: 'inauguration_mail',
    title: '취임식 초대 메일',
    detail: '보낸 주소가 팀장 주소가 아니다.',
  },
  {
    day: 5,
    id: 'admin_account',
    title: '원격 관리 프로그램 관리자 계정',
    detail: '초대 메일을 보낸 그 주소다.',
  },
]

export const SAMPLE_SENTENCES: BlankSentence[] = [
  {
    id: 's2_registered',
    day: 2,
    text: '세움파트너스의 대표로 등기된 사람은 [0]이다',
    answers: ['registry_mail'],
  },
  {
    id: 's4_praise',
    day: 4,
    text: '면접에서 칭찬받은 내용은 포트폴리오가 아니라 [0]에 있었다',
    answers: ['my_sns_post'],
  },
  {
    id: 's4_others',
    day: 4,
    text: '같은 칭찬을 들은 사람이 [0]에 여럿 있다',
    answers: ['blabla_posts'],
  },
  {
    id: 's5_same_person',
    day: 5,
    text: '모레온의 팀장과 세움파트너스의 운영자는 [0]을 쓰는 같은 사람이다',
    answers: ['admin_account'],
  },
]
