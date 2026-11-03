import { expect, test } from '@playwright/test'

test('login blocks malformed emails before contacting authentication', async ({ page }) => {
  const requests: string[] = []
  await page.route('**/api/auth/token', route => {
    requests.push(route.request().postDataJSON().email)
    return route.fulfill({ status: 401, json: { message: 'Credentials not recognised.' } })
  })
  await page.goto('/login')
  await page.getByLabel('Password', { exact: true }).fill('test-password')
  for (const value of ['', 'not-an-email', 'name@@example.com', 'name@example', 'name..test@example.com', 'name@-example.com', 'name@exam..ple.com', 'name<test>@example.com']) {
    await page.getByLabel('Email', { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByText(value ? 'Enter a valid email address.' : 'Email is required.', { exact: true })).toBeVisible()
    expect(requests).toHaveLength(0)
  }
  await page.getByLabel('Email', { exact: true }).fill('member+tag@example.com')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect.poll(() => requests).toEqual(['member+tag@example.com'])
  await expect(page.getByText('Credentials not recognised.', { exact: true })).toBeVisible()
})

test('signup validates email on blur and clears the field error after correction', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('person@bad..domain.com')
  await page.getByRole('textbox', { name: 'Email', exact: true }).blur()
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('person.name+goal@example.com')
  await page.getByRole('textbox', { name: 'Email', exact: true }).blur()
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toHaveCount(0)
})
