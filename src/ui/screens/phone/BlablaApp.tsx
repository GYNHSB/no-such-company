import { type ReactNode, useState } from 'react'
import { PhoneNav } from '@/ui/kit/phone/PhoneNav'
import { PhoneScreen } from '@/ui/kit/phone/PhoneScreen'
import styles from './BlablaApp.module.css'

/** 게시글 하나 */
export interface BlablaPost {
  id: string
  /** 글이 올라온 토픽. "취업·이직" */
  topic: string
  title: string
  /** 글쓴이가 다니는 회사. 글쓴이 이름 대신 이것과 가린 별명만 보인다 */
  company: string
  /** 올린 때. "3주 전" */
  ago: string
  body: string
  views?: number
  likes?: number
  comments?: number
  /** 첫 화면의 "실시간 인기 글"에 보일 글 */
  hot?: boolean
}

interface Props {
  /** 지금 시각 "20:40". 상태 표시줄에 쓴다 */
  time: string
  /** 앱 이름(가상 이름) */
  app: string
  /** 내가 다니는 회사. 이 회사의 게시판을 볼 수 있다 */
  myCompany: string
  /** 올라와 있는 글 전부. 새 글이 앞에 온다 */
  posts: BlablaPost[]
  /** 검색창 아래에 미리 보여 줄 검색어. 누르면 그 말로 검색한다 */
  suggestions?: string[]
  /** 검색했을 때 */
  onSearch?: (query: string) => void
  /** 글 본문을 열었을 때. 읽은 글로 무엇을 할지는 받는 쪽이 정한다 */
  onRead?: (postId: string) => void
  /** 왼쪽 위 "홈"이나 아래 막대를 눌렀을 때. 홈 화면으로 돌아간다 */
  onHome?: () => void
}

type View =
  | { kind: 'home' }
  | { kind: 'results' }
  | { kind: 'company'; name: string }
  | { kind: 'post'; id: string }

/** 선으로 그린 그림들 */
const GLYPHS = {
  search: 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM15.5 15.5L20 20',
  bell: 'M6 9.5a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6M10 19a2 2 0 0 0 4 0',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 14.7a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z',
  like: 'M8 10.5l3.5-6c1.5 0 2.5 1 2.5 2.5V10h4.2c1 0 1.8.9 1.6 1.9l-1.1 6c-.2.9-.9 1.6-1.9 1.6H8zM4 10.5h4v9H4z',
  comment: 'M5 5.5h14v10.5H10l-5 4z',
  bookmark: 'M6.5 4.5h11V20L12 15.5 6.5 20z',
  home: 'M4 11l8-6.5 8 6.5v8.5h-5.5v-5h-5v5H4z',
  building: 'M5 20V5h9v15M14 10h5v10M3.5 20h17M8 8.5h3M8 12h3M8 15.5h3',
  write: 'M12 5.5v13M5.5 12h13',
  person: 'M12 12a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5 19.5a7 7 0 0 1 14 0',
} as const

function Glyph({ name, className }: { name: keyof typeof GLYPHS; className?: string }) {
  return (
    <svg className={className ?? styles.glyph} viewBox="0 0 24 24" aria-hidden="true">
      <path d={GLYPHS[name]} />
    </svg>
  )
}

/** 아래 탭. 모양만 있고 눌리지 않는다 */
const TABS: { icon: keyof typeof GLYPHS; label: string }[] = [
  { icon: 'home', label: '홈' },
  { icon: 'building', label: '회사' },
  { icon: 'write', label: '글쓰기' },
  { icon: 'bell', label: '알림' },
  { icon: 'person', label: '내 정보' },
]

/** 찾는 말이 든 자리를 표시해서 돌려준다 */
function marked(text: string, query: string): ReactNode {
  if (!query) return text
  const parts = text.split(query)
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<mark key={i}>{query}</mark>, part]))
}

const includes = (post: BlablaPost, query: string) =>
  post.title.includes(query) || post.body.includes(query) || post.company.includes(query)

const initialOf = (company: string) => company.replace('주식회사 ', '')[0]

/**
 * 휴대폰의 직장인 익명 게시판 앱. 글쓴이는 회사 이름과 가린 별명으로만 보인다.
 * 첫 화면에서 인기 글을 보고, 검색어로 글과 회사를 찾고, 회사 게시판과 글 본문을 본다.
 * 휴대폰 기본 앱이 아니라서 밝은 화면에 앱의 색(--blabla-*)을 쓴다. 실제 서비스의 로고, 이름, 고유 색은 쓰지 않는다.
 */
