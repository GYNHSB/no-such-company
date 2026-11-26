import { useCallback, useRef, useState } from 'react'

/** 독백 한 줄. 같은 문장을 두 번 말해도 서로 다른 줄로 다루도록 번호를 붙인다. */
export interface MonologueLine {
  id: number
  text: string
}

/** 독백 줄을 차례로 쌓아 두고 하나씩 꺼낸다. 이미 보이는 줄이 있으면 뒤에서 기다린다. */
export function useMonologue() {
  const [queue, setQueue] = useState<MonologueLine[]>([])
  const count = useRef(0)
  const say = useCallback((...texts: string[]) => {
    const lines = texts.map((text) => ({ id: count.current++, text }))
    setQueue((q) => [...q, ...lines])
  }, [])
  const next = useCallback(() => setQueue((q) => q.slice(1)), [])
  return { line: queue[0] ?? null, say, next }
}
