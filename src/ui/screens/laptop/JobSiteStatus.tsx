import { useState } from 'react'
import { Browser } from './Browser'
import { Icon } from './icons'
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
  /** 경력 조건 ('신입', '경력 2년 이상') */
  career: string
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

const PAGES: { id: Page; label: string; title: string; path: string }[] = [
  { id: 'jobs', label: '채용', title: '채용 공고', path: 'jobs/design' },
  { id: 'status', label: '지원 현황', title: '지원 현황', path: 'status/applications' },
  { id: 'portfolio', label: '포트폴리오', title: '내 포트폴리오', path: 'profile/portfolio' },
]

const FIRST_ROWS = 15
const THUMBS = 6

/** 이름으로 정하는 썸네일 색. 같은 회사는 늘 같은 색 */
function thumb(name: string) {
  let n = 0
  for (const ch of name) n += ch.charCodeAt(0)
  return { background: `var(--web-thumb-${(n % THUMBS) + 1})` }
}

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
      title={`${current.title} | 구직로그`}
      url={`gujiklog.example/${current.path}`}
      favicon="구"
      screen="jobsite"
      onClose={onClose}
      onBack={onBack}
      onForward={onForward}
    >
      <header className={styles.site}>
        <div className={styles.siteInner}>
          <button
            id="btn_jobsite_home"
            type="button"
            className={styles.logo}
            onClick={() => go('jobs')}
          >
            <span className={styles.logoMark} aria-hidden="true">
              ㄱ
            </span>
            구직로그
          </button>
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
          {/* 오른쪽 아이콘은 장식. 누를 수 없다 */}
          <div className={styles.tools} aria-hidden="true">
            <Icon name="search" size={20} />
            <span className={styles.bell}>
              <Icon name="bell" size={20} />
            </span>
            <span className={styles.me}>나</span>
            <span className={styles.divider} />
            <span className={styles.biz}>기업 서비스</span>
          </div>
        </div>
      </header>

      <main className={styles.page}>
        {page === 'status' && (
          <StatusPage applications={applications} portfolioViews={portfolioViews} />
        )}
        {page === 'jobs' && <JobsPage postings={postings} />}
        {page === 'portfolio' && <PortfolioPageView pages={portfolio} views={portfolioViews} />}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>구직로그</span>
          <span>이용약관 · 개인정보 처리방침 · 고객센터 · 공지사항</span>
          <span>© 2026 구직로그. 이 사이트는 게임 속 가상 서비스입니다.</span>
        </div>
      </footer>
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
      <section className={styles.board} aria-label="단계별 지원 수">
        <Stat label="지원 완료" value={applications.length} />
        <Stat label="서류 통과" value={0} />
        <Stat label="최종 합격" value={0} />
        <Stat label="불합격" value={applications.length} tone="reject" />
        <Stat label="포트폴리오 조회 (최근 30일)" value={portfolioViews} />
      </section>

      <p className={styles.notice}>
        <Icon name="doc" size={16} />
        최근 30일 동안 내 포트폴리오를 열어 본 기업이 없어요.
      </p>

      <div className={styles.table} role="table" aria-label="지원 목록">
        <div className={`${styles.tr} ${styles.th}`} role="row">
          <span role="columnheader">회사</span>
          <span role="columnheader">포지션</span>
          <span role="columnheader">지원일</span>
          <span role="columnheader">진행 상태</span>
        </div>
        {shown.map((a) => (
          <div key={a.id} className={styles.tr} role="row">
            <span className={styles.company} role="cell">
              <span className={styles.companyLogo} style={thumb(a.company)} aria-hidden="true">
                {a.company[0]}
              </span>
              {a.company}
            </span>
            <span className={styles.role} role="cell">
              {a.role}
            </span>
            <span className={styles.date} role="cell">
              {a.appliedAt}
            </span>
            <span role="cell">
              <span className={styles.badge}>서류 탈락</span>
            </span>
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <button
          id="btn_jobsite_more"
          type="button"
          className={styles.more}
          onClick={() => setAll(true)}
        >
          서류 탈락 {hidden}건 더 보기
          <Icon name="down" size={16} />
        </button>
      )}
    </>
  )
}

