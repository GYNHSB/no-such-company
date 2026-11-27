import { expect, test } from 'vitest'
import { DAY1_MAILS, REJECTION_MAILS, REJECTION_OPENING } from './mailScript'

test('불합격 메일은 53통이고 모두 같은 문장으로 시작한다', () => {
  expect(REJECTION_MAILS).toHaveLength(53)
  expect(REJECTION_MAILS.every((mail) => mail.body.startsWith(REJECTION_OPENING))).toBe(true)
  expect(new Set(REJECTION_MAILS.map((mail) => mail.id)).size).toBe(53)
})

test('면접 앱 안내 메일에 설치 버튼이 있다', () => {
  expect(DAY1_MAILS.map((mail) => mail.action)).toEqual([
    undefined,
    { id: 'btn_install_interview_app', label: '면접 앱 설치하기' },
    undefined,
  ])
})
