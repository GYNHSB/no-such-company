import type { WorkNavItem } from '@/ui/kit/work/WorkLayout'

/** 팀장과의 대화 */
export const DM_LEAD_ID = 'dm_kim'

// 채널 이름은 대본에 없어 지어낸 것이다. 채널 안의 글은 없다.
export const WORK_NAV: WorkNavItem[] = [
  { id: 'notice', label: '공지', kind: 'channel' },
  { id: 'general', label: '전체', kind: 'channel' },
  { id: 'work_share', label: '업무-공유', kind: 'channel' },
  { id: 'newcomer', label: '신규입사자', kind: 'channel' },
  { id: 'lunch', label: '점심-뭐먹지', kind: 'channel' },
  { id: DM_LEAD_ID, label: '김아영 팀장', kind: 'dm' },
]
