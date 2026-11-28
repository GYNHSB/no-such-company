import type { DayScript } from '@/data/types'
import type { StoryState } from './story'

/**
 * 지금 플레이어가 막혔다면 보여 줄 힌트. 대본의 사건에 적힌 hint 가운데, 지금 일어날 수 있는
 * 사건(아직 실행되지 않았고, 앞선 사건이 끝난 것)의 것을 대본 순서대로 찾아 첫 번째를 돌려준다.
 * 플레이어가 무언가를 해야 일어나는 사건(interact)만 본다. 기다리면 일어나는 사건에는 힌트가 필요 없다.
 * 하루가 끝났거나, 그런 사건이 없거나, 힌트를 적지 않았으면 null이다.
 */
export function hintOf(state: StoryState, script: DayScript): string | null {
  if (state.dayOver) return null
  for (const event of script.events) {
    if (!event.hint || state.fired.includes(event.id)) continue
    const t = event.trigger
    if (t.type !== 'interact') continue
    if (t.after && !state.fired.includes(t.after)) continue
    return event.hint
  }
  return null
}
