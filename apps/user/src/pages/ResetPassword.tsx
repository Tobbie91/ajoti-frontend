import { useState } from 'react'
import { Button, Card, Text, PinInput, PasswordInput, Alert } from '@mantine/core'
import { IconAlertCircle, IconCheck, IconLock } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { resetPassword, resendResetOtp } from '@/utils/api'

export function ResetPassword() {
  const navigate = useNavigate()
  const email = localStorage.getItem('reset_email') ?? ''

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function handleSubmit() {
    setError(null)

    if (otp.length < 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, otp, newPassword })
      localStorage.removeItem('reset_email')
      navigate('/?verified=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    try {
      await resendResetOtp(email)
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FBF9] px-4">
      <Card withBorder radius="xl" className="w-full max-w-[440px] border-[#E6F4EF] bg-white p-8 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4]">
              <IconLock size={28} color="#02A36E" />
            </div>
            <Text fw={700} size="lg" className="text-[#0F172A]">
              Reset your password
            </Text>
            <Text size="sm" className="mt-1 text-[#6B7280]">
              Enter the code sent to {email || 'your email'} and your new password.
            </Text>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {error}
            </Alert>
          )}

          <div>
            <Text fw={500} size="sm" className="mb-2 text-[#374151]">
              Reset code
            </Text>
            <div className="flex justify-center">
              <PinInput
                length={6}
                size="lg"
                radius="md"
                value={otp}
                onChange={setOtp}
                type="number"
                styles={{
                  input: {
                    borderColor: '#BFEBD1',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 18,
                  },
                }}
              />
            </div>
          </div>

          <PasswordInput
            label="New password"
            placeholder="••••••••"
            radius="md"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
          />

          <PasswordInput
            label="Confirm new password"
            placeholder="••••••••"
            radius="md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
          />

          <Button
            fullWidth
            radius="md"
            className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
            loading={loading}
            onClick={handleSubmit}
          >
            Reset password
          </Button>

          <div className="flex items-center justify-center gap-1">
            <Text size="sm" className="text-[#6B7280]">
              Didn't receive the code?
            </Text>
            {resent ? (
              <Text size="sm" fw={600} className="text-[#0B6B55]">
                Code sent!
              </Text>
            ) : (
              <Text
                size="sm"
                fw={600}
                className="cursor-pointer text-[#0B6B55]"
                onClick={resendLoading ? undefined : handleResend}
                style={{ opacity: resendLoading ? 0.5 : 1 }}
              >
                {resendLoading ? 'Sending...' : 'Resend'}
              </Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
