import { expect, test } from '@playwright/test'

// 페이지 내용은 팀원마다 바뀌므로, 버튼과 목록이 뜨고 페이지가 오류 없이 열리는지만 확인한다.
test('타이틀의 테스트 페이지 버튼으로 팀원 페이지를 연다', async ({ page }) => {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))

  await page.goto('/')
  await page.getByRole('navigation', { name: '테스트 페이지' }).getByRole('link').first().click()

  await expect(page).toHaveURL(/[?&]sandbox=\w+/)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: '시작하기' })).toBeHidden()
  expect(errors).toEqual([])
})

test('?sandbox는 테스트 페이지 목록을 보여 준다', async ({ page }) => {
  await page.goto('/?sandbox')
  await expect(page.getByRole('heading', { name: '테스트 페이지', exact: true })).toBeVisible()
  const links = page.getByRole('navigation', { name: '테스트 페이지' }).getByRole('link')
  await expect(links.first()).toBeVisible()
})
