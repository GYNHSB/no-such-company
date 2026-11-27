// 지워지는 순서. 플레이어가 모은 증거가 노트북에 있다는 걸 보여 준다
export const TARGETS = [
  '검색 기록',
  '메일함',
  '메신저 대화 기록',
  '입사 서류',
  '본인 확인 영상',
  '면접 녹화',
]

/** 진행률(0~1)에서 지금까지 지운 항목 수 */
export function wipedCount(progress: number, total = TARGETS.length) {
  return Math.min(total, Math.floor(progress * total))
}
