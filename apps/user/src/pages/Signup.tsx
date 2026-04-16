import { useState } from 'react'
import { Button, Card, Group, PasswordInput, Text, TextInput, Divider, Select, Alert } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconUsers, IconUserCircle, IconAlertCircle } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/utils/auth'
import { register } from '@/utils/api'

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL ?? 'http://localhost:5179'

export function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)

    if (!firstName || !lastName || !email || !phone || !dob || !gender || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob: dob.toISOString().split('T')[0],
        gender: gender as 'MALE' | 'FEMALE',
        password,
        role: 'MEMBER',
      })
      localStorage.setItem('verify_email', email.trim())
      localStorage.setItem('user', JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dob: dob.toISOString().split('T')[0],
      }))
      navigate('/verify-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        <div className="order-2 flex flex-col justify-between rounded-3xl bg-[#0B6B55] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10 lg:order-1 lg:px-10 lg:py-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">
                AJOTI
              </Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
                Join · Grow
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Join Ajoti today
              </Text>
              <Text size="sm" className="text-white/90">
                Save, invest, and manage your finances — all in one place.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Quick onboarding
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Set up your account and start saving in minutes.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Everything in one place
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Savings, ROSCA, investments, insurance, and remittances.
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            <span>Already a member?</span>
            <Link to="/" className="font-semibold text-white">
              Log in
            </Link>
          </div>
        </div>

        <div className="order-1 flex items-center lg:order-2">
          <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              <div>
                <Text fw={700} size="lg" className="text-[#0F172A]">
                  Create account
                </Text>
                <Text size="sm" className="text-[#6B7280]">
                  Get started in minutes.
                </Text>
              </div>

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
                  {error}
                </Alert>
              )}

              <Group grow gap="sm">
                <TextInput
                  label="First name"
                  placeholder="John"
                  radius="md"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                />
                <TextInput
                  label="Last name"
                  placeholder="Doe"
                  radius="md"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                />
              </Group>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />
              <TextInput
                label="Phone number"
                placeholder="+234 800 000 0000"
                radius="md"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />
              <Group grow gap="sm">
                <DateInput
                  label="Date of birth"
                  placeholder="DD/MM/YYYY"
                  radius="md"
                  valueFormat="DD/MM/YYYY"
                  maxDate={new Date()}
                  value={dob}
                  onChange={(value) => setDob(value ? new Date(value) : null)}
                  dateParser={(input) => {
                    const [day, month, year] = input.split('/')
                    if (day && month && year && year.length === 4) {
                      return new Date(Number(year), Number(month) - 1, Number(day))
                    }
                    return new Date(input)
                  }}
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                />
                <Select
                  label="Gender"
                  placeholder="Select"
                  data={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                  ]}
                  radius="md"
                  value={gender}
                  onChange={(value) => setGender(value as 'MALE' | 'FEMALE' | null)}
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                  allowDeselect={false}
                />
              </Group>

              {/* Account type — member only; admins use the separate admin app */}
              <div>
                <Text fw={500} size="sm" className="mb-2 text-[#0F172A]">
                  I want to
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex cursor-default flex-col items-center gap-2 rounded-xl border-2 border-[#02A36E] bg-[#F0FDF4] px-4 py-4">
                    <IconUserCircle size={28} color="#02A36E" />
                    <Text fw={600} className="text-[13px] text-[#02A36E]">
                      Join Groups
                    </Text>
                    <Text fw={400} className="text-center text-[11px] text-[#6B7280]">
                      Save with others in ROSCA groups
                    </Text>
                  </div>
                  <a
                    href={`${ADMIN_APP_URL}/signup`}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-[#E5E7EB] bg-white px-4 py-4 no-underline transition-colors hover:border-[#BFEBD1]"
                  >
                    <IconUsers size={28} color="#9CA3AF" />
                    <Text fw={600} className="text-[13px] text-[#374151]">
                      Manage a Group
                    </Text>
                    <Text fw={400} className="text-center text-[11px] text-[#6B7280]">
                      I already run a savings group
                    </Text>
                  </a>
                </div>
              </div>

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                radius="md"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Text component="span">Already have an account?</Text>
                <Link to="/" className="text-[#0B6B55]">
                  Log in
                </Link>
              </Group>

              <Button
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
                loading={loading}
                onClick={handleSubmit}
              >
                Create account
              </Button>

              {hasGoogleClientId && (
                <>
                  <Divider label="OR" labelPosition="center" />
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          login(credentialResponse.credential)
                        }
                      }}
                      onError={() => console.log('Login Failed')}
                      theme="outline"
                      size="large"
                      text="signup_with"
                      shape="rectangular"
                    />
                  </div>
                </>
              )}

              <Text size="xs" className="text-center text-[#6B7280]">
                By creating an account, you agree to our Terms and Privacy Policy.
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
