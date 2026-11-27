/** 검수할 안내문 문장에 든 오타 하나 */
export interface Proofread {
  /** 문장에 든 틀린 표기 */
  wrong: string
  /** 바른 표기 */
  answer: string
  /** 고를 후보. wrong과 answer가 들어 있다 */
  options: readonly string[]
}

/** 메신저에서 검수할 문장이 붙는 업무 자료의 이름 (`[검수 요청] "…"`) */
export const PROOFREAD_LABEL = '검수 요청'

// shortcut: 오타와 후보는 대본에 없어 임시로 정한 값(docs/intent/notice-proofreading.md). 대본에 들어가면 그 값을 받는다.
/** 검수 요청이 붙은 메시지 id별 오타. 오타가 든 문장은 messengerScript의 그 메시지에 있다 */
export const PROOFREADS: Readonly<Record<string, Proofread>> = {
  m_first_work: { wrong: '메월', answer: '매월', options: ['메월', '매월', '매웰'] },
  m_d2_work: {
    wrong: '운용함니다',
    answer: '운용합니다',
    options: ['운용합니다요', '운용함니다', '운용합니다'],
  },
  m_d3_work: { wrong: '문이', answer: '문의', options: ['문의', '무늬', '문이'] },
}

/** 문장을 하나씩 누를 수 있는 낱말로 나눈다 */
export const splitWords = (sentence: string): string[] => sentence.trim().split(/\s+/)

/**
 * 틀린 표기가 든 낱말이 몇 번째인지 구한다.
 * 뒤에 오는 플레이어 이름에 같은 글자가 있어도 처음 나오는 것만 오타다.
 */
export const typoIndex = (words: readonly string[], { wrong }: Proofread): number =>
  words.findIndex((word) => word.includes(wrong))

/** 글에서 처음 나오는 틀린 표기를 바르게 고친다 */
export const fixTypo = (text: string, { wrong, answer }: Proofread): string =>
  text.replace(wrong, answer)
