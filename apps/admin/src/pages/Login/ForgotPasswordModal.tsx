import { useEffect, useState } from 'react'
import { Alert, Button, Group, Modal, PasswordInput, PinInput, Stack, Text, TextInput } from '@mantine/core'
import { forgotPassword, resetPassword } from '@/utils/api'
import { PASSWORD_POLICY_DESCRIPTION, validatePassword } from '@ajoti/shared'

interface Props {
  opened: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ opened, onClose }: Props) {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!opened) return
    setStep('email')
    setEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
  }, [opened])

  async function requestReset() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await forgotPassword(email.trim())
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  async function confirmReset() {
    if (!otp || !newPassword) return
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword({ email: email.trim(), otp, newPassword })
      setSuccess('Password reset successfully. You can now log in.')
      setTimeout(onClose, 1600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} centered radius="md" size="sm"
      title={<Text fw={700} fz="md">{step === 'email' ? 'Reset Password' : 'Enter OTP'}</Text>}>
      <Stack gap="md">
        {success ? <Alert color="green">{success}</Alert> : step === 'email' ? (
          <>
            <Text fz="sm" c="dimmed">Enter your email address and we'll send you a reset code.</Text>
            <TextInput label="Email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && requestReset()} />
            {error && <Text fz="sm" c="red">{error}</Text>}
            <Button fullWidth loading={loading} disabled={!email.trim()} onClick={requestReset} style={{ background: '#0B6B55' }}>
              Send Reset Code
            </Button>
          </>
        ) : (
          <>
            <Text fz="sm" c="dimmed">Enter the OTP sent to <b>{email}</b> and your new password.</Text>
            <Stack gap={4}><Text fz="sm" fw={500}>OTP Code</Text><PinInput length={6} value={otp} onChange={setOtp} type="number" /></Stack>
            <PasswordInput label="New Password" description={PASSWORD_POLICY_DESCRIPTION} value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} />
            <PasswordInput label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.currentTarget.value)} />
            {error && <Text fz="sm" c="red">{error}</Text>}
            <Group gap="sm">
              <Button variant="default" flex={1} onClick={() => { setStep('email'); setError(null) }}>Back</Button>
              <Button flex={1} loading={loading} disabled={!otp || !newPassword || !confirmPassword}
                onClick={confirmReset} style={{ background: '#0B6B55' }}>Reset Password</Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  )
}
