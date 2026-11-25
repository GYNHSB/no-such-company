import { expect, test } from '@playwright/test'

test('타이틀에서 시작하기를 누르면 3D 캔버스가 뜬다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '시작하기' }).click()
  await expect(page.locator('.game-canvas canvas')).toBeVisible()
})