export function BlablaApp({
  time,
  app,
  myCompany,
  posts,
  suggestions = [],
  onSearch,
  onRead,
  onHome,
}: Props) {
  const [typed, setTyped] = useState('')
  /** 지금 검색 결과에 쓰인 말 */
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>({ kind: 'home' })
  /** 글이나 회사 게시판에서 뒤로 갈 곳 */
  const [from, setFrom] = useState<View>({ kind: 'home' })

  const companies = [...new Set([myCompany, ...posts.map((p) => p.company)])]
  const countOf = (company: string) => posts.filter((p) => p.company === company).length
  const search = (text: string) => {
    const next = text.trim()
    if (!next) return
    setTyped(next)
    setQuery(next)
    setView({ kind: 'results' })
    onSearch?.(next)
  }
  const openPost = (id: string) => {
    setFrom(view)
    setView({ kind: 'post', id })
    onRead?.(id)
  }
  const openCompany = (name: string) => {
    setFrom(view)
    setView({ kind: 'company', name })
  }
  const goHome = () => {
    setTyped('')
    setQuery('')
    setView({ kind: 'home' })
  }

  /** 조회, 좋아요, 댓글 수 */
  const counts = (post: BlablaPost) => (
    <span className={styles.counts}>
      <span>
        <Glyph name="eye" className={styles.small} />
        <span className={styles.srOnly}>조회 </span>
        {post.views ?? 0}
      </span>
      <span>
        <Glyph name="like" className={styles.small} />
        <span className={styles.srOnly}>좋아요 </span>
        {post.likes ?? 0}
      </span>
      <span>
        <Glyph name="comment" className={styles.small} />
        <span className={styles.srOnly}>댓글 </span>
        {post.comments ?? 0}
      </span>
    </span>
  )

  /** 글 목록의 한 줄: 토픽, 제목, 본문 두 줄, 회사와 올린 때, 수 */
  const row = (post: BlablaPost, highlight: string) => (
    <li key={post.id}>
      <button type="button" className={styles.row} onClick={() => openPost(post.id)}>
        <span className={styles.topic}>{post.topic}</span>
        <span className={styles.rowTitle}>{marked(post.title, highlight)}</span>
        <span className={styles.preview}>{marked(post.body, highlight)}</span>
        <span className={styles.foot}>
          <span className={styles.who}>
            <span className={styles.company}>{marked(post.company, highlight)}</span>
            <span>{post.ago}</span>
          </span>
          {counts(post)}
        </span>
      </button>
    </li>
  )

  const searchBox = (
    <form
      className={styles.search}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        search(typed)
      }}
    >
      <Glyph name="search" className={styles.searchGlyph} />
      <input
        className={styles.searchInput}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="관심 있는 내용을 검색해 보세요"
        aria-label="회사, 글 검색"
        enterKeyHint="search"
      />
    </form>
  )

  const companyRow = (name: string, highlight: string) => (
    <button type="button" className={styles.companyRow} onClick={() => openCompany(name)}>
      <span className={styles.logo} aria-hidden="true">
        {initialOf(name)}
      </span>
      <span className={styles.companyName}>{marked(name, highlight)}</span>
      <span className={styles.boardCount}>게시글 {countOf(name)}</span>
    </button>
  )

  let page: ReactNode
  if (view.kind === 'post') {
    const post = posts.find((p) => p.id === view.id)
    const back = from.kind === 'results' ? '검색 결과' : from.kind === 'company' ? from.name : app
    page = (
      <>
        <PhoneNav
          backLabel={back}
          onBack={() => setView(from)}
          right={<Glyph name="bookmark" className={styles.navIcon} />}
        />
        {post && (
          <article className={styles.post}>
            <p className={styles.topic}>{post.topic}</p>
            <h1 className={styles.postTitle}>{post.title}</h1>
            <p className={styles.byline}>
              <span className={styles.logo} aria-hidden="true">
                {initialOf(post.company)}
              </span>
              <span className={styles.bylineText}>
                <span className={styles.company}>{post.company}</span>
                <span className={styles.nick}>익명 · {post.ago}</span>
              </span>
            </p>
            <p className={styles.body}>{marked(post.body, from.kind === 'results' ? query : '')}</p>
            <div className={styles.postFoot}>{counts(post)}</div>
            {/* 댓글 입력란. 모양만 있고 쓸 수 없다 */}
            <p className={styles.reply} aria-hidden="true">
              댓글을 남겨 주세요
            </p>
          </article>
        )}
      </>
    )
  } else if (view.kind === 'company') {
    const board = posts.filter((p) => p.company === view.name)
    page = (
      <>
        <PhoneNav
          backLabel={from.kind === 'results' ? '검색 결과' : app}
          onBack={() => setView(from.kind === 'results' ? from : { kind: 'home' })}
        />
        <header className={styles.boardHead}>
          <span className={`${styles.logo} ${styles.logoBig}`} aria-hidden="true">
            {initialOf(view.name)}
          </span>
          <div>
            <h1 className={styles.boardName}>{view.name}</h1>
            <p className={styles.boardCount}>게시글 {board.length}</p>
          </div>
        </header>
        <h2 className={styles.heading}>회사 게시판</h2>
        {board.length === 0 ? (
          <p className={styles.empty}>
            <Glyph name="comment" className={styles.emptyGlyph} />
            아직 올라온 글이 없어요
          </p>
        ) : (
          <ul className={styles.list}>{board.map((p) => row(p, ''))}</ul>
        )}
      </>
    )
  } else if (view.kind === 'results') {
    const foundCompanies = companies.filter((c) => c.includes(query))
    const found = posts.filter((p) => includes(p, query))
    page = (
      <>
        <PhoneNav backLabel={app} onBack={goHome} />
        {searchBox}
        {foundCompanies.length > 0 && (
          <section aria-labelledby="blabla-companies">
            <h2 id="blabla-companies" className={styles.heading}>
              회사 <span>{foundCompanies.length}</span>
            </h2>
            <ul className={styles.list}>
              {foundCompanies.map((name) => (
                <li key={name}>{companyRow(name, query)}</li>
              ))}
            </ul>
          </section>
        )}
        <section aria-labelledby="blabla-posts">
          <h2 id="blabla-posts" className={styles.heading}>
            게시글 <span>{found.length}</span>
          </h2>
          {found.length === 0 ? (
            <p className={styles.empty}>
              <Glyph name="search" className={styles.emptyGlyph} />
              검색된 글이 없어요
            </p>
          ) : (
            <ul className={styles.list}>{found.map((p) => row(p, query))}</ul>
          )}
        </section>
      </>
    )
  } else {
    const hot = posts.filter((p) => p.hot)
    page = (
      <>
        <PhoneNav
          backLabel={onHome && '홈'}
          onBack={onHome}
          right={<Glyph name="bell" className={styles.navIcon} />}
        >
          <h1 className={styles.wordmark}>{app}</h1>
        </PhoneNav>
        {searchBox}
        {suggestions.length > 0 && (
          <ul className={styles.chips} aria-label="이렇게 찾아보세요">
            {suggestions.map((s) => (
              <li key={s}>
                <button type="button" className={styles.chip} onClick={() => search(s)}>
                  <Glyph name="search" className={styles.small} />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <section aria-labelledby="blabla-mine">
          <h2 id="blabla-mine" className={styles.heading}>
            내 회사
          </h2>
          <div className={styles.mine}>{companyRow(myCompany, '')}</div>
        </section>
        {hot.length > 0 && (
          <section aria-labelledby="blabla-hot">
            <h2 id="blabla-hot" className={styles.heading}>
              실시간 인기 글
            </h2>
            <ul className={styles.list}>{hot.map((p) => row(p, ''))}</ul>
          </section>
        )}
      </>
    )
  }

  return (
    <div className={styles.theme}>
      <PhoneScreen time={time} onHome={onHome}>
        <div className={styles.blabla}>
          <div className={styles.page}>{page}</div>
          <nav className={styles.tabs} aria-hidden="true">
            {TABS.map((tab, i) => (
              <span key={tab.label} className={i === 0 ? styles.tabOn : undefined}>
                <Glyph name={tab.icon} />
                {tab.label}
              </span>
            ))}
          </nav>
        </div>
      </PhoneScreen>
    </div>
  )
}
