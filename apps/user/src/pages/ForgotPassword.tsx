import { useState } from 'react'
import { Button, Card, Text, TextInput, Alert } from '@mantine/core'
import { IconAlertCircle, IconMail } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '@/utils/api'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      await forgotPassword(email.trim())
      localStorage.setItem('reset_email', email.trim())
      navigate('/reset-password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code.')
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
              <IconMail size={28} color="#02A36E" />
            </div>
            <Text fw={700} size="lg" className="text-[#0F172A]">
              Forgot your password?
            </Text>
            <Text size="sm" className="mt-1 text-[#6B7280]">
              Enter your email and we'll send you a reset code.
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            styles={{ input: { borderColor: '#BFEBD1', backgroundColor: '#FFFFFF' } }}
          />

          <Button
            fullWidth
            radius="md"
            className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
            loading={loading}
            onClick={handleSubmit}
          >
            Send reset code
          </Button>

          <Text size="sm" className="text-center text-[#6B7280]">
            Remember your password?{' '}
            <Link to="/" className="font-semibold text-[#0B6B55]">
              Log in
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
