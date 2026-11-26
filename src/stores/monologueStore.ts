import { create } from 'zustand'

/** 독백 한 줄. 같은 문장을 두 번 말해도 서로 다른 줄로 다루도록 번호를 붙인다. */
export interface MonologueLine {
  id: number
  text: string
}

interface MonologueState {
  /** 말할 줄을 차례로 쌓아 둔다. 맨 앞이 지금 보이는 줄이다. */
  queue: MonologueLine[]
  /** 줄을 뒤에 쌓는다. 이미 보이는 줄이 있으면 뒤에서 기다린다. */
  say: (...texts: string[]) => void
  /** 지금 줄을 치우고 다음 줄로 넘긴다 */
  next: () => void
}

let count = 0

export const useMonologueStore = create<MonologueState>()((set) => ({
  queue: [],
  say: (...texts) =>
    set((state) => ({ queue: [...state.queue, ...texts.map((text) => ({ id: count++, text }))] })),
  next: () => set((state) => ({ queue: state.queue.slice(1) })),
}))
