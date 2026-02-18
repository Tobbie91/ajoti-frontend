import { Text, Button } from '@mantine/core'
import { IconPlus, IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const WALLET_BALANCE = '₦10,000.00'

const RECENT_TX = [
  { id: '1', name: 'Wallet Funding', type: 'Via card •••• 6275', time: '1:15 PM', amount: '₦50,000', direction: 'credit' as const },
  { id: '2', name: 'ROSCA Contribution', type: 'Auto-debit', time: '9:00 AM', amount: '₦10,000', direction: 'debit' as const },
  { id: '3', name: 'ROSCA Payout', type: 'Auto-credit', time: '8:00 AM', amount: '₦250,000', direction: 'credit' as const },
]

export function MyWallet() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Balance card */}
      <div className="mb-6 rounded-2xl bg-[#02A36E] px-6 py-6">
        <Text fw={400} className="text-[12px] text-white/70">
          Wallet Balance
        </Text>
        <Text fw={700} className="mb-4 text-[32px] text-white">
          {WALLET_BALANCE}
        </Text>
        <div className="flex gap-3">
          <Button
            radius="md"
            size="sm"
            leftSection={<IconPlus size={16} />}
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={() => navigate('/fund-wallet')}
          >
            Fund Wallet
          </Button>
          <Button
            radius="md"
            size="sm"
            leftSection={<IconArrowUpRight size={16} />}
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={() => navigate('/withdraw')}
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="flex items-center justify-between mb-4">
        <Text fw={700} className="text-[18px] text-[#0F172A]">
          Recent Transactions
        </Text>
        <button
          onClick={() => navigate('/transactions')}
          className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {RECENT_TX.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  tx.direction === 'credit' ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'
                }`}
              >
                {tx.direction === 'credit' ? (
                  <IconArrowDownLeft size={18} color="#02A36E" />
                ) : (
                  <IconArrowUpRight size={18} color="#EF4444" />
                )}
              </div>
              <div>
                <Text fw={500} className="text-[14px] text-[#0F172A]">
                  {tx.name}
                </Text>
                <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                  {tx.type} · {tx.time}
                </Text>
              </div>
            </div>
            <Text
              fw={600}
              className={`text-[14px] ${
                tx.direction === 'credit' ? 'text-[#02A36E]' : 'text-[#EF4444]'
              }`}
            >
              {tx.direction === 'credit' ? '+' : '-'}{tx.amount}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}
