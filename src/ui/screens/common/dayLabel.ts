import type { DayInfo } from '@/data/types'

/** 화면 시간 표기 "3일차 · 입사 5주 차" */
export const dayLabel = ({ day, week }: Pick<DayInfo, 'day' | 'week'>) =>
  `${day}일차 · 입사 ${week}주 차`
