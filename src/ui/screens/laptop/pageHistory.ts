import { useState } from 'react'

/** 사이트 안에서 본 페이지들과 지금 보는 자리 */
export interface PageHistory<T> {
  pages: readonly T[]
  index: number
}

export function start<T>(page: T): PageHistory<T> {
  return { pages: [page], index: 0 }
}

/** 새 페이지로 간다. 지금 자리 뒤의 '앞으로' 기록은 버린다. 같은 페이지면 그대로 */
export function visit<T>(h: PageHistory<T>, page: T): PageHistory<T> {
  if (h.pages[h.index] === page) return h
  return { pages: [...h.pages.slice(0, h.index + 1), page], index: h.index + 1 }
}

export function back<T>(h: PageHistory<T>): PageHistory<T> {
  return h.index > 0 ? { ...h, index: h.index - 1 } : h
}

export function forward<T>(h: PageHistory<T>): PageHistory<T> {
  return h.index < h.pages.length - 1 ? { ...h, index: h.index + 1 } : h
}

/** 브라우저 뒤로·앞으로에 넘길 값. 갈 곳이 없으면 undefined라 버튼이 흐려진다 */
export function usePageHistory<T>(first: T) {
  const [h, setH] = useState(() => start(first))
  return {
    page: h.pages[h.index] as T,
    go: (page: T) => setH((cur) => visit(cur, page)),
    onBack: h.index > 0 ? () => setH(back) : undefined,
    onForward: h.index < h.pages.length - 1 ? () => setH(forward) : undefined,
  }
}
