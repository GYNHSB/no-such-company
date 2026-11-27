import { useState, type FormEvent } from 'react'
import { Browser } from './Browser'
import styles from './SearchScreen.module.css'

interface Props {
  /** 검색했을 때. 앞뒤 공백을 뺀 검색어를 넘긴다. 경계심 계산은 엔진이 한다 */
  onSearch?: (query: string) => void
  /** 탭을 닫았을 때 (`btn_search_close`) */
  onClose?: () => void
}

/**
 * 2일차 장면 5. 가상의 검색 사이트. 무엇을 검색해도 결과가 없다.
 * 검색어는 화면 안에서만 쓰고 인터넷으로 보내지 않는다.
 */
export function SearchScreen({ onSearch, onClose }: Props) {
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = draft.trim()
    if (!q) return
    setQuery(q)
    onSearch?.(q)
  }

  const form = (
    <form className={query === null ? styles.homeForm : styles.barForm} onSubmit={submit}>
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
      title={query === null ? '찾아봄' : `${query} - 찾아봄 검색`}
      url={query === null ? 'chajabom.example' : 'chajabom.example/search'}
      screen="search"
      onClose={onClose}
    >
      {query === null ? (
        <main className={styles.home}>
          <span className={styles.logoLarge}>찾아봄</span>
          {form}
        </main>
      ) : (
        <>
          <header className={styles.top}>
            <span className={styles.logo}>찾아봄</span>
            {form}
          </header>
          <main className={styles.results}>
            <p className={styles.count}>검색 결과 0건</p>
            <p className={styles.empty}>
              <strong>‘{query}’</strong>에 대한 검색 결과가 없습니다.
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
