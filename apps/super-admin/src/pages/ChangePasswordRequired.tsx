import { useState } from 'react'
import { Button, Card, Text, PasswordInput, Alert } from '@mantine/core'
import { IconAlertCircle, IconLock } from '@tabler/icons-react'
import { changePassword, clearSessionAndRedirect } from '@/utils/api'

/**
 * Forced first-login password rotation for staff created directly with a
 * temporary password. The backend rejects every other authenticated action
 * until this succeeds, so there is no way to skip this screen meaningfully.
 * After a successful change all sessions are revoked - the user is sent back
 * to log in with their new password.
 */
export function ChangePasswordRequired() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!currentPassword) {
      setError('Enter the temporary password you were given.')
      return
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
      setError('New password must be between 8 and 20 characters.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from the temporary one.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await changePassword({ oldPassword: currentPassword, newPassword })
      setDone(true)
      // Changing the password revokes all sessions - return to login cleanly.
      setTimeout(() => clearSessionAndRedirect(), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FBF9] px-4">
      <Card withBorder radius="xl" className="w-full max-w-[440px] border-[#E6F4EF] bg-white p-8 shadow-lg">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4]">
              <IconLock size={28} color="#0B6B55" />
            </div>
            <Text fw={700} size="lg" className="text-[#0F172A]">
              Set your own password
            </Text>
            <Text size="sm" className="mt-1 text-[#6B7280]">
              Your account was created with a temporary password. You must replace it with one only
              you know before you can use the panel.
            </Text>
          </div>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
              {error}
            </Alert>
          )}

          {done ? (
            <Alert color="green" radius="md" variant="light">
              Password changed. Redirecting you to log in with your new password…
            </Alert>
          ) : (
            <>
              <PasswordInput
                label="Temporary password"
                placeholder="••••••••"
                radius="md"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.currentTarget.value)}
                styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
              />
              <PasswordInput
                label="New password"
                description="8–20 characters"
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
                Change password and continue
              </Button>
              <Text
                size="sm"
                className="cursor-pointer text-center font-semibold text-[#6B7280]"
                onClick={() => clearSessionAndRedirect()}
              >
                Log out instead
              </Text>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
