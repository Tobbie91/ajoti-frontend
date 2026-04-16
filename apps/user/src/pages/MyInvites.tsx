import { useState, useEffect } from 'react'
import { Text, Loader, Badge } from '@mantine/core'
import { IconArrowLeft, IconUsers, IconCalendar } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { getMyInvites, type PendingInvite } from '@/utils/api'

export function MyInvites() {
  const navigate = useNavigate()
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyInvites()
      .then(setInvites)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rosca')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[22px] text-[#0F172A]">My Invites</Text>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader color="#02A36E" size="md" />
          </div>
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F4F6]">
              <IconUsers size={36} color="#9CA3AF" />
            </div>
            <Text fw={600} className="text-[16px] text-[#374151]">No pending invites</Text>
            <Text fw={400} className="text-center text-[13px] text-[#9CA3AF]">
              When an admin invites you to a private group, it will appear here.
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {invites.map((invite) => {
              const amountNaira = Number(invite.circle.contributionAmount) / 100
              const adminName = `${invite.circle.admin.firstName} ${invite.circle.admin.lastName}`.trim()
              const expiresDate = new Date(invite.expiresAt).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              const slotsLeft = invite.circle.maxSlots - invite.circle.filledSlots

              return (
                <div key={invite.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D1FAE5]">
                        <IconUsers size={24} color="#02A36E" />
                      </div>
                      <div>
                        <Text fw={700} className="text-[16px] text-[#0F172A]">{invite.circle.name}</Text>
                        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                          ₦{amountNaira.toLocaleString('en-NG')} / {invite.circle.frequency.toLowerCase()} &middot; {invite.circle.durationCycles} cycles
                        </Text>
                        <Text fw={500} className="mt-1 text-[12px] text-[#6B7280]">
                          Admin: {adminName} &middot; {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
                        </Text>
                        <div className="mt-2 flex items-center gap-1.5">
                          <IconCalendar size={13} color="#9CA3AF" />
                          <Text fw={400} className="text-[12px] text-[#9CA3AF]">
                            Expires {expiresDate}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      radius="xl"
                      styles={{ root: { backgroundColor: '#FEF3C7', color: '#92400E', textTransform: 'none', fontWeight: 600, fontSize: 11, flexShrink: 0 } }}
                    >
                      Pending
                    </Badge>
                  </div>

                  <button
                    onClick={() => navigate(`/rosca/invite/${invite.token}`)}
                    className="mt-5 w-full cursor-pointer rounded-xl bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
                  >
                    View &amp; Accept
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
