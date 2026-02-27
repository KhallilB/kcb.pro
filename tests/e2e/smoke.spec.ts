import { expect, test } from '@playwright/test'

test('renders blank start world foundation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Signal Link Established' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Portfolio World (Blank Foundation)' })).toBeVisible()
  await expect(page.getByText('ComboCV')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open Fightfolio Interaction Lab' })).toBeVisible()
})

test('navigates to fightfolio interaction lab from start world', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Signal Link Established' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Portfolio World (Blank Foundation)' })).toBeVisible()
  await page.getByRole('link', { name: 'Open Fightfolio Interaction Lab' }).click()
  await expect(page).toHaveURL(/\/interaction-lab$/)
  await expect(page.getByRole('heading', { name: 'Fightfolio Interaction Lab' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Goblin' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Signature' })).toBeVisible()
})
