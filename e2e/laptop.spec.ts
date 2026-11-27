import { expect, test, type Locator } from '@playwright/test'

// 노트북 화면 6개를 sandbox(inae)에서 대본 순서대로 넘기며 주요 버튼을 눌러 본다.
// 장면 진행기가 쓸 버튼 id가 바뀌면 여기서 깨진다.
// 화면은 3D 노트북 위(drei Html)에 얹혀 있어 마우스 좌표가 기울어지므로, 클릭은 요소에 직접 보낸다.
const press = (target: Locator) => target.dispatchEvent('click')

test.skip(({ isMobile }) => isMobile, '노트북 화면은 PC 화면만 확인한다')

test('노트북 화면을 대본 순서대로 넘기며 버튼을 누른다', async ({ page }) => {
  test.setTimeout(60_000)
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  const id = (name: string) => page.locator(`#${name}`)

  await page.goto('/?sandbox=inae')

  // 1일차: 취업 사이트. 지원 현황에서 시작해 서류 탈락이 줄줄이 보인다
  await expect(id('btn_jobsite_tab_status')).toHaveAttribute('aria-current', 'page', {
    timeout: 20_000,
  })
  await press(id('btn_jobsite_more'))
  await expect(page.getByText('서류 탈락', { exact: true })).toHaveCount(53)

  await press(id('btn_jobsite_tab_jobs'))
  await press(id('btn_jobsite_bookmark_p1'))
  await expect(id('btn_jobsite_bookmark_p1')).toHaveAttribute('aria-pressed', 'true')
  await press(id('btn_jobsite_sort_due'))
  await expect(page.locator('[id^="btn_jobsite_apply_"]').first()).toHaveId('btn_jobsite_apply_p6')
  await press(id('btn_jobsite_apply_p1'))
  await expect(id('btn_jobsite_apply_p1')).toHaveText('지원 완료')

  await press(id('btn_jobsite_tab_portfolio'))
  await expect(page.getByRole('heading', { name: '내 포트폴리오' })).toBeVisible()
  await press(id('btn_jobsite_back'))
  await expect(id('btn_jobsite_tab_jobs')).toHaveAttribute('aria-current', 'page')
  await press(id('btn_jobsite_close'))

  // 면접 앱 설치: 동의를 풀면 설치할 수 없다
  await press(id('check_interview_agree'))
  await expect(id('btn_interview_install')).toBeDisabled()
  await press(id('check_interview_agree'))
  await press(id('btn_interview_install'))
  await expect(id('btn_interview_join')).toBeVisible({ timeout: 10_000 })
  await press(id('btn_interview_join'))

  // 화상 면접이 끝나면(sandbox는 12초) 검색 화면으로 넘어간다
  await expect(id('input_search_query')).toBeVisible({ timeout: 20_000 })

  // 2일차: 무엇을 검색해도 결과가 없다
  await id('input_search_query').fill('세움파트너스')
  await press(id('btn_search_submit'))
  await expect(page.getByText('에 대한 검색 결과가 없습니다.')).toBeVisible()
  await press(id('btn_search_home'))
  await expect(page.getByText('찾아봄', { exact: true }).first()).toBeVisible()
  await press(id('btn_search_close'))

  // 5일차: 취임식에서 서명하면 서명란에 이름이 들어간다
  await expect(id('field_inauguration_signature')).toHaveText('(서명)')
  await page.getByRole('button', { name: '서명한다' }).click()
  await expect(id('field_inauguration_signature')).toHaveText('테스트')
  await page.getByRole('button', { name: '원격 초기화로' }).click()

  // 원격 초기화: 공유기 전원을 뽑으면 멈춘다
  await page.getByRole('button', { name: '공유기 전원 뽑기' }).click()
  await expect(page.getByText('네트워크 연결이 끊겨 초기화가 멈췄습니다')).toBeVisible()
  await page.getByRole('button', { name: '처음으로' }).click()
  await expect(id('btn_jobsite_tab_status')).toBeVisible()

  expect(errors).toEqual([])
})
