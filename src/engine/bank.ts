import type { DayInfo, LedgerAccount, LedgerEntry } from '@/data/types'

/** 장부에 적힌 계좌. 언제 생겼는지를 함께 적어 둔다 */
export interface OpenedAccount extends LedgerAccount {
  /** 계좌가 생긴 날 */
  day: DayInfo
  /** 생긴 시각 "11:27". 처음부터 있던 계좌처럼 모르면 비운다 */
  time?: string
}

/** 장부에 적힌 거래. 언제, 누가 일으켰는지를 함께 적어 둔다 */
export interface RecordedEntry extends LedgerEntry {
  /** 거래가 일어난 날 */
  day: DayInfo
  /** script: 대본의 사건이 넣은 거래, player: 플레이어가 은행 앱에서 보낸 송금 */
  by: 'script' | 'player'
}

/**
 * 은행 장부. 내 명의로 된 계좌와, 그 계좌들에서 일어난 거래를 일어난 순서대로 적는다.
 * 잔액은 적어 두지 않고 balanceOf로 계산한다. 날이 바뀌어도 지우지 않는다.
 */
export interface Bank {
  accounts: OpenedAccount[]
  entries: RecordedEntry[]
}

export const emptyBank = (): Bank => ({ accounts: [], entries: [] })

/** 그 계좌의 거래. 일어난 순서대로 */
export const entriesOf = (bank: Bank, accountId: string): RecordedEntry[] =>
  bank.entries.filter((entry) => entry.accountId === accountId)

/** 그 계좌의 지금 잔액(원). 처음 잔액에 거래를 모두 더한다. 없는 계좌면 0 */
export function balanceOf(bank: Bank, accountId: string): number {
  const account = bank.accounts.find((a) => a.id === accountId)
  if (!account) return 0
  return entriesOf(bank, accountId).reduce((sum, entry) => sum + entry.amount, account.opening ?? 0)
}

/** 플레이어가 요청한 송금 */
export interface TransferRequest {
  /** 돈이 나가는 내 계좌의 id */
  from: string
  /** 받는 사람. 이름이나 계좌 번호를 적은 글 */
  to: string
  /** 보낼 돈(원) */
  amount: number
  /** 받는 사람에게 남기는 말 */
  memo?: string
  /** 보낸 시각 "23:12". 화면의 시계에서 넘긴다 */
  time: string
}

/**
 * 송금할 수 있는지. ok가 아니면 송금하지 않는다.
 * no_account: 그런 계좌가 없다, no_recipient: 받는 사람을 적지 않았다,
 * bad_amount: 금액이 1원 이상의 정수가 아니다, not_enough: 잔액이 모자라다
 */
export type TransferCheck = 'ok' | 'no_account' | 'no_recipient' | 'bad_amount' | 'not_enough'

export function checkTransfer(
  bank: Bank,
  request: Pick<TransferRequest, 'from' | 'to' | 'amount'>,
): TransferCheck {
  if (!bank.accounts.some((a) => a.id === request.from)) return 'no_account'
  if (request.to.trim() === '') return 'no_recipient'
  if (!Number.isInteger(request.amount) || request.amount <= 0) return 'bad_amount'
  if (balanceOf(bank, request.from) < request.amount) return 'not_enough'
  return 'ok'
}