type Sort = 'latest' | 'due'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'latest', label: '최신순' },
  { id: 'due', label: '마감임박순' },
]

/** 마감까지 남은 날. '상시'는 맨 뒤로 */
function dueDays(due: string) {
  const m = /^D-(\d+)$/.exec(due)
  return m ? Number(m[1]) : Infinity
}

// 추천 조건 칩은 장식. 누를 수 없다
const CHIPS = [
  '서울·경기',
  '신입 가능',
  '응답률 높은 기업',
  '재택 가능',
  '50인 이하',
  '연봉 정보 공개',
]

function toggled(set: ReadonlySet<string>, id: string) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function JobsPage({ postings }: { postings: readonly Posting[] }) {
  const [applied, setApplied] = useState<ReadonlySet<string>>(new Set())
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set())
  const [sort, setSort] = useState<Sort>('latest')
  const list =
    sort === 'latest' ? postings : [...postings].sort((a, b) => dueDays(a.due) - dueDays(b.due))

  return (
    <>
      <div className={styles.filterHead}>
        <span className={styles.select}>
          디자인 전체 <Icon name="down" size={18} />
        </span>
        <span className={styles.select}>
          신입 <Icon name="down" size={18} />
        </span>
        <div className={styles.sort} role="group" aria-label="정렬">
          {SORTS.map((s) => (
            <button
              key={s.id}
              id={`btn_jobsite_sort_${s.id}`}
              type="button"
              className={
                sort === s.id ? `${styles.sortButton} ${styles.sortOn}` : styles.sortButton
              }
              aria-pressed={sort === s.id}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ul className={styles.chips} aria-label="추천 조건">
        {CHIPS.map((c) => (
          <li key={c} className={styles.chip}>
            {c}
          </li>
        ))}
      </ul>

      <ul className={styles.grid}>
        {list.map((p) => {
          const done = applied.has(p.id)
          const isSaved = saved.has(p.id)
          return (
            <li key={p.id} className={styles.card}>
              <div className={styles.thumb} style={thumb(p.company)}>
                <span className={styles.due}>{p.due}</span>
                <button
                  id={`btn_jobsite_bookmark_${p.id}`}
                  type="button"
                  className={isSaved ? `${styles.mark} ${styles.marked}` : styles.mark}
                  aria-label="북마크"
                  aria-pressed={isSaved}
                  onClick={() => setSaved((s) => toggled(s, p.id))}
                >
                  <Icon name="bookmark" size={20} />
                </button>
                <span className={styles.thumbName}>{p.company}</span>
              </div>
              <strong className={styles.cardRole}>{p.role}</strong>
              <span className={styles.cardCompany}>{p.company}</span>
              <span className={styles.cardMeta}>
                {p.place} · {p.career}
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
    <div className={styles.profileLayout}>
      <aside className={styles.profile}>
        <span className={styles.avatar} aria-hidden="true" />
        <strong className={styles.profileName}>내 프로필</strong>
        <span className={styles.cardMeta}>그래픽 디자이너 · 신입</span>
        <dl className={styles.facts}>
          <dt>장 수</dt>
          <dd>{pages.length}</dd>
          <dt>조회 (최근 30일)</dt>
          <dd>{views}</dd>
          <dt>공개 상태</dt>
          <dd>전체 공개</dd>
          <dt>마지막 수정</dt>
          <dd>2주 전</dd>
        </dl>
      </aside>
      <section>
        <h1 className={styles.title}>내 포트폴리오</h1>
        <ol className={styles.pages}>
          {pages.map((p) => (
            <li key={p.no} className={styles.pageCard}>
              <div className={styles.pageThumb} style={thumb(p.title)}>
                {String(p.no).padStart(2, '0')}
              </div>
              <strong className={styles.cardRole}>{p.title}</strong>
              <span className={styles.cardMeta}>{p.kind}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'reject' }) {
  return (
    <div className={styles.stat}>
      <span
        className={tone === 'reject' ? `${styles.statValue} ${styles.reject}` : styles.statValue}
      >
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
