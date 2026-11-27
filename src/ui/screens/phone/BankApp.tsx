import { useEffect, useState } from 'react'
import { AppIcon } from '@/ui/kit/phone/AppIcon'
import { PhoneNav } from '@/ui/kit/phone/PhoneNav'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './BankApp.module.css'
import { daysAgo, formatDayTime } from './clock'
import type { ReceivedMessage } from './MessagesApp'

/** 내 명의로 된 계좌 하나 */
export interface BankAccount {
  id: string
  /** 계좌 이름. "입출금통장" */
  label: string
  /** 계좌 번호. 없으면 그리지 않는다 */
  number?: string
  /** 잔액(원). 없으면 "잔액 숨김"으로 보인다 */
  balance?: number
  /** 계좌가 만들어진 때. 모르면 비운다 */
  opened?: { date: Date; time: string }
}

/** 내 카드 하나 */
export interface BankCard {
  id: string
  /** 카드 이름. "체크카드" */
  label: string
  /** 카드 번호 끝 네 자리 */
  last4: string
  /** 이번 달에 쓴 돈(원) */
  spent: number
}

interface Props {
  /** 지금 시각 "11:31". 상태 표시줄에 쓴다 */
  time: string
  /** 오늘 날짜. 계좌와 알림이 오늘 것인지 가린다 */
  today: Date
  /** 은행 이름(가상 이름) */
  bank: string
  /** 계좌 주인 이름. 플레이어가 입력한 이름이다 */
  owner: string
  /** 지금 내 명의로 되어 있는 계좌 전부 */
  accounts: BankAccount[]
  /** 내 카드. 없으면 카드 묶음을 그리지 않는다 */
  cards?: BankCard[]
  /** 지금까지 받은 은행 알림을 받은 순서대로 모두 넘긴다 */
  notices: ReceivedMessage[]
  /** 이미 읽은 알림의 id. 여기에 없는 알림이 있으면 종 모양에 빨간 점이 붙는다 */
  readIds: readonly string[]
  /** 알림 화면에서 알림이 보였을 때. 받는 쪽이 readIds에 더해서 다시 넘긴다 */
  onRead: (ids: string[]) => void
  /** 왼쪽 위 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

type Tab = 'accounts' | 'notices'

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

/**
 * 휴대폰 은행 앱. 요즘 은행 앱의 구조를 따른다(첫 화면에 계좌와 카드, 알림은 오른쪽 위 종과 아래 탭으로 따로).
 * 휴대폰 기본 앱이 아니라서 다크 모드를 따르지 않고, 가상 은행의 색(--bank-*)을 쓰는 밝은 화면이다.
 * 실제 은행 앱의 이름, 로고, 고유 색은 쓰지 않는다.
 * 계좌가 몇 개인지, 언제 만들어졌는지, 잔액이 얼마인지는 받은 값을 그리기만 한다.
 */
export function BankApp({
  time,
  today,
  bank,
  owner,
  accounts,
  cards = [],
  notices,
  readIds,
  onRead,
  onHome,
}: Props) {
  const [tab, setTab] = useState<Tab>('accounts')
  const newestFirst = notices.toReversed()
  const unreadKey = notices
    .filter((n) => !readIds.includes(n.id))
    .map((n) => n.id)
    .join('\n')

  const hasUnread = unreadKey !== ''

  // 알림 화면에 보인 알림은 읽은 것으로 알린다. 열어 둔 채 새 알림이 와도 마찬가지다
  useEffect(() => {
    if (tab === 'notices' && unreadKey) onRead(unreadKey.split('\n'))
  }, [tab, unreadKey, onRead])

  return (
    <div className={styles.theme}>
      <PhoneScreen time={time} onHome={onHome}>
        <div className={styles.bank}>
          <div className={styles.page}>
            {tab === 'accounts' ? (
              <>
                <PhoneNav
                  title={bank}
                  backLabel={onHome && '홈'}
                  onBack={onHome}
                  right={
                    <button
                      type="button"
                      className={styles.bellButton}
                      onClick={() => setTab('notices')}
                      aria-label={hasUnread ? '알림, 새 알림 있음' : '알림'}
                    >
                      <span className={styles.bell}>
                        <BellIcon />
                        {hasUnread && <i />}
                      </span>
                    </button>
                  }
                />
                <section className={styles.card} aria-labelledby="bank-accounts">
                  <h2 id="bank-accounts" className={styles.cardHead}>
                    <span>{owner} 님의 계좌</span>
                    <span className={styles.count}>{accounts.length}개</span>
                  </h2>
                  <ul className={styles.accounts}>
                    {accounts.map((account) => {
                      const isNew = account.opened && daysAgo(today, account.opened.date) <= 0
                      return (
                        <li key={account.id} className={styles.account}>
                          <span className={styles.accountIcon}>
                            <AppIcon kind="bank" />
                          </span>
                          <span className={styles.accountText}>
                            <span className={styles.accountLabel}>
                              {account.label}
                              {isNew && <span className={styles.tag}>새 계좌</span>}
                            </span>
                            <span className={styles.balance}>
                              {account.balance === undefined ? (
                                <span className={styles.hidden}>잔액 숨김</span>
                              ) : (
                                won(account.balance)
                              )}
                            </span>
                            {account.number && (
                              <span className={styles.accountMeta}>{account.number}</span>
                            )}
                            {account.opened && (
                              <span className={styles.accountMeta}>
                                {formatDayTime(today, account.opened.date, account.opened.time)}{' '}
                                개설
                              </span>
                            )}
                          </span>
                          {/* 이체는 할 수 없다. 단추는 모양만 있다 */}
                          <span className={styles.transfer} aria-hidden="true">
                            이체
                          </span>
                        </li>
                      )
                    })}
                    {/* 계좌를 더 만드는 줄. 모양만 있고 눌리지 않는다 */}
                    <li className={`${styles.account} ${styles.add}`} aria-hidden="true">
                      <span className={styles.addIcon}>+</span>
                      계좌 추가
                    </li>
                  </ul>
                </section>
                {cards.length > 0 && (
                  <section className={styles.card} aria-labelledby="bank-cards">
                    <h2 id="bank-cards" className={styles.cardHead}>
                      <span>내 카드</span>
                      <span className={styles.count}>{cards.length}개</span>
                    </h2>
                    <ul className={styles.accounts}>
                      {cards.map((card) => (
                        <li key={card.id} className={styles.account}>
                          <span className={styles.plastic} aria-hidden="true">
                            <i />
                          </span>
                          <span className={styles.accountText}>
                            <span className={styles.cardLabel}>{card.label}</span>
                            <span className={styles.accountMeta}>끝자리 {card.last4}</span>
                          </span>
                          <span className={styles.spent}>
                            <span className={styles.accountMeta}>이번 달 사용</span>
                            <strong>{won(card.spent)}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {/* 은행 앱에 흔히 있는 메뉴. 모양만 있고 눌리지 않는다 */}
                <ul className={`${styles.card} ${styles.menu}`} aria-hidden="true">
                  <li>
                    이체 내역 <span>›</span>
                  </li>
                  <li>
                    고객센터 <span>›</span>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <PhoneNav title="알림" backLabel={onHome && '홈'} onBack={onHome} />
                {newestFirst.length === 0 ? (
                  <p className={styles.empty}>받은 알림이 없어요</p>
                ) : (
                  <ul className={`${styles.card} ${styles.notices}`}>
                    {newestFirst.map((notice) => (
                      <li key={notice.id} className={styles.notice}>
                        <span className={styles.noticeIcon} aria-hidden="true">
                          <BellIcon />
                        </span>
                        <span className={styles.noticeText}>
                          <span>{notice.body}</span>
                          <time className={styles.noticeTime}>
                            {formatDayTime(today, notice.date, notice.time)}
                          </time>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <nav className={styles.tabs} aria-label="은행 앱 메뉴">
            <button
              type="button"
              className={styles.tab}
              aria-current={tab === 'accounts' ? 'page' : undefined}
              onClick={() => setTab('accounts')}
            >
              <HomeIcon />내 계좌
            </button>
            <button
              type="button"
              className={styles.tab}
              aria-current={tab === 'notices' ? 'page' : undefined}
              onClick={() => setTab('notices')}
            >
              <span className={styles.bell}>
                <BellIcon />
                {hasUnread && tab !== 'notices' && <i role="img" aria-label="새 알림" />}
              </span>
              알림
            </button>
          </nav>
        </div>
      </PhoneScreen>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11l8-6.5 8 6.5v8.5h-5.5v-5h-5v5H4z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className={styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}
