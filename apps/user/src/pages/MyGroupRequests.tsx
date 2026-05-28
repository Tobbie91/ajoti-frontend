import { useState, useEffect } from 'react'
import { Text, Badge, Avatar, Tabs, Loader } from '@mantine/core'
import { IconArrowLeft, IconClock, IconClipboardOff } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getMyJoinRequests, type MyJoinRequest } from '@/utils/api'

const REQUEST_TABS = ['Pending', 'Accepted', 'Declined'] as const

type RequestStatus = 'Pending' | 'Accepted' | 'Declined'

interface GroupRequest {
  id: string
  groupName: string
  amount: string
  duration: string
  admin: string
  status: RequestStatus
  date: string
}

function mapStatus(raw: string): RequestStatus {
  const s = raw.toUpperCase()
  if (s === 'PENDING') return 'Pending'
  if (['ACTIVE', 'STARTED'].includes(s)) return 'Accepted'
  if (s === 'REJECTED') return 'Declined'
  return 'Declined'
}

function mapRequest(r: MyJoinRequest): GroupRequest {
  const circle = r.circle ?? {}
  const amountKobo = Number(circle.contributionAmount ?? 0)
  const amountNaira = amountKobo / 100
  const formatted = amountKobo > 0
    ? `₦${amountNaira.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    : '—'
  const adminName = circle.admin
    ? `${circle.admin.firstName ?? ''} ${circle.admin.lastName ?? ''}`.trim()
    : 'Admin'
  const date = r.requestedAt
    ? new Date(r.requestedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  return {
    id: r.membershipId,
    groupName: circle.name ?? `Circle ${r.circleId.slice(0, 6)}`,
    amount: formatted,
    duration: circle.durationCycles ? `${circle.durationCycles} cycles` : '—',
    admin: adminName,
    status: mapStatus(r.status ?? ''),
    date,
  }
}

const statusConfig: Record<RequestStatus, { bg: string; color: string }> = {
  Pending: { bg: '#FEF3C7', color: '#92400E' },
  Accepted: { bg: '#D1FAE5', color: '#065F46' },
  Declined: { bg: '#FEE2E2', color: '#991B1B' },
}

const emptyStateText: Record<string, { title: string; subtitle: string }> = {
  Pending: {
    title: 'No pending requests',
    subtitle: 'Your pending group requests will appear here once you apply to join a group.',
  },
  Accepted: {
    title: 'No accepted requests yet',
    subtitle: 'Once a group admin accepts your request, it will appear here.',
  },
  Declined: {
    title: 'No declined requests yet',
    subtitle: 'Any declined requests from group admins will appear here.',
  },
}

export function MyGroupRequests() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('Pending')
  const [requests, setRequests] = useState<GroupRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyJoinRequests()
      .then((data) => setRequests(data.map(mapRequest)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = requests.filter((r) => {
    if (activeTab === 'Pending') return r.status === 'Pending'
    if (activeTab === 'Accepted') return r.status === 'Accepted'
    if (activeTab === 'Declined') return r.status === 'Declined'
    return true
  })

  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back button + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rosca')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">
            My Group Requests
          </Text>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(v || 'Pending')}
          variant="default"
          styles={{
            list: {
              display: 'flex',
            },
            tab: {
              flex: 1,
              textAlign: 'center',
              fontWeight: 500,
              fontSize: 14,
              padding: '10px 0',
              color: '#9CA3AF',
            },
          }}
        >
          <Tabs.List grow>
            {REQUEST_TABS.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>
                {tab}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Request Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader color="#02A36E" size="md" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filtered.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7]">
                      <IconClock size={24} color="#F59E0B" />
                    </div>
                    <div>
                      <Text fw={700} className="text-[16px] text-[#0F172A]">
                        {request.groupName}
                      </Text>
                      <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                        {request.amount} / month &middot; {request.duration}
                      </Text>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar size={24} radius="xl" color="dark" variant="filled">
                          {request.admin.charAt(0)}
                        </Avatar>
                        <Text fw={500} className="text-[12px] text-[#6B7280]">
                          Admin: {request.admin}
                        </Text>
                      </div>
                      <Text fw={400} className="mt-2 text-[12px] text-[#9CA3AF]">
                        Requested on {request.date}
                      </Text>
                    </div>
                  </div>

                  <Badge
                    size="md"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor: statusConfig[request.status].bg,
                        color: statusConfig[request.status].color,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 12,
                      },
                    }}
                  >
                    {request.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F4F6]">
              <IconClipboardOff size={36} color="#9CA3AF" stroke={1.5} />
            </div>
            <Text fw={600} className="mt-5 text-[16px] text-[#374151]">
              {emptyStateText[activeTab]?.title}
            </Text>
            <Text fw={400} className="mt-2 max-w-[320px] text-center text-[13px] leading-relaxed text-[#9CA3AF]">
              {emptyStateText[activeTab]?.subtitle}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}
