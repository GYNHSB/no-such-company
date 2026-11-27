import { describe, expect, it } from 'vitest'
import { createBob, stepBob, type BobOffset } from './headBob'

const DT = 1 / 60
const SPEED = 1.8

/** seconds초 동안 speed(m/초)로 움직이며 발이 닿은 순서를 모은다 */
function run(seconds: number, speed: number, state = createBob()) {
  const out: BobOffset = { y: 0, side: 0, forward: 0, step: 0 }
  const steps: number[] = []
  let maxY = 0
  for (let i = 0; i < seconds / DT; i++) {
    stepBob(state, out, speed * DT, DT, SPEED, 0)
    if (out.step !== 0) steps.push(out.step)
    maxY = Math.max(maxY, Math.abs(out.y))
  }
  return { state, steps, maxY }
}

describe('stepBob', () => {
  it('걸은 거리만큼 발이 닿고, 왼발과 오른발이 번갈아 나온다', () => {
    const { steps } = run(1, SPEED) // 1.8m = 0.8m 걸음 2번
    expect(steps).toEqual([1, -1])
  })

  it('가만히 서 있으면 발소리가 나지 않고 숨만 쉰다', () => {
    const { steps, maxY } = run(10, 0)
    expect(steps).toEqual([])
    expect(maxY).toBeLessThan(0.01)
  })

  it('물리 계산의 미세한 떨림은 걸음으로 세지 않는다', () => {
    expect(run(10, 0.05).steps).toEqual([])
  })

  it('걷다가 멈추면 앞으로 쏠렸다가 제자리로 돌아온다', () => {
    const { state } = run(1, SPEED)
    const out: BobOffset = { y: 0, side: 0, forward: 0, step: 0 }
    let peak = 0
    for (let i = 0; i < 120; i++) {
      stepBob(state, out, 0, DT, SPEED, 0)
      peak = Math.max(peak, out.forward)
    }
    expect(peak).toBeGreaterThan(0.005)
    expect(Math.abs(out.forward)).toBeLessThan(0.001)
  })
})
