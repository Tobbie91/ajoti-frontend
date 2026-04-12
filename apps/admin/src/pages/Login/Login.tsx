import { useState } from 'react'
import { Button, Card, Group, PasswordInput, Text, TextInput, Alert } from '@mantine/core'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { IconAlertCircle } from '@tabler/icons-react'
import { login as loginApi } from '@/utils/api'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      const { token, refreshToken, user } = await loginApi(email.trim(), password)
      localStorage.setItem('admin_access_token', token)
      localStorage.setItem('admin_refresh_token', refreshToken)
      const existing = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
      const merged = { ...existing }
      for (const [k, v] of Object.entries(user)) {
        if (v !== '' && v !== null && v !== undefined) merged[k] = v
      }
      localStorage.setItem('admin_user', JSON.stringify(merged))
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        {/* Branded panel — hidden on mobile, visible on lg+ */}
        <div className="hidden flex-col justify-between rounded-3xl bg-[#0B6B55] px-10 py-12 text-white shadow-lg lg:flex" style={{ minHeight: 520 }}>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">
                AJOTI
              </Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
                Admin · Portal
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Manage your ROSCA groups
              </Text>
              <Text size="sm" className="text-white/90">
                Create, manage, and monitor your savings groups from one dashboard.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Group Management
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Create groups, manage members, and track contributions.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">
                  Payouts & Analytics
                </Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Schedule payouts and view group performance at a glance.
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            <span>Need an admin account?</span>
            <Link to="/signup" className="font-semibold text-white">
              Create account
            </Link>
          </div>
        </div>

        {/* Login form — always visible, centered on mobile */}
        <div className="flex w-full items-center justify-center">
          {/* Mobile branding header */}
          <div className="w-full max-w-[480px]">
            <div className="mb-6 text-center lg:hidden">
              <Text fw={700} size="xl" className="text-[#0B6B55]">
                AJOTI
              </Text>
              <Text size="sm" className="mt-1 text-[#6B7280]">
                Admin Portal
              </Text>
            </div>
          <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
            <div className="space-y-6">
              <div>
                <Text fw={700} size="lg" className="text-[#0F172A]">
                  Admin Log in
                </Text>
                <Text size="sm" className="text-[#6B7280]">
                  Enter your credentials to continue.
                </Text>
              </div>

              {verified && (
                <Alert color="green" radius="md" variant="light">
                  Email verified! You can now log in.
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
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />
              <PasswordInput
                label="Password"
                placeholder="••••••••"
                radius="md"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                styles={{
                  input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' },
                }}
              />

              <Group justify="space-between" className="text-xs text-[#6B7280]">
                <Text component="span">Forgot password?</Text>
                <Link to="/signup" className="text-[#0B6B55]">
                  Create account
                </Link>
              </Group>

              <Button
                fullWidth
                radius="md"
                className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
                onClick={handleLogin}
                loading={loading}
              >
                Sign in
              </Button>

              <Text size="xs" className="text-center text-[#6B7280]">
                By signing in, you agree to our Terms and Privacy Policy.
              </Text>
            </div>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
