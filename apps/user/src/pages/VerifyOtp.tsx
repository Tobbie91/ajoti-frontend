import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Text, PinInput, Loader } from '@mantine/core'

export function VerifyOtp() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'verifying'>('input')
  const [resent, setResent] = useState(false)

  function handleVerify() {
    if (otp.length < 6) return
    setStep('verifying')
    setTimeout(() => {
      navigate('/home')
    }, 1500)
  }

  function handleResend() {
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#F7FBF9] flex items-center justify-center px-4">
      <Card withBorder radius="xl" className="w-full max-w-[440px] border-[#E6F4EF] bg-white p-8 shadow-lg">
        {step === 'input' && (
          <div className="space-y-6 text-center">
            <div>
              <Text fw={700} size="lg" className="text-[#0F172A]">
                Verify your account
              </Text>
              <Text size="sm" className="mt-1 text-[#6B7280]">
                Enter the 6-digit code sent to your email.
              </Text>
            </div>

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

            <Button
              fullWidth
              radius="md"
              className="bg-[#0B6B55] text-white hover:bg-[#095C49]"
              disabled={otp.length < 6}
              onClick={handleVerify}
            >
              Verify
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
                  onClick={handleResend}
                >
                  Resend
                </Text>
              )}
            </div>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader size="lg" color="#0B6B55" />
            <Text fw={700} size="lg" className="text-[#0F172A]">
              Verifying
            </Text>
            <Text size="sm" className="text-[#6B7280]">
              Please wait...
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
