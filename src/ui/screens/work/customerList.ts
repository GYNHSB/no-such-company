import type { Message } from '@/data/types'
import { splitTasks, type MessageTask } from './messageTasks'

/** 신규(처음 보는 이름)인지 기존(앞선 날의 명단에 있던 이름)인지 */
export type CustomerKind = 'new' | 'known'

/** 메신저의 업무 자료가 고객 명단인지 (`[고객명단_월요일] …`) */
export const isCustomerList = (task: MessageTask): boolean => task.label.startsWith('고객명단')

/** 명단 내용(`황보미진, 도경석, 변하늘`)을 이름으로 나눈다. 겹치는 이름도 그대로 둔다 */
export const splitNames = (content: string): string[] =>
  content.split(',').map((name) => name.trim())

/** 이 메시지보다 먼저 온 명단들에 있던 이름. 1일차 명단은 앞선 명단이 없어 빈 목록이다 */
export function earlierNames(messages: readonly Message[], id: string): string[] {
  const index = messages.findIndex((message) => message.id === id)
  return messages
    .slice(0, Math.max(0, index))
    .flatMap((message) => splitTasks(message.body).tasks)
    .filter(isCustomerList)
    .flatMap((task) => splitNames(task.content))
}

export const kindOf = (name: string, earlier: readonly string[]): CustomerKind =>
  earlier.includes(name) ? 'known' : 'new'

/** 가나다순인지. 한글 음절은 코드 순서가 가나다순이라 그대로 견준다. 같은 이름끼리는 어느 쪽이 위여도 된다 */
export const isSorted = (names: readonly string[]): boolean =>
  names.every((name, index) => index === 0 || names[index - 1] <= name)

/** 이 이름이 명단에 두 줄 이상 있는지. 겹친 줄만 지울 수 있다 */
export const isDuplicated = (names: readonly string[], name: string): boolean =>
  names.indexOf(name) !== names.lastIndexOf(name)

/** 겹치는 이름이 아직 남아 있는지 */
export const hasDuplicates = (names: readonly string[]): boolean =>
  names.some((name) => isDuplicated(names, name))

/** from번째 줄을 빼서 to번째 줄의 자리에 넣은 새 목록 */
export function moveTo<T>(list: readonly T[], from: number, to: number): T[] {
  const rest = list.filter((_, index) => index !== from)
  return [...rest.slice(0, to), list[from], ...rest.slice(to)]
}
