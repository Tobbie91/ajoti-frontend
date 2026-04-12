import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Text, Loader } from '@mantine/core'
import { IconCheck, IconX, IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import { verifyFunding } from '@/utils/api'

export function FundWalletCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(true)

  const status = params.get('status')
  const txRef = params.get('tx_ref')
  const isSuccess = status === 'successful' || status === 'success'

  useEffect(() => {
    if (isSuccess && txRef) {
      verifyFunding(txRef).finally(() => setVerifying(false))
    } else {
      const t = setTimeout(() => setVerifying(false), 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4">
        <Loader size="md" color="#02A36E" />
        <Text fw={500} className="mt-4 text-[15px] text-[#374151]">Verifying payment...</Text>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4">
        <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F0FDF4]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#02A36E]">
                <IconCheck size={32} color="white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <Text fw={700} className="mb-2 text-center text-[22px] text-[#0F172A]">Payment Successful!</Text>
          <Text fw={400} className="mb-6 text-center text-[14px] text-[#6B7280]">
            Your wallet has been funded successfully. The balance will reflect shortly.
          </Text>
          {txRef && (
            <div className="mb-6 rounded-xl bg-[#F9FAFB] px-4 py-3">
              <Text fw={400} className="text-center text-[11px] text-[#9CA3AF]">Reference</Text>
              <Text fw={600} className="text-center text-[13px] text-[#374151]">{txRef}</Text>
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/fund-wallet')}
            className="mt-3 w-full cursor-pointer rounded-xl border border-[#E5E7EB] bg-white py-3 text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            Fund Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500">
              <IconX size={32} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <Text fw={700} className="mb-2 text-center text-[22px] text-[#0F172A]">Payment Failed</Text>
        <Text fw={400} className="mb-6 text-center text-[14px] text-[#6B7280]">
          {status === 'cancelled'
            ? 'You cancelled the payment. No money was deducted.'
            : 'Something went wrong with your payment. Please try again.'}
        </Text>
        <button
          onClick={() => navigate('/fund-wallet')}
          className="mb-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#02A36E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#028a5b]"
        >
          <IconRefresh size={16} />
          Try Again
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white py-3 text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
        >
          <IconArrowLeft size={16} />
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
