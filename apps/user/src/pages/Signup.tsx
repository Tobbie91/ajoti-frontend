import { useState } from 'react'
import { Button, Card, Group, PasswordInput, Text, TextInput, Divider, Select } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconUsers, IconUserCircle } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/utils/auth'

export function Signup() {
  const { login } = useAuth()
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
  const [role, setRole] = useState<'member' | 'admin'>('member')

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

              <TextInput
                label="Full name"
                placeholder="Your name"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <TextInput
                label="Phone number"
                placeholder="+234 800 000 0000"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <Group grow gap="sm">
                <DatePickerInput
                  label="Date of birth"
                  placeholder="DD/MM/YYYY"
                  radius="md"
                  valueFormat="DD/MM/YYYY"
                  maxDate={new Date()}
                  styles={{
                    input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                  }}
                />
                <Select
                  label="Gender"
                  placeholder="Select"
                  data={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  radius="md"
                  styles={{
                    input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                  }}
                  allowDeselect={false}
                />
              </Group>
              {/* Role Selection */}
              <div>
                <Text fw={500} size="sm" className="mb-2 text-[#0F172A]">
                  I want to
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                      role === 'member'
                        ? 'border-[#02A36E] bg-[#F0FDF4]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#BFEBD1]'
                    }`}
                  >
                    <IconUserCircle
                      size={28}
                      color={role === 'member' ? '#02A36E' : '#9CA3AF'}
                    />
                    <Text
                      fw={600}
                      className={`text-[13px] ${role === 'member' ? 'text-[#02A36E]' : 'text-[#374151]'}`}
                    >
                      Join Groups
                    </Text>
                    <Text fw={400} className="text-center text-[11px] text-[#6B7280]">
                      Save with others in ROSCA groups
                    </Text>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors ${
                      role === 'admin'
                        ? 'border-[#02A36E] bg-[#F0FDF4]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#BFEBD1]'
                    }`}
                  >
                    <IconUsers
                      size={28}
                      color={role === 'admin' ? '#02A36E' : '#9CA3AF'}
                    />
                    <Text
                      fw={600}
                      className={`text-[13px] ${role === 'admin' ? 'text-[#02A36E]' : 'text-[#374151]'}`}
                    >
                      Manage a Group
                    </Text>
                    <Text fw={400} className="text-center text-[11px] text-[#6B7280]">
                      I already run a savings group
                    </Text>
                  </button>
                </div>
              </div>

              <PasswordInput
                label="Password"
                placeholder="••••••••"
                radius="md"
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Text component="span">Already have an account?</Text>
                <Link to="/" className="text-[#0B6B55]">
                  Log in
                </Link>
              </Group>

              <Button
                component={Link}
                to="/verify-otp"
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
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
                      onError={() => {
                        console.log('Login Failed')
                      }}
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

