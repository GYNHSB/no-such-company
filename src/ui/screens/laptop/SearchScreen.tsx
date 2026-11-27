import { useState, type FormEvent } from 'react'
import { Browser } from './Browser'
import { Icon } from './icons'
import { usePageHistory } from './pageHistory'
import styles from './SearchScreen.module.css'

interface Props {
  /** 검색했을 때. 앞뒤 공백을 뺀 검색어를 넘긴다. 경계심 계산은 엔진이 한다 */
  onSearch?: (query: string) => void
  /** 탭을 닫았을 때 (`btn_search_close`) */
  onClose?: () => void
}

/** 첫 화면(home) 또는 검색어별 결과 페이지 */
type Page = { kind: 'home' } | { kind: 'results'; query: string }
const HOME: Page = { kind: 'home' }

// 결과 페이지의 갈래 탭과 첫 화면의 바로가기는 장식. 누를 수 없다
const VERTICALS = ['통합', '이미지', '동영상', '뉴스', '지도', '쇼핑']
const SHORTCUTS = ['날씨', '뉴스', '지도', '번역', '메일', '사전']

/**
 * 2일차 장면 5. 가상의 검색 사이트. 무엇을 검색해도 결과가 없다.
 * 검색어는 화면 안에서만 쓰고 인터넷으로 보내지 않는다.
 */
export function SearchScreen({ onSearch, onClose }: Props) {
  const [draft, setDraft] = useState('')
  const { page, go, onBack, onForward } = usePageHistory<Page>(HOME)

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = draft.trim()
    if (!q) return
    go({ kind: 'results', query: q })
    onSearch?.(q)
  }

  const form = (
    <form className={page.kind === 'home' ? styles.homeForm : styles.barForm} onSubmit={submit}>
      <span className={styles.lens}>
        <Icon name="search" size={20} />
      </span>
      <input
        id="input_search_query"
        className={styles.input}
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="검색어를 입력하세요"
        aria-label="검색어"
        autoComplete="off"
      />
      <button id="btn_search_submit" className={styles.submit} type="submit">
        검색
      </button>
    </form>
  )

  return (
    <Browser
      title={page.kind === 'home' ? '찾아봄' : `${page.query} - 찾아봄 검색`}
      url={page.kind === 'home' ? 'chajabom.example' : `chajabom.example/search?q=${page.query}`}
      favicon="찾"
      screen="search"
      onClose={onClose}
      onBack={onBack}
      onForward={onForward}
    >
      {page.kind === 'home' ? (
        <div className={styles.homePage}>
          <div className={styles.homeTop} aria-hidden="true">
            <span>메일</span>
            <span>이미지</span>
            <span className={styles.login}>로그인</span>
          </div>
          <main className={styles.home}>
            <span className={styles.logoLarge}>찾아봄</span>
            {form}
            <ul className={styles.shortcuts} aria-hidden="true">
              {SHORTCUTS.map((s) => (
                <li key={s} className={styles.shortcut}>
                  <span className={styles.shortcutIcon}>{s[0]}</span>
                  {s}
                </li>
              ))}
            </ul>
          </main>
          <footer className={styles.footer}>
            <span>찾아봄 소개 · 광고 · 비즈니스 · 개인정보 처리방침 · 약관</span>
            <span>이 사이트는 게임 속 가상 서비스입니다.</span>
          </footer>
        </div>
      ) : (
        <div className={styles.resultsPage}>
          <header className={styles.top}>
            <div className={styles.topRow}>
              <button
                id="btn_search_home"
                type="button"
                className={styles.logo}
                aria-label="찾아봄 첫 화면"
                onClick={() => go(HOME)}
              >
                찾아봄
              </button>
              {form}
            </div>
            <nav className={styles.verticals} aria-hidden="true">
              {VERTICALS.map((v, i) => (
                <span key={v} className={i === 0 ? styles.verticalOn : styles.vertical}>
                  {v}
                </span>
              ))}
            </nav>
          </header>
          <main className={styles.results}>
            <p className={styles.count}>검색 결과 약 0개 (0.31초)</p>
            <section className={styles.emptyBox}>
              <p className={styles.empty}>
                <strong>‘{page.query}’</strong>에 대한 검색 결과가 없습니다.
              </p>
              <ul className={styles.tips}>
                <li>단어의 철자가 정확한지 확인해 보세요.</li>
                <li>다른 검색어를 입력해 보세요.</li>
                <li>더 일반적인 검색어로 다시 검색해 보세요.</li>
              </ul>
            </section>
          </main>
        </div>
      )}
    </Browser>
  )
}
