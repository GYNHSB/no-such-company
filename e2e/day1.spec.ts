import { expect, test, type Locator, type Page } from '@playwright/test'

// 3D 화면 속 UI(drei Html)는 화면 밖으로 그려질 수 있어서 클릭 이벤트를 직접 보낸다
const press = (target: Locator) => target.dispatchEvent('click')

/** 방을 걸어 물건을 누르는 대신, 앱이 쓰는 gameStore로 보는 것을 바꾼다 */
async function look(page: Page, view: 'room' | 'laptop' | 'phone') {
  await page.evaluate(async (v) => {
    const url = performance
      .getEntriesByType('resource')
      .map((r) => r.name)
      .find((n) => n.includes('/src/stores/gameStore'))
    const { useGameStore } = await import(/* @vite-ignore */ url!)
    useGameStore.getState().openView(v)
  }, view)
}

// 혼잣말은 한 줄에 몇 초씩 걸려 뒤로 밀린다. 첫 줄만 확인하고 나머지는 안내 문구로 확인한다
const say = (page: Page, text: string) =>
  expect(page.getByRole('status').filter({ hasText: text })).toBeAttached({ timeout: 20_000 })

test('1일차를 처음부터 끝까지 플레이한다', async ({ page, isMobile }) => {
  test.skip(isMobile, '본편은 PC 브라우저 전용')
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await expect(page.getByText('클릭하면 건너뛰어요')).toBeAttached()
  await page.keyboard.press('Space')
  await page.getByLabel('이름을 입력해 주세요.').fill('한결')
  await page.getByRole('button', { name: '시작하기' }).click()

  // 장면 1: 날짜 카드 뒤 혼잣말과 안내
  await say(page, '나는 한결.')
  // 스페이스: 한 번은 줄을 끝까지, 한 번 더는 다음 줄로
  await page.keyboard.press('Space')
  await page.keyboard.press('Space')
  await say(page, '서른 살. 취업 준비 6년 차.')
  await expect(page.getByText('책상 위 노트북을 확인하세요.')).toBeVisible()

  // 장면 2: 취업 사이트 → 메일함
  await look(page, 'laptop')
  await press(page.locator('#btn_jobsite_close'))
  await press(page.locator('#btn_mail_close'))

  // 장면 3: 문자
  await expect(page.getByText('문자가 도착했습니다. 휴대폰을 확인하세요.')).toBeVisible({
    timeout: 10_000,
  })
  await look(page, 'phone')
  await expect(page.getByText('서류 전형 결과를 메일로', { exact: false })).toBeVisible()
  await look(page, 'room')

  // 장면 4: 합격 메일과 면접 앱 메일
  await look(page, 'laptop')
  await expect(page.locator('#btn_mail_open_m_pass')).toBeAttached()
  await expect(page.locator('#btn_mail_open_m_app')).toBeAttached({ timeout: 60_000 })
  await press(page.locator('#btn_mail_open_m_app'))
  await press(page.locator('#btn_install_interview_app'))

  // 장면 5: 설치하고 면접
  await press(page.locator('#btn_interview_install'))
  await expect(page.locator('#btn_interview_join')).toBeVisible({ timeout: 10_000 })
  await press(page.locator('#btn_interview_join'))

  // 장면 6: 그날 오후, 업무용 노트북
  await expect(page.getByText('업무용 노트북이 도착했습니다. 노트북을 열어 보세요.')).toBeVisible({
    timeout: 90_000,
  })
  await look(page, 'room')
  await look(page, 'laptop')

  // 장면 7: 입사 서류
  await expect(page.getByText('입사 서류를 올리세요.')).toBeVisible({ timeout: 30_000 })
  await press(page.locator('#btn_work_attach'))
  for (const f of await page.locator('[id^=btn_finder_file_]').all()) await press(f)
  await press(page.locator('#btn_finder_open'))
  await press(page.locator('#btn_work_send'))

  // 장면 8: 얼굴 영상
  await expect(page.getByText('영상을 찍어 보내세요.')).toBeVisible({ timeout: 20_000 })
  await press(page.locator('#btn_work_video_start'))
  await expect(page.locator('#btn_work_video_send')).toBeEnabled({ timeout: 30_000 })
  await press(page.locator('#btn_work_video_send'))

  // 장면 9: 첫 업무
  await expect(page.getByText('1일차가 끝났습니다.')).toBeVisible({ timeout: 20_000 })
  expect(errors).toEqual([])
})
