import { expect, test } from '@playwright/test'

test('영상을 건너뛰고 이름을 넣어 시작하면 3D 캔버스가 뜬다', async ({ page, isMobile }) => {
  // 좁은 화면에서는 시작 화면의 이름 칸과 "시작하기" 단추가 화면 밖으로 밀려 누를 수 없다.
  // 시작 화면을 좁은 화면에 맞추는 일(#122)이 끝나면 이 줄을 지운다.
  test.fixme(isMobile, '좁은 화면에서 시작하기 단추가 화면 밖에 있다 (#122)')
  await page.goto('/')
  // 첫 영상은 아무 키로 건너뛴다. 시작 화면이 키를 듣기 시작한 뒤에 눌러야 해서, 안내 글이 뜰 때까지 기다린다
  await expect(page.getByText('클릭하면 건너뛰어요')).toBeAttached()
  await page.keyboard.press('Space')
  const start = page.getByRole('button', { name: '시작하기' })
  await expect(start).toBeDisabled()
  await page.getByLabel('이름을 입력해 주세요.').fill('한결')
  await start.click()
  await expect(page.locator('.game-canvas canvas')).toBeVisible()
})
