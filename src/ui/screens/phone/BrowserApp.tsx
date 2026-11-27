import { type ReactNode, useState } from 'react'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './BrowserApp.module.css'

/** 브라우저로 열 수 있는 사이트 하나 */
export interface BrowserSite {
  id: string
  /** 사이트 이름. 바로 가기와 검색 결과에 보인다 */
  title: string
  /** 주소창에 보이는 주소 */
  address: string
  /** 검색 결과에서 제목 아래에 보이는 설명 */
  description: string
  /** 사이트를 열었을 때 그릴 페이지 */
  content: ReactNode
}

interface Props {
  /** 지금 시각 "10:06". 상태 표시줄에 쓴다 */
  time: string
  /** 첫 화면으로 쓰는 검색 사이트의 이름과 주소(가상 이름) */
  search: { name: string; address: string }
  /** 열 수 있는 사이트. 첫 화면의 바로 가기에 보이고, 이름으로 검색하면 결과에 나온다 */
  sites: BrowserSite[]
  /** 검색했을 때. 검색어는 화면 안에서만 쓰고 인터넷으로 보내지 않는다 */
  onSearch?: (query: string) => void
  /** 사이트를 열었을 때 */
  onOpenSite?: (id: string) => void
  /** 첫 화면의 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

type View = { kind: 'start' } | { kind: 'results'; query: string } | { kind: 'site'; id: string }

function Line({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className ?? styles.line} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const SEARCH = 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM15.5 15.5L20 20'
const LOCK = 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z'

/**
 * 휴대폰 브라우저. 첫 화면은 가상의 검색 사이트(가운데 이름, 둥근 검색창, 바로 가기)이고,
 * 바로 가기나 검색 결과에서 사이트를 연다. 눌리지 않는 꾸밈은 두지 않는다.
 * 웹 화면이라서 휴대폰 색이 아니라 웹 화면 색을 쓰는 밝은 화면이다.
 * 실제 검색 서비스의 이름, 로고, 고유 색은 쓰지 않는다.
 */
export function BrowserApp({ time, search, sites, onSearch, onOpenSite, onHome }: Props) {
  const [view, setView] = useState<View>({ kind: 'start' })
  /** 사이트에서 뒤로 갈 곳 */
  const [from, setFrom] = useState<View>({ kind: 'start' })
  const [typed, setTyped] = useState('')

  const run = (text: string) => {
    const query = text.trim()
    if (!query) return
    setTyped(query)
    setView({ kind: 'results', query })
    onSearch?.(query)
  }
  const open = (id: string) => {
    setFrom(view)
    setView({ kind: 'site', id })
    onOpenSite?.(id)
  }
  const toStart = () => {
    setTyped('')
    setView({ kind: 'start' })
  }

  /** 검색 사이트 이름. 마지막 글자만 둘째 색으로 칠한다 */
  const logo = (
    <>
      {search.name.slice(0, -1)}
      <span>{search.name.slice(-1)}</span>
    </>
  )

  const form = (
    <form
      className={styles.form}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        run(typed)
      }}
    >
      <button type="submit" className={styles.submit} aria-label="검색">
        <Line d={SEARCH} />
      </button>
      <input
        className={styles.input}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="검색어를 입력하세요"
        aria-label="검색어"
        enterKeyHint="search"
      />
    </form>
  )

  const site = view.kind === 'site' ? sites.find((s) => s.id === view.id) : undefined
  let address = search.address
  let page: ReactNode

  if (site) {
    address = site.address
    page = site.content
  } else if (view.kind === 'results') {
    const { query } = view
    const found = sites.filter((s) => s.title.includes(query) || query.includes(s.title))
    address = `${search.address}/search?q=${query}`
    page = (
      <div className={styles.results}>
        <header className={styles.resultsHead}>
          <button
            type="button"
            className={styles.logoSmall}
            onClick={toStart}
            aria-label={`${search.name} 첫 화면`}
          >
            {logo}
          </button>
          {form}
        </header>
        <p className={styles.count}>검색 결과 약 {found.length}개</p>
        {found.length === 0 ? (
          <section className={styles.emptyBox}>
            <p className={styles.empty}>
              <strong>‘{query}’</strong>에 대한 검색 결과가 없습니다.
            </p>
            <ul className={styles.tips}>
              <li>단어의 철자가 정확한지 확인해 보세요.</li>
              <li>다른 검색어를 입력해 보세요.</li>
            </ul>
          </section>
        ) : (
          <ul className={styles.hits}>
            {found.map((s) => (
              <li key={s.id}>
                <button type="button" className={styles.hit} onClick={() => open(s.id)}>
                  <span className={styles.hitSite}>
                    <span className={styles.favicon} aria-hidden="true">
                      {s.title[0]}
                    </span>
                    <span className={styles.hitAddress}>{s.address}</span>
                  </span>
                  <span className={styles.hitTitle}>{s.title}</span>
                  <span className={styles.hitText}>{s.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  } else {
    page = (
      <div className={styles.start}>
        <h1 className={styles.logo}>{logo}</h1>
        {form}
        {sites.length > 0 && (
          <ul className={styles.shortcuts} aria-label="바로 가기">
            {sites.map((s) => (
              <li key={s.id}>
                <button type="button" className={styles.shortcut} onClick={() => open(s.id)}>
                  <span className={styles.shortcutIcon} aria-hidden="true">
                    {s.title[0]}
                  </span>
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  /** 아래 줄 왼쪽 단추: 첫 화면에서는 홈 화면으로, 그 밖에는 앞 화면으로 */
  const back =
    view.kind === 'start'
      ? onHome && { label: '홈', onClick: onHome }
      : {
          label: '뒤로',
          onClick: view.kind === 'site' ? () => setView(from) : toStart,
        }

  return (
    <div className={styles.theme}>
      <PhoneScreen time={time} onHome={onHome}>
        <div className={styles.browser}>
          <div className={styles.page}>{page}</div>
          {/* 브라우저 아래 줄: 뒤로 가는 단추와 주소창 */}
          <footer className={styles.bar}>
            {back && (
              <button type="button" className={styles.back} onClick={back.onClick}>
                <svg viewBox="0 0 12 20" aria-hidden="true">
                  <path d="M10 2L2 10l8 8" />
                </svg>
                {back.label}
              </button>
            )}
            <p className={styles.address}>
              <Line d={LOCK} className={styles.lock} />
              <span>{address}</span>
            </p>
          </footer>
        </div>
      </PhoneScreen>
    </div>
  )
}
