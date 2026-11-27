// 1인칭 시점의 작은 흔들림: 가만히 있을 때의 숨, 걸을 때의 뚜벅뚜벅, 멈출 때의 쏠림.
// 값은 직접 걸어 보며 맞춘 것이 아니라 첫 추정값이다. 어지러우면 크기부터 줄인다.

/** 한 걸음의 길이(m). 걷는 속도 1.8m/초면 초당 약 2.3걸음이다. */
const STEP_LENGTH = 0.8
/** 이보다 느리면 걷는 것으로 치지 않는다(m/초). 물리 계산의 미세한 떨림을 걸음으로 세지 않게 한다. */
const MIN_WALK_SPEED = 0.3
/** 걸을 때 위아래 흔들림 폭(m). 발이 닿는 순간 가장 낮다. */
const WALK_Y = 0.03
/** 걸을 때 좌우 흔들림 폭(m). 두 걸음에 한 번 왕복한다. */
const WALK_X = 0.012
/** 숨쉴 때 위아래 폭(m)과 빠르기(초당 횟수). 경계심이 높으면 더 크고 빨라진다. */
const BREATH_Y = 0.008
const BREATH_RATE = 0.25
const BREATH_RATE_TENSE = 0.5
/** 멈출 때 앞으로 쏠리는 힘과 되돌아오는 용수철 */
const SETTLE_KICK = 0.25
const SETTLE_SPRING = 90
const SETTLE_DAMPING = 12

export interface BobState {
  /** 지금까지 걸은 걸음 수(소수). 정수를 지날 때마다 발이 바닥에 닿는다. */
  steps: number
  /** 걷는 정도(0: 서 있음 ~ 1: 다 걷는 중). 흔들림을 숨과 걸음 사이에서 부드럽게 바꾼다. */
  walk: number
  moving: boolean
  breath: number
  settle: number
  settleVelocity: number
}

export interface BobOffset {
  /** 위(+)아래(-) */
  y: number
  /** 시선 기준 오른쪽(+) */
  side: number
  /** 시선 기준 앞(+) */
  forward: number
  /** 이번 프레임에 발이 닿았으면 그 발(왼발 -1, 오른발 1), 아니면 0 */
  step: -1 | 0 | 1
}

export function createBob(): BobState {
  return { steps: 0, walk: 0, moving: false, breath: 0, settle: 0, settleVelocity: 0 }
}

/** 들숨은 짧고(40%) 날숨은 길게(60%). 0~1 사이 값 */
function breathCurve(phase: number) {
  const p = phase % 1
  const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2
  return p < 0.4 ? ease(p / 0.4) : 1 - ease((p - 0.4) / 0.6)
}

/**
 * 한 프레임만큼 흔들림을 진행한다. state를 직접 바꾸고(매 프레임 새 객체를 만들지 않으려고) out에 결과를 쓴다.
 * moved: 이번 프레임에 수평으로 움직인 거리(m), fullSpeed: 다 걸을 때 속도, tension: 경계심(0~1)
 */
export function stepBob(
  state: BobState,
  out: BobOffset,
  moved: number,
  dt: number,
  fullSpeed: number,
  tension: number,
): BobOffset {
  const speed = dt > 0 ? moved / dt : 0
  const moving = speed > MIN_WALK_SPEED
  const target = moving ? Math.min(speed / fullSpeed, 1) : 0
  state.walk += (target - state.walk) * Math.min(1, dt * 8)

  out.step = 0
  if (moving) {
    const before = Math.floor(state.steps)
    state.steps += moved / STEP_LENGTH
    const after = Math.floor(state.steps)
    if (after > before) out.step = after % 2 === 0 ? -1 : 1
  } else if (state.moving && state.walk > 0.5) {
    // 걷다가 멈춘 순간 몸이 앞으로 살짝 쏠린다
    state.settleVelocity += SETTLE_KICK
  }
  state.moving = moving

  const acceleration = -SETTLE_SPRING * state.settle - SETTLE_DAMPING * state.settleVelocity
  state.settleVelocity += acceleration * dt
  state.settle += state.settleVelocity * dt

  state.breath += dt * (BREATH_RATE + (BREATH_RATE_TENSE - BREATH_RATE) * tension)
  const breath = BREATH_Y * (1 + 0.6 * tension) * (breathCurve(state.breath) - 0.5)
  const stride = Math.sin(Math.PI * state.steps)

  out.y =
    WALK_Y * state.walk * (Math.abs(stride) - 0.5) + breath * (1 - state.walk) - state.settle * 0.5
  out.side = WALK_X * state.walk * stride
  out.forward = state.settle
  return out
}
