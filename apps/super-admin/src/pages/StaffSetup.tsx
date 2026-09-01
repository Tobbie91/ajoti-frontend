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
import { ApiError, staffSetup } from '@/utils/api'
import { PASSWORD_POLICY_DESCRIPTION, PhoneInputField, isAdultDob, parseCalendarDate, validatePassword, validatePersonName, validatePhone } from '@ajoti/shared'

type StaffSetupField = 'firstName' | 'lastName' | 'dob' | 'gender' | 'phone' | 'password' | 'confirmPassword'

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
  const [submitted, setSubmitted] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<StaffSetupField, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<Partial<Record<StaffSetupField, string>>>({})

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setServerErrors((current) => {
      const next = { ...current }
      delete next[field as StaffSetupField]
      return next
    })
  }

  function validationErrors(): Partial<Record<StaffSetupField, string>> {
    const dob = parseCalendarDate(form.dob)
    return {
      firstName: validatePersonName(form.firstName, 'First name'),
      lastName: validatePersonName(form.lastName, 'Last name'),
      dob: !form.dob ? 'Date of birth is required.' : !dob || !isAdultDob(dob) ? 'Staff must be at least 18 years old.' : undefined,
      gender: !form.gender ? 'Gender is required.' : undefined,
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: !form.confirmPassword ? 'Please repeat the password.' : form.password !== form.confirmPassword ? 'Passwords do not match.' : undefined,
      ...serverErrors,
    }
  }

  const errors = validationErrors()
  const fieldError = (field: StaffSetupField) => touched[field] || submitted ? errors[field] : undefined

  async function handleSubmit() {
    setSubmitted(true)
    const validationMessages = Object.values(errors).filter(Boolean)
    if (validationMessages.length) { setError(validationMessages.join(' ')); return }

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
      if (e instanceof ApiError) {
        setServerErrors(Object.fromEntries(Object.entries(e.fieldErrors).map(([field, messages]) => [field, messages.join(' ')])))
        setError(e.messages.join(' '))
      } else {
        setError(e instanceof Error ? e.message : 'Setup failed. Please try again.')
      }
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
              onBlur={() => setTouched((current) => ({ ...current, firstName: true }))}
              error={fieldError('firstName')}
              required
            />
            <TextInput
              label="Last name"
              placeholder="Smith"
              value={form.lastName}
              onChange={(e) => set('lastName', e.currentTarget.value)}
              onBlur={() => setTouched((current) => ({ ...current, lastName: true }))}
              error={fieldError('lastName')}
              required
            />
          </Group>

          <TextInput
            label="Date of birth"
            description="Format: YYYY-MM-DD"
            placeholder="1990-01-15"
            value={form.dob}
            onChange={(e) => set('dob', e.currentTarget.value)}
            onBlur={() => setTouched((current) => ({ ...current, dob: true }))}
            error={fieldError('dob')}
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
            error={fieldError('gender')}
            required
          />

          <PhoneInputField
            label="Phone number"
            value={form.phone}
            onChange={(value) => set('phone', value)}
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            error={fieldError('phone')}
            required
          />

          <PasswordInput
            label="Password"
            description={PASSWORD_POLICY_DESCRIPTION}
            placeholder="Create a strong password"
            value={form.password}
            onChange={(e) => set('password', e.currentTarget.value)}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={fieldError('password')}
            required
          />

          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={(e) => set('confirmPassword', e.currentTarget.value)}
            onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
            error={fieldError('confirmPassword')}
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
