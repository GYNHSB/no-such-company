import { expect, test } from 'vitest'
import { splitTasks } from './messageTasks'

test('대괄호로 시작하는 줄은 업무 자료로, 나머지 줄은 글로 나눈다', () => {
  const body =
    '첫 업무예요!\n[검수 요청] "원금 100% 보장, 매월 8% 확정 수익."\n[고객명단_월요일] 황보미진, 도경석, 변하늘'

  expect(splitTasks(body)).toEqual({
    text: '첫 업무예요!',
    tasks: [
      { label: '검수 요청', content: '"원금 100% 보장, 매월 8% 확정 수익."' },
      { label: '고객명단_월요일', content: '황보미진, 도경석, 변하늘' },
    ],
  })
})

test('업무 자료가 없으면 글만 돌려준다', () => {
  expect(splitTasks('좋은 아침이에요 :)')).toEqual({ text: '좋은 아침이에요 :)', tasks: [] })
})

test('업무 자료만 있는 메시지는 글이 비어 있다', () => {
  expect(splitTasks('[검수 요청] "지금 가입하시면 대표가 직접 운용합니다."')).toEqual({
    text: '',
    tasks: [{ label: '검수 요청', content: '"지금 가입하시면 대표가 직접 운용합니다."' }],
  })
})
