/**
 * 노트북 브라우저에서 한 일의 신호 이름. 대본에서는 interact 트리거의 objectId로 쓴다.
 *
 *   trigger: { type: 'interact', objectId: laptopSignal.tab('mail'), after: 'd1_jobsite' }
 */
export const laptopSignal = {
  /**
   * 플레이어가 그 사이트의 탭을 앞으로 가져왔다. 탭을 눌렀든, 앞에 있던 다른 탭을 닫아서 드러났든,
   * 새 탭의 즐겨찾기로 열었든 같은 신호다. 대본이 띄운 것은 이 신호를 내지 않는다.
   */
  tab: (site: string) => `laptop_tab:${site}`,
  /** 플레이어가 노트북에서 눈을 뗐다(Esc를 누르거나 화면 밖을 눌러 노트북 보기를 닫았다) */
  leave: () => 'laptop_leave',
}
