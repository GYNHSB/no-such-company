// 「기획 질문 답변」 문서의 결정을 코드 값으로 옮긴 것.
// 값만 둔다. 이 값으로 판정하는 코드는 src/engine에 있다(엔딩 판정: src/engine/ending.ts).

export const SUSPICION = {
  start: 10,
  max: 100, // 도달하면 언제든 잠적 → 서류 위의 주범
  remoteWipeOnDay5: 70, // 5일차 취임식 중 넘으면 원격 초기화 시작
  delta: {
    taskDone: -5,
    agree: -10, // 맞장구, 하루 한 번만 효과
    taskPostponed: 5, // 건당
    probeRight: 10,
    probeWrong: 25,
    probeAndExcuseSameTalk: 10, // 추가
    excuseRepeated: 15,
    laptopSearch: 10, // 건당, 감시 발견 전 검색 포함
    captureDetected: 20,
    phoneInWebcamView: 20,
    coverWebcam: 15,
  },
  // 팀장 말투 단계 (제안, 팀 확인 필요)
  tone: [
    { from: 0, to: 39, id: 'kind' },
    { from: 40, to: 69, id: 'pushy' },
    { from: 70, to: 99, id: 'pressure' },
  ],
} as const

/** 같은 문장을 연달아 틀리면 그날 밤엔 더 못 맞춘다 */
export const BLANK_MAX_WRONG_IN_A_ROW = 2
