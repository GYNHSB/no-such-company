import { useEffect, useState, type CSSProperties } from 'react'
import type { MonologueLine } from './useMonologue'

/**
 * 주인공의 독백을 화면 아래 반투명 창에 한 줄씩 보여 준다.
 * 나중에 공용(src/ui 등)으로 옮길 것을 생각해 페이지와 상관없는 것만 둔다.
 *
 * 쓰는 법:
 *   const monologue = useMonologue()
 *   monologue.say('휴대폰을 어디에 뒀지...')
 *   <Monologue line={monologue.line} onDone={monologue.next} />
 */

/** 글자가 하나씩 나오는 간격(ms) */
const TYPE_MS = 45
/** 다 나온 뒤 남아 있는 시간(ms). 짧은 줄도 최소 MIN_HOLD_MS는 보이고, 긴 줄은 글자 수만큼 더 보인다. */
const MIN_HOLD_MS = 2200
const HOLD_PER_CHAR_MS = 60
/** 사라지는 데 걸리는 시간(ms) */
const FADE_MS = 400

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
    <div role="status" style={{ ...box, opacity: leaving ? 0 : 1 }}>
      {/* 화면 낭독기는 한 글자씩이 아니라 문장 전체를 한 번 읽는다 */}
      <span style={hidden}>{line}</span>
      <span aria-hidden="true">
        {chars.slice(0, shown).join('')}
        {/* 아직 안 나온 글자도 자리는 잡아 두어 창 크기가 흔들리지 않게 한다 */}
        <span style={{ visibility: 'hidden' }}>{chars.slice(shown).join('')}</span>
      </span>
    </div>
  )
}

const box: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 96,
  transform: 'translateX(-50%)',
  boxSizing: 'border-box',
  width: 'max-content',
  maxWidth: 'min(640px, calc(100% - 32px))',
  padding: '14px 22px',
  borderRadius: 12,
  background: 'rgb(0 0 0 / 0.55)',
  backdropFilter: 'blur(4px)',
  color: '#fff',
  fontSize: 18,
  lineHeight: 1.5,
  textAlign: 'center',
  pointerEvents: 'none',
  transition: `opacity ${FADE_MS}ms`,
}

const hidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}
