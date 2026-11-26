import { sandboxPages } from './pages'
import styles from './SandboxLinks.module.css'

/**
 * 테스트 페이지로 가는 버튼 목록. 타이틀 화면과 `?sandbox` 목록에서 쓴다(개발 서버 전용).
 * label이 있으면 버튼 위에 작은 설명으로 보여 준다.
 */
export default function SandboxLinks({ label }: { label?: string }) {
  return (
    <nav aria-label="테스트 페이지" className={styles.root}>
      {label && <p className={styles.label}>{label}</p>}
      <ul className={styles.list}>
        {[...sandboxPages.keys()].map((name) => (
          <li key={name}>
            <a className={styles.link} href={`?sandbox=${encodeURIComponent(name)}`}>
              {name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
