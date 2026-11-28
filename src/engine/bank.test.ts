import { describe, expect, it } from 'vitest'
import type { DayScript, Message } from '@/data/types'
import { balanceOf, checkTransfer, entriesOf } from './bank'
import { phoneSignal } from './phoneSignal'
import { newStory, signal, startDay, transfer } from './story'

const notice: Message = {
  id: 'd2-bank-open-1',
  channel: 'bank',
  from: '하나로은행',
  time: '11:27',
  body: '{name} 님 명의의 입출금 계좌가 개설되었습니다.',
}

/** 원래 계좌 하나로 시작하고, 버튼 이름으로 계좌 개설과 거래를 일으키는 대본 */
const script: DayScript = {
  info: { day: 2, week: 3, weekday: '월', title: '흔적' },
  evidence: [],
  sentences: [],
  events: [
    {
      id: 'start',
      trigger: { type: 'dayStart' },
      effects: [
        {
          type: 'bankOpen',
          account: { id: 'mine', label: '입출금통장', number: '412-208-173904', opening: 800_000 },
        },
      ],
    },
    {
      id: 'opened',
      trigger: { type: 'interact', objectId: 'open' },
      effects: [{ type: 'bankOpen', account: { id: 'unknown', label: '입출금통장' }, notice }],
    },
    {
      id: 'quiet_deposit',
      trigger: { type: 'interact', objectId: 'deposit' },
      effects: [
        {
          type: 'bankEntry',
          entry: {
            id: 'e1',
            accountId: 'unknown',
            amount: 5_000_000,
            counterparty: '김○○',
            time: '14:02',
          },
        },
      ],
    },
    {
      id: 'much_money',
      trigger: { type: 'balance', accountId: 'unknown', atLeast: 5_000_000 },
      effects: [{ type: 'monologue', lines: ['이 돈은 뭐지.'] }],
    },
    {
      id: 'broke',
      trigger: { type: 'balance', accountId: 'mine', atMost: 0 },
      effects: [{ type: 'flag', key: 'broke', value: true }],
    },
    {
      id: 'sent_to_team',
      trigger: { type: 'interact', objectId: phoneSignal.transfer('세움파트너스') },
      effects: [{ type: 'flag', key: 'gaveMoney', value: true }],
    },
  ],
}

const started = startDay(newStory(2), script).state
const press = (state: typeof started, objectId: string) =>
  signal(state, script, { type: 'interact', objectId }).state

describe('은행 장부', () => {
  it('대본이 계좌를 열면 장부에 생기고, 잔액은 처음 잔액이다', () => {
    expect(started.bank.accounts.map((a) => a.id)).toEqual(['mine'])
    expect(balanceOf(started.bank, 'mine')).toBe(800_000)
    expect(started.bank.accounts[0].day.day).toBe(2)
  })

  it('알림과 함께 여는 계좌는 은행 알림도 함께 온다', () => {
    const state = press(started, 'open')
    expect(state.bank.accounts.map((a) => a.id)).toEqual(['mine', 'unknown'])
    expect(state.bank.accounts[1].time).toBe('11:27')
    expect(state.messages.map((m) => m.id)).toEqual(['d2-bank-open-1'])
    expect(balanceOf(state.bank, 'unknown')).toBe(0)
  })

  it('알림 없는 거래는 메시지 없이 내역에만 남고 잔액이 바뀐다', () => {
    const state = press(press(started, 'open'), 'deposit')
    expect(state.messages).toHaveLength(1)
    expect(entriesOf(state.bank, 'unknown').map((e) => e.id)).toEqual(['e1'])
    expect(state.bank.entries[0].by).toBe('script')
    expect(balanceOf(state.bank, 'unknown')).toBe(5_000_000)
  })

  it('잔액이 조건에 맞게 되면 그 사건이 한 번 일어난다', () => {
    const opened = press(started, 'open')
    expect(opened.fired).not.toContain('much_money')
    const state = press(opened, 'deposit')
    expect(state.fired).toContain('much_money')
    expect(state.said).toEqual(['이 돈은 뭐지.'])
  })

  it('같은 id의 계좌나 거래를 다시 넣어도 두 번 적지 않는다', () => {
    const again = startDay(press(press(started, 'open'), 'deposit'), script).state
    expect(again.bank.accounts).toHaveLength(2)
    expect(again.bank.entries).toHaveLength(1)
  })

  it('없는 계좌의 잔액은 0이고 잔액 조건도 보지 않는다', () => {
    expect(balanceOf(started.bank, 'nowhere')).toBe(0)
    // unknown 계좌가 아직 없으므로 much_money는 물론이고 다른 조건도 일어나지 않는다
    expect(started.fired).toEqual(['start'])
  })
})

describe('플레이어의 송금', () => {
  const request = { from: 'mine', to: '세움파트너스', amount: 300_000, time: '23:12' }

  it('보내면 나가는 거래가 적히고 잔액이 줄어든다', () => {
    const { state } = transfer(started, script, request)
    const [entry] = entriesOf(state.bank, 'mine')
    expect(entry).toMatchObject({
      amount: -300_000,
      counterparty: '세움파트너스',
      time: '23:12',
      by: 'player',
    })
    expect(balanceOf(state.bank, 'mine')).toBe(500_000)
  })

  it('보내면 대본이 받을 수 있는 신호가 나간다', () => {
    const { state } = transfer(started, script, { ...request, to: '  세움파트너스 ' })
    expect(state.flags.gaveMoney).toBe(true)
  })

  it('전부 보내서 잔액 조건에 맞으면 그 사건도 일어난다', () => {
    const { state } = transfer(started, script, { ...request, to: '엄마', amount: 800_000 })
    expect(balanceOf(state.bank, 'mine')).toBe(0)
    expect(state.flags.broke).toBe(true)
  })

  it('보낼 수 없는 송금은 이유를 알려 주고 아무것도 바꾸지 않는다', () => {
    const { bank } = started
    expect(checkTransfer(bank, request)).toBe('ok')
    expect(checkTransfer(bank, { ...request, from: 'nowhere' })).toBe('no_account')
    expect(checkTransfer(bank, { ...request, to: '  ' })).toBe('no_recipient')
    expect(checkTransfer(bank, { ...request, amount: 0 })).toBe('bad_amount')
    expect(checkTransfer(bank, { ...request, amount: 1000.5 })).toBe('bad_amount')
    expect(checkTransfer(bank, { ...request, amount: 800_001 })).toBe('not_enough')
    expect(transfer(started, script, { ...request, amount: 800_001 }).state).toBe(started)
  })

  it('여러 번 보내면 거래마다 다른 id가 붙는다', () => {
    const once = transfer(started, script, request).state
    const twice = transfer(once, script, { ...request, to: '엄마', amount: 1000 }).state
    expect(entriesOf(twice.bank, 'mine').map((e) => e.id)).toEqual(['transfer-1', 'transfer-2'])
  })
})
