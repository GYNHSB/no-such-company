import { lazy, type ComponentType } from 'react'
import styles from './SandboxScreen.module.css'

/**
 * 팀원별 테스트 페이지. 개발 서버에서만 연다(src/app/App.tsx).
 * - `?sandbox`는 목록, `?sandbox=이내`는 src/sandbox/pages/이내.tsx를 연다.
 * - pages/에 파일을 추가하면 목록에 자동으로 나온다. 페이지마다 청크가 따로 나뉘어 열 때만 불러온다.
 */
const loaders = import.meta.glob<{ default: ComponentType }>('./pages/*.tsx')

// macOS에서 만든 한글 파일 이름은 자모가 나뉜 형태(NFD)일 수 있어, URL 값과 비교하기 전에 NFC로 맞춘다.
const toName = (path: string) => path.slice('./pages/'.length, -'.tsx'.length).normalize('NFC')

const pages = new Map(
  Object.entries(loaders)
    .map(([path, load]) => [toName(path), lazy(load)] as const)
    .sort(([a], [b]) => a.localeCompare(b, 'ko')),
)

// 페이지 사이는 링크(전체 새로고침)로 이동하므로 주소는 불러올 때 한 번만 읽는다.
const name = (new URLSearchParams(window.location.search).get('sandbox') ?? '').normalize('NFC')
const Page = pages.get(name)

export default function SandboxScreen() {
  if (Page) return <Page />

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>테스트 페이지</h1>
      {name && <p>{name} 페이지가 없어요.</p>}
      <ul className={styles.list}>
        {[...pages.keys()].map((pageName) => (
          <li key={pageName}>
            <a href={`?sandbox=${encodeURIComponent(pageName)}`}>{pageName}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
