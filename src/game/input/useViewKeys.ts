import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { PHONE_KEY } from './controls'

/**
 * 보는 것을 바꾸는 키. 방에서는(서 있든 앉아 있든) 휴대폰 꺼내기 키로 집어 둔 휴대폰을 열고,
 * 다른 것을 보는 중에는 Esc로 닫는다. 앉아서 보던 것을 닫으면 앉은 자리로, 그 밖에는 방으로 돌아온다.
 */
export function useViewKeys() {
  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.repeat) return
      const { view, hasPhone, openView, closeView } = useGameStore.getState()
      const around = view === 'room' || view === 'seat'
      if (around && hasPhone && e.code === PHONE_KEY.code) openView('phone')
      else if (view !== 'room' && e.code === 'Escape') closeView()
    }
    window.addEventListener('keydown', press)
    return () => window.removeEventListener('keydown', press)
  }, [])
}
