import { expect, test, type Page, type TestInfo } from '@playwright/test'

const account = {
  email: 'journey-ready@ajoti.test',
  password: 'Password123!',
}

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(account.email)
  await page.getByLabel('Password').fill(account.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

function monitorRuntimeFailures(page: Page) {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`)
  })
  return failures
}

test('new users get complete, field-level signup guidance', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('button', { name: 'Create account' }).click()

  for (const message of [
    'First name is required.',
    'Last name is required.',
    'Email is required.',
    'Phone number is required.',
    'Date of birth is required.',
    'Gender is required.',
    'Password is required.',
  ]) {
    await expect(page.getByText(message, { exact: true }).first()).toBeVisible()
  }
})

test('journey-ready member can understand and open every primary area', async ({ page }, testInfo: TestInfo) => {
  const failures = monitorRuntimeFailures(page)
  await login(page)

  const routes = [
    { path: '/home', marker: /Hello Jide/i, name: 'home' },
    { path: '/rosca', marker: /Welcome to ajo/i, mobileMarker: /Find an ajo/i, name: 'ajo' },
    { path: '/target-savings', marker: /Target Savings/i, name: 'target-savings' },
    { path: '/my-wallet', marker: /Wallet Balance/i, name: 'wallet' },
    { path: '/transactions', marker: /Transactions/i, name: 'transactions' },
    { path: '/loans', marker: /Loan/i, name: 'loans' },
    { path: '/debts', marker: /Debt/i, name: 'debts' },
    { path: '/messages', marker: /Message/i, name: 'messages' },
    { path: '/support', marker: /Support/i, name: 'support' },
    { path: '/my-profile', marker: /Personal Information/i, name: 'profile' },
  ]

  for (const route of routes) {
    await page.goto(route.path)
    const marker = testInfo.project.name === 'mobile-chromium' && 'mobileMarker' in route
      ? route.mobileMarker
      : route.marker
    await expect(page.locator('main').getByText(marker).first()).toBeVisible({ timeout: 15_000 })
    await page.screenshot({
      path: testInfo.outputPath(`${route.name}.png`),
      fullPage: true,
    })
  }

  expect(failures, failures.join('\n')).toEqual([])
})

test('KYC and payment-gated screens stay local and usable with fixtures', async ({ page }) => {
  const failures = monitorRuntimeFailures(page)
  await login(page)

  await page.goto('/kyc')
  await expect(page.getByText(/Level 1|Identity|verification/i).first()).toBeVisible()

  await page.goto('/fund-wallet')
  await expect(page.getByText(/Fund|Bank transfer|Virtual account/i).first()).toBeVisible()

  await page.goto('/withdraw')
  await expect(page.getByText(/Withdraw/i).first()).toBeVisible()

  expect(failures, failures.join('\n')).toEqual([])
})
