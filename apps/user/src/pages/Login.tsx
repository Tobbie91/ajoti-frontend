import { useState } from 'react'
import { Button, Card, Group, PasswordInput, Text, TextInput, Divider, Alert } from '@mantine/core'
import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/utils/auth'
import { login as loginApi } from '@/utils/api'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
  const justVerified = searchParams.get('verified') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const { token, refreshToken, user } = await loginApi(email.trim(), password)
      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
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
                Secure · Verified
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Welcome back to Ajoti
              </Text>
              <Text size="sm" className="text-white/90">
                Save, invest, and grow your wealth — all from one platform.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Savings & ROSCA
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Fixed savings, target savings, and trusted group contributions.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Investments & Insurance
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Grow your wealth with smart investments and stay protected.
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            <span>Need an account?</span>
            <Link to="/signup" className="font-semibold text-white">
              Create account
            </Link>
          </div>
        </div>

        <div className="order-1 flex items-center lg:order-2">
          <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              <div>
                <Text fw={700} size="lg" className="text-[#0F172A]">
                  Log in
                </Text>
                <Text size="sm" className="text-[#6B7280]">
                  Enter your credentials to continue.
                </Text>
              </div>

              {justVerified && (
                <Alert icon={<IconCheck size={16} />} color="green" radius="md" variant="light">
                  Email verified successfully! Please log in to continue.
                </Alert>
              )}

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
                  {error}
                </Alert>
              )}

              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />
              <PasswordInput
                label="Password"
                placeholder="••••••••"
                radius="md"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Link to="/forgot-password" className="text-[#0B6B55]">
                  Forgot password?
                </Link>
                <Link to="/signup" className="text-[#0B6B55]">
                  Create account
                </Link>
              </Group>

              <Button
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
                loading={loading}
                onClick={handleSubmit}
              >
                Sign in
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
                      text="signin_with"
                      shape="rectangular"
                    />
                  </div>
                </>
              )}

              <Text size="xs" className="text-center text-[#6B7280]">
                By signing in, you agree to our Terms and Privacy Policy.
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
