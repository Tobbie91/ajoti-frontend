import { expect, test } from '@playwright/test'

test('unverified login recovers through resend and code verification', async ({ page }) => {
  await page.route('**/api/auth/token', route => route.fulfill({
    status: 403, json: { message: 'Email not verified' },
  }))
  let resendAttempts = 0
  await page.route('**/api/auth/resend-verify-otp', async route => {
    expect(route.request().postDataJSON()).toEqual({ email: 'member@example.com' })
    resendAttempts++
    await route.fulfill(resendAttempts === 1
      ? { status: 429, json: { message: 'Please wait before requesting another code' } }
      : { json: { message: 'Code sent' } })
  })
  await page.route('**/api/auth/verify-email', async route => {
    expect(route.request().postDataJSON()).toEqual({ email: 'member@example.com', otp: '123456' })
    await route.fulfill({ json: { message: 'Email verified' } })
  })
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill('member@example.com')
  await page.getByLabel('Password', { exact: true }).fill('test-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/verify-otp$/)
  await expect(page.getByText('Enter the 6-digit code sent to member@example.com.')).toBeVisible()
  await page.getByRole('button', { name: 'Resend', exact: true }).click()
  await expect(page.getByText('Please wait before requesting another code')).toBeVisible()
  await page.getByRole('button', { name: 'Resend', exact: true }).click()
  await expect(page.getByText('Code sent!')).toBeVisible()
  const inputs = page.locator('input').filter({ visible: true })
  for (let i = 0; i < 6; i++) await inputs.nth(i).fill(String(i + 1))
  await page.getByRole('button', { name: 'Verify', exact: true }).click()
  await expect(page).toHaveURL(/\/login\?verified=true$/)
  await expect(page.getByText('Email verified! You can now log in.')).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('verify_email'))).toBeNull()
})

test('verification without an email returns to login', async ({ page }) => {
  await page.goto('/verify-otp')
  await expect(page).toHaveURL(/\/login$/)
})
