import { expect, test } from '@playwright/test'

// 페이지 내용은 팀원마다 바뀌므로, 목록이 뜨고 페이지가 오류 없이 열리는지만 확인한다.
test('?sandbox 목록에서 팀원 테스트 페이지를 연다', async ({ page }) => {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))

  await page.goto('/?sandbox')
  const listHeading = page.getByRole('heading', { name: '테스트 페이지', exact: true })
  await expect(listHeading).toBeVisible()

  await page.getByRole('listitem').getByRole('link').first().click()
  await expect(page).toHaveURL(/[?&]sandbox=.+/)
  await page.waitForLoadState('networkidle')
  await expect(listHeading).toBeHidden()
  expect(errors).toEqual([])
})
