import { expect, test } from 'vitest'
import {
  earlierNames,
  hasDuplicates,
  isCustomerList,
  isDuplicated,
  isSorted,
  kindOf,
  moveTo,
  splitNames,
} from './customerList'
import { splitTasks } from './messageTasks'
import { MESSENGER_DAYS } from './messengerScript'

const messages = MESSENGER_DAYS.flatMap((day) => day.messages)

/** 명단이 붙은 메시지와 그 명단의 이름들 (받은 순서) */
const lists = messages.flatMap((message) =>
  splitTasks(message.body)
    .tasks.filter(isCustomerList)
    .map((task) => ({ id: message.id, label: task.label, names: splitNames(task.content) })),
)

test('1~4일차에 고객 명단이 하나씩 붙어 있다', () => {
  expect(lists).toEqual([
    { id: 'm_first_work', label: '고객명단_월요일', names: ['황보미진', '도경석', '변하늘'] },
    {
      id: 'm_d2_work',
      label: '고객명단_수요일',
      names: ['황보미진', '도경석', '황보미진', '변하늘'],
    },
    {
      id: 'm_d3_work',
      label: '고객명단_금요일',
      names: ['황보미진', '마동현', '황보미진', '도경석'],
    },
    {
      id: 'm_d4_morning',
      label: '고객명단_화요일',
      names: ['황보미진', '변하늘', '황보미진', '마동현', '황보미진'],
    },
  ])
})

test('받은 순서는 가나다순이 아니어서 날마다 옮길 줄이 있다', () => {
  for (const { names } of lists) {
    expect(isSorted(names)).toBe(false)
  }
})

test('같은 이름이 겹쳐도 가나다순이면 맞는 순서로 본다', () => {
  expect(isSorted(['도경석', '마동현', '변하늘', '황보미진', '황보미진'])).toBe(true)
  expect(isSorted(['도경석', '황보미진', '변하늘'])).toBe(false)
})

test('겹치는 이름은 2일차부터 있고 1일차에는 지울 줄이 없다', () => {
  expect(lists.map(({ names }) => hasDuplicates(names))).toEqual([false, true, true, true])
})

test('두 줄 이상 있는 이름만 겹친 것으로 본다', () => {
  const names = ['황보미진', '도경석', '황보미진', '변하늘']

  expect(isDuplicated(names, '황보미진')).toBe(true)
  expect(isDuplicated(names, '도경석')).toBe(false)
  expect(hasDuplicates(['도경석', '변하늘', '황보미진'])).toBe(false)
})

test('줄을 아래로 옮기면 놓은 줄의 자리에 들어간다', () => {
  expect(moveTo(['황보미진', '도경석', '변하늘'], 0, 2)).toEqual(['도경석', '변하늘', '황보미진'])
})

test('줄을 위로 옮기면 놓은 줄의 자리에 들어가고 원래 목록은 그대로다', () => {
  const names = ['도경석', '황보미진', '변하늘']

  expect(moveTo(names, 2, 1)).toEqual(['도경석', '변하늘', '황보미진'])
  expect(names).toEqual(['도경석', '황보미진', '변하늘'])
})

test('1일차에는 앞선 명단이 없어 나눌 것이 없다', () => {
  expect(earlierNames(messages, 'm_first_work')).toEqual([])
})

test('앞선 날의 명단에 있던 이름은 기존, 처음 보는 이름은 신규다', () => {
  const kindsOf = (id: string) => {
    const earlier = earlierNames(messages, id)
    const names = lists.find((list) => list.id === id)?.names ?? []
    return names.map((name) => kindOf(name, earlier))
  }

  expect(kindsOf('m_d2_work')).toEqual(['known', 'known', 'known', 'known'])
  expect(kindsOf('m_d3_work')).toEqual(['known', 'new', 'known', 'known'])
  expect(kindsOf('m_d4_morning')).toEqual(['known', 'known', 'known', 'known', 'known'])
})
