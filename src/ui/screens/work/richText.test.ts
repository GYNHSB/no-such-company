import { expect, test } from 'vitest'
import { parseRich } from './richText'

test('굵게, 코드, 멘션을 조각으로 나눈다', () => {
  expect(parseRich('@{name} 님, *25일*까지 `고객명단_요일`로 올려 주세요')).toEqual([
    { type: 'mention', value: '@{name}' },
    { type: 'text', value: ' 님, ' },
    { type: 'bold', value: '25일' },
    { type: 'text', value: '까지 ' },
    { type: 'code', value: '고객명단_요일' },
    { type: 'text', value: '로 올려 주세요' },
  ])
})

test('꾸밈이 없으면 글 한 조각만 돌려준다', () => {
  expect(parseRich('좋은 아침이에요~ ☕')).toEqual([{ type: 'text', value: '좋은 아침이에요~ ☕' }])
})

test('짝이 맞지 않는 별표는 글로 둔다', () => {
  expect(parseRich('별점 * 하나')).toEqual([{ type: 'text', value: '별점 * 하나' }])
})
