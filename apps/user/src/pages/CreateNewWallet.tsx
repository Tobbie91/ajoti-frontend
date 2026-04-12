import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from '@mantine/core'
import { IconArrowLeft, IconShieldCheck, IconTrendingUp, IconWallet } from '@tabler/icons-react'
import NigerianFlag from '@/assets/NigerianFlag.svg'

type Currency = 'NGN'

const BENEFITS = [
  {
    icon: <IconShieldCheck size={18} color="#02A36E" />,
    text: 'No Naira loss — your funds are fully secured',
  },
  {
    icon: <IconWallet size={18} color="#02A36E" />,
    text: 'Accessible savings and investments anytime',
  },
  {
    icon: <IconTrendingUp size={18} color="#02A36E" />,
    text: 'Competitive interest rates on your balance',
  },
]

export function CreateNewWallet() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Currency>('NGN')

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      {/* Heading */}
      <div className="mb-8">
        <Text fw={700} className="text-[26px] text-[#0F172A]">
          Create New Wallet
        </Text>
        <Text fw={400} className="mt-1 text-[14px] text-[#6B7280]">
          Select a currency to set up your wallet
        </Text>
      </div>

      {/* Currency selection */}
      <div className="mb-6">
        <Text fw={600} className="mb-3 text-[13px] uppercase tracking-wider text-[#9CA3AF]">
          Available Currencies
        </Text>

        <button
          onClick={() => setSelected('NGN')}
          className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
            selected === 'NGN'
              ? 'border-[#02A36E] bg-[#F0FDF4]'
              : 'border-[#E5E7EB] bg-white hover:border-[#D1FAE5] hover:bg-[#F9FAFB]'
          }`}
        >
          {/* Flag */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
            <img src={NigerianFlag} alt="Nigerian Flag" className="h-full w-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 text-left">
            <Text fw={600} className="text-[15px] text-[#0F172A]">
              Nigerian Naira
            </Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              NGN · ₦0.00 balance
            </Text>
          </div>

          {/* Selected indicator */}
          <div
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              selected === 'NGN'
                ? 'border-[#02A36E] bg-[#02A36E]'
                : 'border-[#D1D5DB] bg-white'
            }`}
          >
            {selected === 'NGN' && (
              <div className="h-2 w-2 rounded-full bg-white" />
            )}
          </div>
        </button>
      </div>

      {/* Benefits */}
      <div className="mb-8 rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <Text fw={600} className="mb-4 text-[14px] text-[#374151]">
          Why open a Naira wallet?
        </Text>
        <div className="flex flex-col gap-3">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4]">
                {b.icon}
              </div>
              <Text fw={400} className="text-[13px] leading-relaxed text-[#374151]">
                {b.text}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/fund-wallet')}
        className="w-full cursor-pointer rounded-xl bg-[#02A36E] py-3.5 text-[15px] font-semibold text-white hover:bg-[#028a5b]"
      >
        Fund Wallet
      </button>

      <Text fw={400} className="mt-3 text-center text-[12px] text-[#9CA3AF]">
        Your wallet will be created automatically when you fund it
      </Text>
    </div>
  )
}
