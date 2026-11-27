import { expect, test } from '@playwright/test'

test('영상을 건너뛰고 이름을 넣어 시작하면 3D 캔버스가 뜬다', async ({ page }) => {
  await page.goto('/')
  // 첫 영상은 아무 키로 건너뛴다
  await page.keyboard.press('Space')
  const start = page.getByRole('button', { name: '시작하기' })
  await expect(start).toBeDisabled()
  await page.getByLabel('이름을 입력해 주세요.').fill('한결')
  await start.click()
  await expect(page.locator('.game-canvas canvas')).toBeVisible()
})
