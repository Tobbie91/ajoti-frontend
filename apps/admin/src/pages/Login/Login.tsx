import { useState } from 'react'
import { Button, Card, Group, PasswordInput, Text, TextInput, Alert, Modal, Stack, PinInput } from '@mantine/core'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAlertCircle } from '@tabler/icons-react'
import { login as loginApi, forgotPassword, resetPassword } from '@/utils/api'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified') === 'true'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      const { token, refreshToken, user } = await loginApi(email.trim(), password)

      let jwtRole: string | undefined
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        jwtRole = payload.role
      } catch {
        throw new Error('Invalid token received')
      }

      if (jwtRole !== 'CIRCLE_ADMIN') {
        throw new Error('Access denied. This portal is for circle admins only.')
      }

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

  function openForgot() {
    setForgotOpen(true)
    setForgotStep('email')
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotError(null)
    setForgotSuccess(null)
  }

  async function handleForgotRequest() {
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotError(null)
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotStep('reset')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleForgotReset() {
    if (!forgotOtp || !forgotNewPassword) return
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match')
      return
    }
    setForgotLoading(true)
    setForgotError(null)
    try {
      await resetPassword({ email: forgotEmail.trim(), otp: forgotOtp, newPassword: forgotNewPassword })
      setForgotSuccess('Password reset successfully. You can now log in.')
      setTimeout(() => setForgotOpen(false), 2000)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setForgotLoading(false)
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
                Manage your ajo groups
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

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm">
            Request admin access from your Ajoti user account before signing in here.
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

              <Group justify="flex-end" className="text-xs text-[#6B7280]">
                <Text
                  component="span"
                  style={{ cursor: 'pointer', color: '#0B6B55' }}
                  onClick={openForgot}
                >
                  Forgot password?
                </Text>
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

      {/* Forgot Password Modal */}
      <Modal
        opened={forgotOpen}
        onClose={() => setForgotOpen(false)}
        centered
        radius="md"
        size="sm"
        title={<Text fw={700} fz="md">{forgotStep === 'email' ? 'Reset Password' : 'Enter OTP'}</Text>}
      >
        <Stack gap="md">
          {forgotSuccess ? (
            <Alert color="green" radius="md" variant="light">
              {forgotSuccess}
            </Alert>
          ) : forgotStep === 'email' ? (
            <>
              <Text fz="sm" c="dimmed">
                Enter your email address and we'll send you a reset code.
              </Text>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                radius="md"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleForgotRequest()}
              />
              {forgotError && <Text fz="sm" c="red">{forgotError}</Text>}
              <Button
                fullWidth
                radius="md"
                style={{ background: '#0B6B55' }}
                loading={forgotLoading}
                disabled={!forgotEmail.trim()}
                onClick={handleForgotRequest}
              >
                Send Reset Code
              </Button>
            </>
          ) : (
            <>
              <Text fz="sm" c="dimmed">
                Enter the OTP sent to <b>{forgotEmail}</b> and your new password.
              </Text>
              <Stack gap={4}>
                <Text fz="sm" fw={500}>OTP Code</Text>
                <PinInput
                  length={6}
                  value={forgotOtp}
                  onChange={setForgotOtp}
                  type="number"
                  radius="md"
                />
              </Stack>
              <PasswordInput
                label="New Password"
                placeholder="••••••••"
                radius="md"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.currentTarget.value)}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="••••••••"
                radius="md"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.currentTarget.value)}
              />
              {forgotError && <Text fz="sm" c="red">{forgotError}</Text>}
              <Group gap="sm">
                <Button
                  variant="default"
                  radius="md"
                  flex={1}
                  onClick={() => { setForgotStep('email'); setForgotError(null) }}
                >
                  Back
                </Button>
                <Button
                  radius="md"
                  flex={1}
                  style={{ background: '#0B6B55' }}
                  loading={forgotLoading}
                  disabled={!forgotOtp || !forgotNewPassword || !forgotConfirmPassword}
                  onClick={handleForgotReset}
                >
                  Reset Password
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </div>
  )
}
