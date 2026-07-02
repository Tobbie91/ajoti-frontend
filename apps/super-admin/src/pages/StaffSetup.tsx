import {
  Alert,
  Button,
  Card,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { staffSetup } from '@/utils/api'

export function StaffSetup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '' as 'MALE' | 'FEMALE' | '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate(): string | null {
    if (!token) return 'Missing invite token. Please use the link from your invite email.'
    if (!form.firstName.trim()) return 'First name is required.'
    if (!form.lastName.trim()) return 'Last name is required.'
    if (!form.dob) return 'Date of birth is required.'
    if (!form.gender) return 'Gender is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      const result = await staffSetup({
        token,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dob: form.dob,
        gender: form.gender as 'MALE' | 'FEMALE',
        phone: form.phone.trim(),
        password: form.password,
      })

      // Auto-login with the returned tokens
      localStorage.setItem('superadmin_access_token', result.accessToken)
      localStorage.setItem('superadmin_refresh_token', result.refreshToken)
      // Store minimal user info from JWT payload
      try {
        const payload = JSON.parse(atob(result.accessToken.split('.')[1]))
        localStorage.setItem('superadmin_user', JSON.stringify({
          id: payload.sub,
          email: '',
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          role: payload.role,
          staffRole: payload.staffRole ?? null,
        }))
      } catch { /* non-fatal */ }

      setDone(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Stack align="center" justify="center" h="100vh">
        <Alert color="red" icon={<IconAlertCircle />} title="Invalid link">
          This setup link is missing a token. Please use the original link from your invite email.
        </Alert>
      </Stack>
    )
  }

  if (done) {
    return (
      <Stack align="center" justify="center" h="100vh">
        <Alert color="green" icon={<IconCheck />} title="Account created">
          Your account is set up. Redirecting you to the dashboard…
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack align="center" justify="center" mih="100vh" bg="gray.0" p="xl">
      <Card shadow="sm" p="xl" radius="md" w="100%" maw={460} withBorder>
        <Stack>
          <Stack gap={4}>
            <Title order={2}>Set up your staff account</Title>
            <Text size="sm" c="dimmed">
              Complete your profile to activate your Ajoti staff account.
            </Text>
          </Stack>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}

          <Group grow>
            <TextInput
              label="First name"
              placeholder="Jane"
              value={form.firstName}
              onChange={(e) => set('firstName', e.currentTarget.value)}
              required
            />
            <TextInput
              label="Last name"
              placeholder="Smith"
              value={form.lastName}
              onChange={(e) => set('lastName', e.currentTarget.value)}
              required
            />
          </Group>

          <TextInput
            label="Date of birth"
            description="Format: YYYY-MM-DD"
            placeholder="1990-01-15"
            value={form.dob}
            onChange={(e) => set('dob', e.currentTarget.value)}
            required
          />

          <Select
            label="Gender"
            placeholder="Select gender"
            data={[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
            ]}
            value={form.gender || null}
            onChange={(v) => set('gender', v ?? '')}
            required
          />

          <TextInput
            label="Phone number"
            description="International format, e.g. +2348012345678"
            placeholder="+2348012345678"
            value={form.phone}
            onChange={(e) => set('phone', e.currentTarget.value)}
            required
          />

          <PasswordInput
            label="Password"
            description="Minimum 8 characters"
            placeholder="Create a strong password"
            value={form.password}
            onChange={(e) => set('password', e.currentTarget.value)}
            required
          />

          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.currentTarget.value)}
            required
          />

          <Button onClick={handleSubmit} loading={loading} fullWidth mt="sm">
            Create My Account
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}
