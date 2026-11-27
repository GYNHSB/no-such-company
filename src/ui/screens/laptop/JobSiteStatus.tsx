import { useState } from 'react'
import { Browser } from './Browser'
import styles from './JobSiteStatus.module.css'
import { usePageHistory } from './pageHistory'

export interface Application {
  id: string
  company: string
  role: string
  /** 지원한 때. 게임 속 날짜와 겹치지 않게 "3일 전"처럼 쓴다 */
  appliedAt: string
}

export interface Posting {
  id: string
  company: string
  role: string
  place: string
  /** 마감 표시 ('D-3', '상시') */
  due: string
}

export interface PortfolioPage {
  no: number
  title: string
  kind: string
}

interface Props {
  /** 서류 탈락한 지원 건 전부. 처음에는 위에서 15건만 보이고 "더 보기"로 나머지를 연다 */
  applications: readonly Application[]
  /** 포트폴리오 조회 수 */
  portfolioViews: number
  /** 채용 공고 탭 */
  postings: readonly Posting[]
  /** 내 포트폴리오 탭 */
  portfolio: readonly PortfolioPage[]
  /** 탭을 닫았을 때 (`btn_jobsite_close`) */
  onClose?: () => void
}

type Page = 'jobs' | 'status' | 'portfolio'

const PAGES: { id: Page; label: string; path: string }[] = [
  { id: 'jobs', label: '채용 공고', path: 'jobs' },
  { id: 'status', label: '지원 현황', path: 'my/applications' },
  { id: 'portfolio', label: '내 포트폴리오', path: 'my/portfolio' },
]

const FIRST_ROWS = 15

/** 1일차 장면 2. 취업 사이트. 지원 현황(서류 탈락이 줄줄이)에서 시작하고, 채용 공고와 내 포트폴리오도 볼 수 있다 */
export function JobSiteStatus({
  applications,
  portfolioViews,
  postings,
  portfolio,
  onClose,
}: Props) {
  const { page, go, onBack, onForward } = usePageHistory<Page>('status')
  const current = PAGES.find((p) => p.id === page) ?? PAGES[1]

  return (
    <Browser
      title={`${current.label} | 구직로그`}
      url={`gujiklog.example/${current.path}`}
      screen="jobsite"
      onClose={onClose}
      onBack={onBack}
      onForward={onForward}
    >
      <header className={styles.site}>
        <span className={styles.logo}>구직로그</span>
        <nav className={styles.menu} aria-label="사이트 메뉴">
          {PAGES.map((p) => (
            <button
              key={p.id}
              id={`btn_jobsite_tab_${p.id}`}
              type="button"
              className={p.id === page ? `${styles.tab} ${styles.current}` : styles.tab}
              aria-current={p.id === page ? 'page' : undefined}
              onClick={() => go(p.id)}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.page}>
        {page === 'status' && (
          <StatusPage applications={applications} portfolioViews={portfolioViews} />
        )}
        {page === 'jobs' && <JobsPage postings={postings} />}
        {page === 'portfolio' && <PortfolioPageView pages={portfolio} views={portfolioViews} />}
      </main>
    </Browser>
  )
}

function StatusPage({
  applications,
  portfolioViews,
}: {
  applications: readonly Application[]
  portfolioViews: number
}) {
  const [all, setAll] = useState(false)
  const shown = all ? applications : applications.slice(0, FIRST_ROWS)
  const hidden = applications.length - shown.length

  return (
    <>
      <h1 className={styles.title}>지원 현황</h1>
      <section className={styles.summary} aria-label="요약">
        <Stat label="지원" value={applications.length} />
        <Stat label="진행 중" value={0} />
        <Stat label="서류 탈락" value={applications.length} tone="reject" />
        <Stat label="포트폴리오 조회 (최근 30일)" value={portfolioViews} />
      </section>
      <ul className={styles.list}>
        {shown.map((a) => (
          <li key={a.id} className={styles.row}>
            <span className={styles.company}>{a.company}</span>
            <span className={styles.role}>{a.role}</span>
            <span className={styles.date}>{a.appliedAt}</span>
            <span className={styles.badge}>서류 탈락</span>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              id="btn_jobsite_more"
              type="button"
              className={styles.more}
              onClick={() => setAll(true)}
            >
              서류 탈락 {hidden}건 더 보기
            </button>
          </li>
        )}
      </ul>
    </>
  )
}

function JobsPage({ postings }: { postings: readonly Posting[] }) {
  const [applied, setApplied] = useState<ReadonlySet<string>>(new Set())

  return (
    <>
      <h1 className={styles.title}>채용 공고</h1>
      <p className={styles.note}>디자인 · 서울/경기 · 최신순</p>
      <ul className={styles.list}>
        {postings.map((p) => {
          const done = applied.has(p.id)
          return (
            <li key={p.id} className={`${styles.row} ${styles.posting}`}>
              <span className={styles.company}>{p.company}</span>
              <span className={styles.role}>{p.role}</span>
              <span className={styles.date}>
                {p.place} · {p.due}
              </span>
              <button
                id={`btn_jobsite_apply_${p.id}`}
                type="button"
                className={done ? styles.applied : styles.apply}
                disabled={done}
                onClick={() => setApplied((s) => new Set(s).add(p.id))}
              >
                {done ? '지원 완료' : '지원하기'}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function PortfolioPageView({ pages, views }: { pages: readonly PortfolioPage[]; views: number }) {
  return (
    <>
      <h1 className={styles.title}>내 포트폴리오</h1>
      <section className={styles.summary} aria-label="포트폴리오 요약">
        <Stat label="장 수" value={pages.length} />
        <Stat label="조회 (최근 30일)" value={views} />
        <Stat label="공개 상태" text="전체 공개" />
        <Stat label="마지막 수정" text="2주 전" />
      </section>
      <ol className={styles.list}>
        {pages.map((p) => (
          <li key={p.no} className={`${styles.row} ${styles.portfolioRow}`}>
            <span className={styles.pageNo}>{p.no}</span>
            <span className={styles.company}>{p.title}</span>
            <span className={styles.role}>{p.kind}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

function Stat({
  label,
  value,
  text,
  tone,
}: {
  label: string
  value?: number
  text?: string
  tone?: 'reject'
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={tone === 'reject' ? `${styles.statValue} ${styles.reject}` : styles.statValue}
      >
        {value ?? text}
      </span>
    </div>
  )
}
