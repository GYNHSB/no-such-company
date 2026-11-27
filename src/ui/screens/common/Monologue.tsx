import { useEffect, useRef, useState } from 'react'
import type { MonologueLine } from '@/stores/monologueStore'
import styles from './Monologue.module.css'

/**
 * 주인공의 독백을 화면 아래 반투명 창에 한 줄씩 보여 준다.
 * 스페이스를 누르거나 창을 누르면 줄을 끝까지 보여 주고, 다 보였으면 다음 줄로 넘긴다.
 *
 * 쓰는 법:
 *   useMonologueStore.getState().say('휴대폰을 어디에 뒀지...')
 *   const line = useMonologueStore((s) => s.queue[0] ?? null)
 *   <Monologue line={line} onDone={useMonologueStore.getState().next} />
 */

/** 글자가 하나씩 나오는 간격(ms) */
const TYPE_MS = 45
/** 다 나온 뒤 남아 있는 시간(ms). 짧은 줄도 최소 MIN_HOLD_MS는 보이고, 긴 줄은 글자 수만큼 더 보인다. */
const MIN_HOLD_MS = 2200
const HOLD_PER_CHAR_MS = 60
/** 사라지는 데 걸리는 시간(ms). Monologue.module.css의 transition과 같아야 한다 */
const FADE_MS = 400
/** 줄을 넘기는 키. 글을 쓰는 칸이나 버튼에서 누른 것은 넘기지 않는다 */
const SKIP_KEY = { code: 'Space', label: 'Space' }
const IGNORE = 'input, textarea, button, select, [contenteditable]'

interface MonologueProps {
  /** 지금 보여 줄 줄. null이면 창을 감춘다. */
  line: MonologueLine | null
  /** 줄이 다 보이고 사라진 뒤 부른다. 다음 줄로 넘길 때 쓴다. */
  onDone: () => void
}

export function Monologue({ line, onDone }: MonologueProps) {
  // 줄이 바뀔 때마다 새로 그려서 글자가 처음부터 다시 나오게 한다
  return line === null ? null : <Typed key={line.id} line={line.text} onDone={onDone} />
}

function Typed({ line, onDone }: { line: string; onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const chars = Array.from(line) // 이모지 같은 글자가 반쪽으로 잘리지 않게 글자 단위로 나눈다
  const typing = shown < chars.length

  const skip = () => (typing ? setShown(chars.length) : setLeaving(true))
  const skipRef = useRef(skip)
  useEffect(() => {
    skipRef.current = skip
  })
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.code !== SKIP_KEY.code || e.repeat) return
      if (e.target instanceof Element && e.target.closest(IGNORE)) return
      e.preventDefault()
      skipRef.current()
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [])

  useEffect(() => {
    if (shown < chars.length) {
      const id = setTimeout(() => setShown((n) => n + 1), TYPE_MS)
      return () => clearTimeout(id)
    }
    if (!leaving) {
      const id = setTimeout(
        () => setLeaving(true),
        Math.max(MIN_HOLD_MS, chars.length * HOLD_PER_CHAR_MS),
      )
      return () => clearTimeout(id)
    }
    const id = setTimeout(onDone, FADE_MS)
    return () => clearTimeout(id)
  }, [shown, leaving, chars.length, onDone])

  return (
    <div
      role="status"
      className={styles.box}
      style={{ opacity: leaving ? 0 : 1 }}
      onClick={(e) => {
        e.stopPropagation()
        skip()
      }}
    >
      {/* 화면 낭독기는 한 글자씩이 아니라 문장 전체를 한 번 읽는다 */}
      <span className={styles.srOnly}>{line}</span>
      <span aria-hidden="true">
        {chars.slice(0, shown).join('')}
        {/* 아직 안 나온 글자도 자리는 잡아 두어 창 크기가 흔들리지 않게 한다 */}
        <span style={{ visibility: 'hidden' }}>{chars.slice(shown).join('')}</span>
      </span>
      <kbd className={styles.key} aria-hidden="true">
        {SKIP_KEY.label}
      </kbd>
    </div>
  )
}
