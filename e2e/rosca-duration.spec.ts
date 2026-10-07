import { expect, test } from '@playwright/test'
import { mockRoscaReads } from './rosca-read-fixtures'

test('group detail refreshes 10 to 6 cycles using its live detail endpoint', async ({ page }) => {
  const state = { duration: 10 }
  await mockRoscaReads(page, state)
  // Existing discovery may exclude a joined private/completed group entirely.
  await page.route('**/api/rosca', route => route.fulfill({ json: { data: [] } }))
  await page.goto('/rosca/family')
  await expect(page.getByText('10 cycles', { exact: true })).toBeVisible()
  state.duration = 6
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText('6 cycles', { exact: true })).toBeVisible()
  await expect(page.getByText('10 cycles', { exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('6 cycles', { exact: true })).toBeVisible()
})

test('discovery and joined progress refresh their authoritative duration and completed numerator', async ({ page }) => {
  const state = { duration: 10 }
  await mockRoscaReads(page, state)
  await page.goto('/rosca')
  await expect(page.getByText(/10 cycles/).first()).toBeVisible()
  state.duration = 6
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText(/6 cycles/).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Joined', exact: true }).or(page.getByRole('button', { name: 'Joined', exact: true })).filter({ visible: true }).first().click()
  await expect(page.getByText(/1 of 6 cycles/).first()).toBeVisible()
})

test('Growth overview uses current duration and keeps completed cycle history', async ({ page }) => {
  const state = { duration: 10 }
  await mockRoscaReads(page, state)
  await page.goto('/rosca/family/activities')
  await expect(page.getByText(/1 of 10 cycles completed/).first()).toBeVisible()
  state.duration = 6
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText(/1 of 6 cycles completed/).first()).toBeVisible()
  await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible()
})

test('join requests and join summary use duration 6 even with maxSlots 10', async ({ page }) => {
  await mockRoscaReads(page, { duration: 6 })
  await page.goto('/rosca/requests')
  await expect(page.getByText(/6 cycles/).first()).toBeVisible()
  await page.goto('/rosca/family/summary')
  await expect(page.getByText('6 months', { exact: true }).first()).toBeVisible()
})
