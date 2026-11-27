export interface TimedLine {
  /** 영상 시작부터 이 줄이 나오는 시각(초) */
  at: number
  /** '{name}'은 플레이어 이름으로 바뀐다 */
  text: string
}

/** 지금 시각(초)에 보여 줄 줄. 첫 줄보다 이르면 없음 */
export function lineAt(lines: readonly TimedLine[], sec: number): TimedLine | undefined {
  let current: TimedLine | undefined
  for (const line of lines) {
    if (line.at <= sec) current = line
  }
  return current
}

export function fillName(text: string, name: string) {
  return text.replaceAll('{name}', name)
}

// shortcut: 대본 데이터(src/data)에 영상 자막 칸이 생기기 전까지 쓰는 값. 시각은 영상이 나오면 맞춘다.
/** 1일차 장면 5. 면접관 대사 (대본 v1-2) */
export const INTERVIEW_LINES: readonly TimedLine[] = [
  {
    at: 0,
    text: '안녕하세요, {name} 님. 오버레이 박재훈입니다. 바쁘실 텐데 시간 내주셔서 감사해요.',
  },
  {
    at: 6,
    text: '보내주신 포트폴리오 잘 봤어요. 특히 세 번째 장 보고 놀랐어요. 남들이 안 보는 걸 보시더라고요.',
  },
  { at: 13, text: '저희는 그런 눈을 가진 분을 찾고 있었어요.' },
  {
    at: 17,
    text: '아, 면접을 이 앱으로만 진행하는 건 보안 때문이에요. 고객 정보를 다루는 회사라서요. 양해 부탁드려요.',
  },
  { at: 24, text: '결과는 오늘 중으로 메일 드릴게요. 좋은 소식 드릴 수 있을 것 같네요.' },
]
