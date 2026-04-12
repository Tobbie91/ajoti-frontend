import { useState, useEffect } from 'react'
import { Text, Button, Loader } from '@mantine/core'
import { IconPlus, IconArrowUpRight, IconArrowDownLeft } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getAdminWalletBalance, getWalletBalanceNaira, getWalletTransactions } from '@/utils/api'

interface Tx {
  id: string
  type: string
  amount: number
  description: string
  createdAt: string
  [key: string]: unknown
}

export function MyWallet() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  const storedUser = JSON.parse(localStorage.getItem('admin_user') ?? '{}')
  const userId = storedUser.id ?? storedUser._id ?? ''

  useEffect(() => {
    const fetchBalance = userId
      ? getAdminWalletBalance(userId)
          .then((data) => setBalance(data.available ?? data.total ?? 0))
          .catch(() =>
            getWalletBalanceNaira()
              .then((data) => setBalance(data.available ?? data.total ?? 0))
              .catch(() => setBalance(0)),
          )
      : getWalletBalanceNaira()
          .then((data) => setBalance(data.available ?? data.total ?? 0))
          .catch(() => setBalance(0))

    Promise.all([
      fetchBalance,
      getWalletTransactions()
        .then((txns) => setTransactions(txns.slice(0, 5)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Balance card */}
      <div className="mb-6 rounded-2xl bg-[#02A36E] px-6 py-6">
        <Text fw={400} className="text-[12px] text-white/70">Wallet Balance</Text>
        {loading ? (
          <div className="mb-4 flex items-center gap-2 py-1">
            <Loader size="sm" color="white" />
            <Text fw={400} className="text-white/70 text-[14px]">Loading...</Text>
          </div>
        ) : (
          <Text fw={700} className="mb-4 text-[32px] text-white">
            ₦{(balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        )}
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
      <div className="mb-4 flex items-center justify-between">
        <Text fw={700} className="text-[18px] text-[#0F172A]">Recent Transactions</Text>
        <button
          onClick={() => navigate('/transactions')}
          className="cursor-pointer text-[13px] font-medium text-[#02A36E] hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {transactions.length === 0 && !loading && (
          <Text fw={400} className="py-6 text-center text-[14px] text-[#9CA3AF]">No transactions yet</Text>
        )}
        {transactions.map((tx) => {
          const isCredit = (tx.type as string)?.toLowerCase().includes('credit') || (tx.amount as number) > 0
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCredit ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                  {isCredit
                    ? <IconArrowDownLeft size={18} color="#02A36E" />
                    : <IconArrowUpRight size={18} color="#EF4444" />}
                </div>
                <div>
                  <Text fw={500} className="text-[14px] text-[#0F172A]">{tx.description || tx.type}</Text>
                  <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                    {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </Text>
                </div>
              </div>
              <Text fw={600} className={`text-[14px] ${isCredit ? 'text-[#02A36E]' : 'text-[#EF4444]'}`}>
                {isCredit ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
              </Text>
            </div>
          )
        })}
      </div>
    </div>
  )
}
