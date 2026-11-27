import { expect, test } from 'vitest'
import { CAPTURE_STEPS, captureAt } from './videoCapture'

test('정면, 왼쪽, 오른쪽 순서로 찍는다', () => {
  expect(CAPTURE_STEPS.map((step) => step.label)).toEqual(['정면', '왼쪽', '오른쪽'])
})

test('찍기 시작하면 정면을 5초 남기고 찍는다', () => {
  expect(captureAt(0)).toEqual({ step: 0, remaining: 5 })
})

test('한 방향을 찍는 동안 남은 시간이 1초씩 줄어든다', () => {
  expect(captureAt(4)).toEqual({ step: 0, remaining: 1 })
})

test('5초가 지나면 다음 방향으로 넘어가고 남은 시간이 다시 5초가 된다', () => {
  expect(captureAt(5)).toEqual({ step: 1, remaining: 5 })
  expect(captureAt(12)).toEqual({ step: 2, remaining: 3 })
})

test('세 방향을 다 찍으면 방향이 남지 않는다', () => {
  expect(captureAt(15)).toEqual({ step: CAPTURE_STEPS.length, remaining: 0 })
  expect(captureAt(99)).toEqual({ step: CAPTURE_STEPS.length, remaining: 0 })
})
