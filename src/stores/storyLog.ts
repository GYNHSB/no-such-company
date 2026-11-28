import { create } from 'zustand'

/** 엔진에 알린 일 하나와 그 결과. 개발 모드의 "엔진 보기" 패널이 보여 준다 */
export interface StoryLogEntry {
  id: number
  /** 일어난 시각 "23:41:07" */
  at: string
  /** 무엇을 알렸는지. 예: "신호 phone_read:d1-sms-hr", "선택지 고름 agree" */
  what: string
  /** 그 결과 실행된 사건 id. 비어 있으면 받는 사건이 없었다 */
  fired: string[]
}

/** 남겨 두는 기록 수. 넘으면 오래된 것부터 버린다 */
const KEEP = 40

interface StoryLogState {
  /** 새 것이 앞에 온다 */
  entries: StoryLogEntry[]
  add: (what: string, fired: string[]) => void
  clear: () => void
}

let count = 0

/**
 * 엔진에 알린 일의 기록. 개발 모드에서만 쌓는다(storyStore가 import.meta.env.DEV일 때만 add를 부른다).
 * 게임 진행에는 쓰지 않는다. 눌렀는데 아무 일도 안 생길 때 신호가 갔는지, 받는 사건이 있었는지 가리는 데 쓴다.
 */
export const useStoryLog = create<StoryLogState>()((set) => ({
  entries: [],
  add: (what, fired) =>
    set((state) => ({
      entries: [
        { id: count++, at: new Date().toTimeString().slice(0, 8), what, fired },
        ...state.entries,
      ].slice(0, KEEP),
    })),
  clear: () => set({ entries: [] }),
}))
