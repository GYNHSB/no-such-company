import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { PHONE_KEY } from './controls'

/**
 * 보는 것을 바꾸는 키. 방에서는(서 있든 앉아 있든) 휴대폰 꺼내기 키로 집어 둔 휴대폰을 열고,
 * 다른 것을 보는 중에는 Esc로 닫는다. 앉아서 보던 것을 닫으면 앉은 자리로, 그 밖에는 방으로 돌아온다.
 * 노트북을 보는 중에는 노트북 화면 밖(뒤에 보이는 방)을 클릭해도 Esc처럼 닫힌다.
 * 휴대폰의 뒤 배경을 클릭해 닫는 것은 휴대폰 화면(PhoneView)이 맡는다.
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
    // 노트북 화면은 3D 화면 위에 따로 얹혀 있어서, 3D 화면이 클릭을 받았다면 노트북 화면 밖을 누른 것이다.
    // 노트북을 여는 그 클릭으로 바로 닫히지 않게, 누르기 시작할 때 이미 노트북을 보고 있었는지 적어 둔다.
    let downInLaptop = false
    const onCanvas = (e: Event) =>
      e.target instanceof HTMLCanvasElement && e.target.closest('.game-canvas') !== null
    const down = (e: PointerEvent) => {
      downInLaptop = onCanvas(e) && useGameStore.getState().view === 'laptop'
    }
    const click = (e: MouseEvent) => {
      const { view, closeView } = useGameStore.getState()
      if (downInLaptop && onCanvas(e) && view === 'laptop') closeView()
      downInLaptop = false
    }
    window.addEventListener('keydown', press)
    document.addEventListener('pointerdown', down)
    document.addEventListener('click', click)
    return () => {
      window.removeEventListener('keydown', press)
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('click', click)
    }
  }, [])
}
