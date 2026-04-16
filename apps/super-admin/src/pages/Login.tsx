import { useState } from 'react'
import { Button, Card, PasswordInput, Text, TextInput, Alert } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { IconAlertCircle } from '@tabler/icons-react'
import { login as loginApi } from '@/utils/api'

export function Login() {
  const navigate = useNavigate()

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

      if (user.role !== 'SUPERADMIN') {
        throw new Error('Access denied. SUPERADMIN account required.')
      }

      localStorage.setItem('superadmin_access_token', token)
      localStorage.setItem('superadmin_refresh_token', refreshToken)
      localStorage.setItem('superadmin_user', JSON.stringify(user))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        {/* Branded panel */}
        <div
          className="hidden flex-col justify-between rounded-3xl bg-[#0B6B55] px-10 py-12 text-white shadow-lg lg:flex"
          style={{ minHeight: 520 }}
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">
                AJOTI
              </Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">
                Super Admin · Portal
              </span>
            </div>

            <div className="space-y-4">
              <Text fw={700} size="xl">
                Platform oversight, simplified
              </Text>
              <Text size="sm" className="text-white/90">
                Manage users, review KYC, govern ROSCA circles, and monitor platform health — all from one place.
              </Text>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">User & KYC Management</Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Review KYC submissions, manage user status, and control access.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">ROSCA Governance</Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Monitor circles, flag defaulters, and force-cancel problematic groups.
                </Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">Analytics & Audit Logs</Text>
                <Text size="xs" className="mt-1 text-white/80">
                  Track platform growth, transaction flows, and a full admin audit trail.
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-[480px]">
            <div className="mb-6 text-center lg:hidden">
              <Text fw={700} size="xl" className="text-[#0B6B55]">
                AJOTI
              </Text>
              <Text size="sm" className="mt-1 text-[#6B7280]">
                Super Admin Portal
              </Text>
            </div>

            <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
              <div className="space-y-6">
                <div>
                  <Text fw={700} size="lg" className="text-[#0F172A]">
                    Super Admin Sign In
                  </Text>
                  <Text size="sm" className="text-[#6B7280]">
                    Restricted access — SUPERADMIN accounts only.
                  </Text>
                </div>

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
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                />
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  radius="md"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
                />

                <Button
                  fullWidth
                  radius="md"
                  className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
                  onClick={handleLogin}
                  loading={loading}
                >
                  Sign in
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
