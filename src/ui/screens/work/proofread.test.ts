import { expect, test } from 'vitest'
import { splitTasks } from './messageTasks'
import { MESSENGER_DAYS } from './messengerScript'
import { PROOFREAD_LABEL, PROOFREADS, fixTypo, splitWords, typoIndex } from './proofread'

const messages = MESSENGER_DAYS.flatMap((day) => day.messages)

/** 그 메시지에 붙은 검수 요청 문장 */
function sentenceOf(id: string): string {
  const body = messages.find((message) => message.id === id)?.body ?? ''
  return splitTasks(body).tasks.find((task) => task.label === PROOFREAD_LABEL)?.content ?? ''
}

test('1~3일차 검수 요청 문장마다 오타가 하나씩 들어 있다', () => {
  expect(Object.keys(PROOFREADS)).toEqual(['m_first_work', 'm_d2_work', 'm_d3_work'])
  for (const [id, proofread] of Object.entries(PROOFREADS)) {
    expect(sentenceOf(id).split(proofread.wrong)).toHaveLength(2)
  }
})

test('오타를 고치면 대본의 문장이 된다', () => {
  expect(fixTypo(sentenceOf('m_first_work'), PROOFREADS.m_first_work)).toBe(
    '"원금 100% 보장, 매월 8% 확정 수익."',
  )
  expect(fixTypo(sentenceOf('m_d2_work'), PROOFREADS.m_d2_work)).toBe(
    '"지금 가입하시면 대표가 직접 운용합니다."',
  )
  expect(fixTypo(sentenceOf('m_d3_work'), PROOFREADS.m_d3_work)).toBe(
    '"… 문의: 세움파트너스 대표이사 {name}"',
  )
})

test('후보는 서로 다른 세 개이고 바른 표기와 지금의 틀린 표기가 들어 있다', () => {
  for (const { wrong, answer, options } of Object.values(PROOFREADS)) {
    expect(new Set(options).size).toBe(3)
    expect(options).toContain(answer)
    expect(options).toContain(wrong)
  }
})

test('틀린 표기가 든 낱말이 몇 번째인지 찾는다', () => {
  const words = splitWords('"원금 100% 보장, 메월 8% 확정 수익."')

  expect(words[typoIndex(words, PROOFREADS.m_first_work)]).toBe('메월')
})

test('이름에 오타와 같은 글자가 있어도 앞의 낱말만 오타로 보고 고친다', () => {
  const sentence = '"… 문이: 세움파트너스 대표이사 문이수"'

  expect(typoIndex(splitWords(sentence), PROOFREADS.m_d3_work)).toBe(1)
  expect(fixTypo(sentence, PROOFREADS.m_d3_work)).toBe('"… 문의: 세움파트너스 대표이사 문이수"')
})
