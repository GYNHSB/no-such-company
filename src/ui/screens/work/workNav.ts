import type { WorkNavItem } from '@/ui/kit/work/WorkLayout'

/** 팀장과의 대화 */
export const DM_LEAD_ID = 'dm_park'

/** 받은 메일함 */
export const MAIL_ID = 'mail'

// 채널 이름은 대본에 없어 지어낸 것이다. 채널 안의 글은 channelScript.ts에 있다.
export const WORK_NAV: WorkNavItem[] = [
  { id: 'notice', label: '공지', kind: 'channel' },
  { id: 'general', label: '전체', kind: 'channel' },
  { id: 'work_share', label: '업무-공유', kind: 'channel' },
  { id: 'newcomer', label: '신규입사자', kind: 'channel' },
  { id: 'lunch', label: '점심-뭐먹지', kind: 'channel' },
  { id: DM_LEAD_ID, label: '박재훈 팀장', kind: 'dm' },
  { id: MAIL_ID, label: '받은 메일함', kind: 'mail' },
]
