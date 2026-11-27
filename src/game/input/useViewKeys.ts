import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { PHONE_KEY } from './controls'

/**
 * 보는 것을 바꾸는 키. 방에서는 휴대폰 꺼내기 키로 집어 둔 휴대폰을 열고,
 * 노트북이나 휴대폰을 보는 중에는 Esc로 방으로 돌아온다.
 */
export function useViewKeys() {
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.repeat) return
      const { view, hasPhone, openView } = useGameStore.getState()
      if (view === 'room' && hasPhone && e.code === PHONE_KEY.code) openView('phone')
      else if (view !== 'room' && e.code === 'Escape') openView('room')
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [])
}
