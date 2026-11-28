import { balanceOf, entriesOf, type Bank } from '@/engine/bank'
import { dateOfDay } from '@/stores/phoneStore'
import type { BankAccount } from './BankApp'

/**
 * 엔진의 은행 장부를 은행 앱이 그릴 모양으로 바꾼다. 잔액은 거래에서 계산하고, 몇 일차인지는 실제 날짜로 바꾼다.
 * 생긴 시각을 모르는 계좌(처음부터 있던 계좌)는 개설한 때를 비워 둔다.
 */
export function accountsOf(bank: Bank, weekOne: Date): BankAccount[] {
  return bank.accounts.map((account) => ({
    id: account.id,
    label: account.label,
    number: account.number,
    balance: balanceOf(bank, account.id),
    opened: account.time
      ? { date: dateOfDay(weekOne, account.day), time: account.time }
      : undefined,
    entries: entriesOf(bank, account.id).map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      counterparty: entry.counterparty,
      memo: entry.memo,
      date: dateOfDay(weekOne, entry.day),
      time: entry.time,
    })),
  }))
}
