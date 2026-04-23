import { useState, useEffect } from 'react'
import { Text, Loader, Skeleton } from '@mantine/core'
import {
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconBuildingBank,
  IconRefresh,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getVirtualAccount, type VirtualAccount } from '@/utils/api'

export function FundWallet() {
  const navigate = useNavigate()
  const [va, setVa] = useState<VirtualAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getVirtualAccount()
      setVa(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load account details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const copy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      <div className="mb-6">
        <Text fw={700} className="text-[24px] text-[#0F172A]">Fund Wallet</Text>
        <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
          Transfer to your dedicated account number from any Nigerian bank
        </Text>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <Skeleton h={16} w={120} radius="sm" />
          <Skeleton h={40} radius="sm" />
          <Skeleton h={16} w={160} radius="sm" />
          <Skeleton h={16} w={100} radius="sm" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <IconAlertCircle size={32} color="#EF4444" />
          <Text fw={400} className="text-[14px] text-red-600">{error}</Text>
          <button
            onClick={load}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50"
          >
            <IconRefresh size={14} />
            Try again
          </button>
        </div>
      ) : va ? (
        <div className="flex flex-col gap-4">
          {/* Account Card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FDF4]">
                <IconBuildingBank size={20} color="#02A36E" />
              </div>
              <div>
                <Text fw={600} className="text-[15px] text-[#0F172A]">{va.bankName}</Text>
                <Text fw={400} className="text-[12px] text-[#6B7280]">Dedicated virtual account</Text>
              </div>
            </div>

            {/* Account Number */}
            <div className="mb-4 rounded-xl bg-[#F9FAFB] p-4">
              <Text fw={400} className="mb-1 text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                Account Number
              </Text>
              <div className="flex items-center justify-between gap-3">
                <Text fw={700} className="text-[28px] tracking-widest text-[#0F172A]">
                  {va.accountNumber}
                </Text>
                <button
                  onClick={() => copy(va.accountNumber, 'number')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6]"
                >
                  {copiedField === 'number' ? (
                    <><IconCheck size={13} color="#02A36E" /><span className="text-[#02A36E]">Copied</span></>
                  ) : (
                    <><IconCopy size={13} /><span>Copy</span></>
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="flex items-center justify-between border-t border-[#F3F4F6] pt-4">
              <div>
                <Text fw={400} className="text-[11px] uppercase tracking-wide text-[#9CA3AF]">
                  Account Name
                </Text>
                <Text fw={500} className="mt-0.5 text-[14px] text-[#0F172A]">{va.accountName}</Text>
              </div>
              <button
                onClick={() => copy(va.accountName, 'name')}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] hover:bg-[#F3F4F6]"
              >
                {copiedField === 'name' ? (
                  <><IconCheck size={13} color="#02A36E" /><span className="text-[#02A36E]">Copied</span></>
                ) : (
                  <><IconCopy size={13} /><span>Copy</span></>
                )}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5">
            <Text fw={600} className="mb-3 text-[13px] text-[#374151]">How it works</Text>
            <ol className="flex flex-col gap-2">
              {[
                'Open your bank app and initiate a transfer',
                `Send any amount to the account number above (${va.bankName})`,
                'Your Ajoti wallet is credited automatically within minutes',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#02A36E] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <Text fw={400} className="text-[13px] text-[#6B7280]">{step}</Text>
                </li>
              ))}
            </ol>
          </div>

          <Text fw={400} className="text-center text-[11px] text-[#9CA3AF]">
            This account number is permanently assigned to you · Powered by Flutterwave
          </Text>
        </div>
      ) : null}
    </div>
  )
}
