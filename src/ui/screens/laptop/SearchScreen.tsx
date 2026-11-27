import { useState, type FormEvent } from 'react'
import { Browser } from './Browser'
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
      url={page.kind === 'home' ? 'chajabom.example' : 'chajabom.example/search'}
      screen="search"
      onClose={onClose}
      onBack={onBack}
      onForward={onForward}
    >
      {page.kind === 'home' ? (
        <main className={styles.home}>
          <span className={styles.logoLarge}>찾아봄</span>
          {form}
        </main>
      ) : (
        <>
          <header className={styles.top}>
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
          </header>
          <main className={styles.results}>
            <p className={styles.count}>검색 결과 0건</p>
            <p className={styles.empty}>
              <strong>‘{page.query}’</strong>에 대한 검색 결과가 없습니다.
            </p>
            <ul className={styles.tips}>
              <li>단어의 철자가 정확한지 확인해 보세요.</li>
              <li>다른 검색어를 입력해 보세요.</li>
            </ul>
          </main>
        </>
      )}
    </Browser>
  )
}
