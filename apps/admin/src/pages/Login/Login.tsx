import { useState } from 'react'
import { Alert, Button, Card, Group, PasswordInput, Text, TextInput } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login as loginApi } from '@/utils/api'
import { defaultAuthenticatedPath, getTokenRole } from '@/utils/auth-role'
import { ForgotPasswordModal } from './ForgotPasswordModal'

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      const { token, refreshToken, user } = await loginApi(email.trim(), password)
      const role = getTokenRole(token)
      if (!role || !['MEMBER', 'CIRCLE_ADMIN'].includes(role)) {
        throw new Error('This account cannot use the Ajoti customer application.')
      }

      localStorage.setItem('access_token', token)
      localStorage.setItem('refresh_token', refreshToken)
      const existing = JSON.parse(localStorage.getItem('user') ?? '{}')
      const merged: Record<string, unknown> = { ...existing, role }
      for (const [key, value] of Object.entries(user)) {
        if (value !== '' && value !== null && value !== undefined) merged[key] = value
      }
      localStorage.setItem('user', JSON.stringify(merged))
      const pendingRedirect = localStorage.getItem('pending_redirect')
      if (pendingRedirect?.startsWith('/')) {
        localStorage.removeItem('pending_redirect')
        navigate(pendingRedirect)
      } else {
        navigate(defaultAuthenticatedPath(role))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9]">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 items-center gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2 lg:gap-10 lg:px-6 lg:py-12">
        <div className="hidden flex-col justify-between rounded-3xl bg-[#0B6B55] px-10 py-12 text-white shadow-lg lg:flex" style={{ minHeight: 520 }}>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Text fw={700} size="xl" className="tracking-wide">AJOTI</Text>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs">One App</span>
            </div>
            <div className="space-y-4">
              <Text fw={700} size="xl">Save, join and manage from one place</Text>
              <Text size="sm" className="text-white/90">
                Members and group organisers now use the same Ajoti application. Organiser tools appear automatically when your account has permission.
              </Text>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">Savings & Wallet</Text>
                <Text size="xs" className="mt-1 text-white/80">Fund your wallet, save towards targets, join ajos and track your money.</Text>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <Text fw={600} size="sm">Organiser Tools</Text>
                <Text size="xs" className="mt-1 text-white/80">Eligible group admins get additional creation and management capabilities in the same app.</Text>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-[480px]">
            <div className="mb-6 text-center lg:hidden">
              <Text fw={700} size="xl" className="text-[#0B6B55]">AJOTI</Text>
              <Text size="sm" className="mt-1 text-[#6B7280]">Savings & Ajo</Text>
            </div>
            <Card withBorder radius="xl" className="w-full border-[#E6F4EF] bg-white p-6 shadow-lg sm:p-8">
              <div className="space-y-6">
                <div>
                  <Text fw={700} size="lg" className="text-[#0F172A]">Log in</Text>
                  <Text size="sm" className="text-[#6B7280]">Enter your Ajoti credentials to continue.</Text>
                </div>
                {verified && <Alert color="green" radius="md" variant="light">Email verified! You can now log in.</Alert>}
                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">{error}</Alert>}
                <TextInput label="Email" placeholder="you@example.com" radius="md" value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)} styles={{ input: { borderColor: '#BFEBD1' } }} />
                <PasswordInput label="Password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" radius="md" value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  styles={{ input: { borderColor: '#BFEBD1' } }} />
                <Group justify="flex-end"><Text component="button" type="button" fz="xs" c="#0B6B55" onClick={() => setForgotOpen(true)}>Forgot password?</Text></Group>
                <Button fullWidth radius="md" onClick={handleLogin} loading={loading} style={{ background: '#0B6B55' }}>Sign in</Button>
                <Text size="sm" className="text-center text-[#6B7280]">
                  New to Ajoti?{' '}
                  <Text component="button" type="button" c="#0B6B55" fw={600} onClick={() => navigate('/signup')}>
                    Create an account
                  </Text>
                </Text>
                <Text size="xs" className="text-center text-[#6B7280]">By signing in, you agree to our Terms and Privacy Policy.</Text>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <ForgotPasswordModal opened={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  )
}
