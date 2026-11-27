/** 본인 확인 영상에서 찍는 방향. 대본 1일차 장면 8의 "정면 5초, 왼쪽 5초, 오른쪽 5초" */
export const CAPTURE_STEPS = [
  { id: 'front', label: '정면', guide: '화면을 똑바로 봐 주세요' },
  { id: 'left', label: '왼쪽', guide: '고개를 왼쪽으로 돌려 주세요' },
  { id: 'right', label: '오른쪽', guide: '고개를 오른쪽으로 돌려 주세요' },
] as const

/** 한 방향을 찍는 시간(초) */
export const STEP_SECONDS = 5

/**
 * 찍기 시작한 뒤 흐른 시간(초)으로 지금 찍는 방향과 그 방향의 남은 시간을 구한다.
 * 다 찍었으면 step이 CAPTURE_STEPS.length가 된다.
 */
export function captureAt(elapsed: number): { step: number; remaining: number } {
  const step = Math.min(Math.floor(elapsed / STEP_SECONDS), CAPTURE_STEPS.length)
  const isDone = step === CAPTURE_STEPS.length
  return { step, remaining: isDone ? 0 : STEP_SECONDS - (elapsed % STEP_SECONDS) }
}
