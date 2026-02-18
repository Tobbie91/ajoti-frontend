import { useState } from 'react'
import { Text, TextInput, Select } from '@mantine/core'
import {
  IconArrowLeft,
  IconSearch,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconPlus,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

type Transaction = {
  id: string
  name: string
  type: string
  time: string
  amount: string
  direction: 'credit' | 'debit'
  date: string
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    name: 'Osho Joel',
    type: 'Bank Transfer',
    time: '2:30 PM',
    amount: '₦5,000',
    direction: 'debit',
    date: 'Today',
  },
  {
    id: '2',
    name: 'Wallet Funding',
    type: 'Via card •••• 6275',
    time: '1:15 PM',
    amount: '₦50,000',
    direction: 'credit',
    date: 'Today',
  },
  {
    id: '3',
    name: 'ROSCA Contribution',
    type: 'Auto-debit',
    time: '9:00 AM',
    amount: '₦10,000',
    direction: 'debit',
    date: 'Today',
  },
  {
    id: '4',
    name: 'Wallet Funding',
    type: 'Bank Transfer',
    time: '4:45 PM',
    amount: '₦100,000',
    direction: 'credit',
    date: 'Yesterday',
  },
  {
    id: '5',
    name: 'Abimbola Michael',
    type: 'Bank Transfer',
    time: '11:20 AM',
    amount: '₦15,000',
    direction: 'debit',
    date: 'Yesterday',
  },
  {
    id: '6',
    name: 'ROSCA Payout',
    type: 'Auto-credit',
    time: '8:00 AM',
    amount: '₦250,000',
    direction: 'credit',
    date: 'Feb 15, 2026',
  },
]

const STATUS_OPTIONS = ['All', 'Successful', 'Pending', 'Failed']
const TYPE_OPTIONS = ['All', 'Credit', 'Debit']
const CATEGORY_OPTIONS = ['All', 'Transfer', 'Funding', 'ROSCA', 'Investment']

export function Transactions() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | null>('All')
  const [type, setType] = useState<string | null>('All')
  const [category, setCategory] = useState<string | null>('All')

  const walletBalance = '₦10,000.00'

  const filtered = MOCK_TRANSACTIONS.filter((tx) => {
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
    if (type && type !== 'All') {
      if (type === 'Credit' && tx.direction !== 'credit') return false
      if (type === 'Debit' && tx.direction !== 'debit') return false
    }
    return true
  })

  // Group by date
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  return (
    <div className="mx-auto w-full max-w-[700px] px-6 py-8">
      {/* Wallet balance banner */}
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#02A36E] px-6 py-4">
        <div>
          <Text fw={400} className="text-[12px] text-white/70">
            Wallet Balance
          </Text>
          <Text fw={700} className="text-[24px] text-white">
            {walletBalance}
          </Text>
        </div>
        <button
          onClick={() => navigate('/fund-wallet')}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
        >
          <IconPlus size={16} />
          Add money
        </button>
      </div>

      {/* Back + Title */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[#374151] hover:text-[#0F172A]"
      >
        <IconArrowLeft size={18} />
        Back
      </button>

      <Text fw={700} className="mb-6 text-[24px] text-[#0F172A]">
        Transactions
      </Text>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          data={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          placeholder="Status"
          radius="md"
          size="xs"
          styles={{
            input: { borderColor: '#E5E7EB', fontSize: 13, height: 36, minWidth: 120 },
          }}
        />
        <Select
          data={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          placeholder="Type"
          radius="md"
          size="xs"
          styles={{
            input: { borderColor: '#E5E7EB', fontSize: 13, height: 36, minWidth: 100 },
          }}
        />
        <Select
          data={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
          placeholder="Category"
          radius="md"
          size="xs"
          styles={{
            input: { borderColor: '#E5E7EB', fontSize: 13, height: 36, minWidth: 120 },
          }}
        />
      </div>

      {/* Search */}
      <TextInput
        placeholder="Search transactions"
        radius="md"
        size="sm"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<IconSearch size={16} color="#9CA3AF" />}
        styles={{
          input: { borderColor: '#E5E7EB', fontSize: 13, height: 40 },
        }}
        className="mb-6"
      />

      {/* Transaction list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]">
            <IconSearch size={28} color="#9CA3AF" />
          </div>
          <Text fw={600} className="text-[16px] text-[#374151]">
            No transactions found
          </Text>
          <Text fw={400} className="max-w-[280px] text-[13px] text-[#9CA3AF]">
            Try adjusting your filters or search to find what you&apos;re looking for.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, transactions]) => (
            <div key={date}>
              <Text fw={600} className="mb-3 text-[13px] text-[#6B7280]">
                {date}
              </Text>
              <div className="flex flex-col gap-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-[#F3F4F6] bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.direction === 'credit'
                            ? 'bg-[#F0FDF4]'
                            : 'bg-[#FEF2F2]'
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
          ))}
        </div>
      )}
    </div>
  )
}
