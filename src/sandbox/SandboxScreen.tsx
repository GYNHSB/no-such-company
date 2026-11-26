import SandboxLinks from './SandboxLinks'
import { sandboxPages } from './pages'
import styles from './SandboxScreen.module.css'

// 페이지 사이는 링크(전체 새로고침)로 이동하므로 주소는 불러올 때 한 번만 읽는다.
const name = new URLSearchParams(window.location.search).get('sandbox') ?? ''
const Page = sandboxPages.get(name)

/** `?sandbox=이름`이면 그 테스트 페이지를, 이름이 없거나 틀리면 목록을 보여 준다(src/app/App.tsx). */
export default function SandboxScreen() {
  if (Page) return <Page />

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>테스트 페이지</h1>
      {name && <p>{name} 페이지가 없어요.</p>}
      <SandboxLinks />
    </main>
  )
}
