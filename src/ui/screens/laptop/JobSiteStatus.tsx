import { Browser } from './Browser'
import styles from './JobSiteStatus.module.css'

export interface Application {
  id: string
  company: string
  role: string
  /** 지원한 때. 게임 속 날짜와 겹치지 않게 "3일 전"처럼 쓴다 */
  appliedAt: string
}

interface Props {
  /** 목록에 보이는 지원 건. 모두 서류 탈락으로 보인다 */
  applications: readonly Application[]
  /** 전체 서류 탈락 수. 목록보다 많으면 나머지는 "외 N건"으로 줄인다 */
  rejectedTotal: number
  /** 포트폴리오 조회 수 */
  portfolioViews: number
  /** 탭을 닫았을 때 (`btn_jobsite_close`) */
  onClose?: () => void
}

/** 1일차 장면 2. 취업 사이트의 지원 현황. 서류 탈락이 줄줄이 이어진다 */
export function JobSiteStatus({ applications, rejectedTotal, portfolioViews, onClose }: Props) {
  const hidden = rejectedTotal - applications.length

  return (
    <Browser
      title="지원 현황 | 구직로그"
      url="gujiklog.example/my/applications"
      screen="jobsite"
      onClose={onClose}
    >
      <header className={styles.site}>
        <span className={styles.logo}>구직로그</span>
        <nav className={styles.menu} aria-label="사이트 메뉴">
          <span>채용 공고</span>
          <span className={styles.current}>지원 현황</span>
          <span>내 포트폴리오</span>
        </nav>
      </header>

      <main className={styles.page}>
        <h1 className={styles.title}>지원 현황</h1>

        <section className={styles.summary} aria-label="요약">
          <Stat label="지원" value={rejectedTotal} />
          <Stat label="진행 중" value={0} />
          <Stat label="서류 탈락" value={rejectedTotal} tone="reject" />
          <Stat label="포트폴리오 조회 (최근 30일)" value={portfolioViews} />
        </section>

        <ul className={styles.list}>
          {applications.map((a) => (
            <li key={a.id} className={styles.row}>
              <span className={styles.company}>{a.company}</span>
              <span className={styles.role}>{a.role}</span>
              <span className={styles.date}>{a.appliedAt}</span>
              <span className={styles.badge}>서류 탈락</span>
            </li>
          ))}
          {hidden > 0 && <li className={styles.more}>서류 탈락 {hidden}건 더 보기</li>}
        </ul>
      </main>
    </Browser>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'reject' }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={tone === 'reject' ? `${styles.statValue} ${styles.reject}` : styles.statValue}
      >
        {value}
      </span>
    </div>
  )
}
