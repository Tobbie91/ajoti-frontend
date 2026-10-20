import { formatKobo, sumKobo, koboPercent } from '@/utils/kobo'
import { useEffect, useState } from 'react'
import { Stack, Paper, Group, Text, Box, SimpleGrid, Table, Badge, Select, Avatar, Button, Loader } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react'
import { payoutSettlementDisplay } from '@/utils/payout-settlement'
import {
  getAdminCircleContributions,
  getAdminDisbursements,
  type AdminContributionsResponse,
  type Disbursement as ApiDisbursement,
  type FinancialHealth,
} from '@/utils/api'

const PRIMARY = '#0b6b55'

interface GroupPaymentsTabProps {
  allowExtensions: boolean
  circleId: string | undefined
  isActive: boolean
  financialHealth: FinancialHealth | null
  financialHealthLoading: boolean
  /** Bump this to force a disbursements refetch (e.g. after extending a deadline) even while already active. */
  refreshToken: number
  onExtendDeadline: (cycleNumber: number) => void
}

export function GroupPaymentsTab({
  allowExtensions, circleId, isActive, financialHealth, financialHealthLoading, refreshToken, onExtendDeadline }: GroupPaymentsTabProps) {
  const [selectedRound, setSelectedRound] = useState<string | null>('1')
  const [paymentContribs, setPaymentContribs] = useState<AdminContributionsResponse | null>(null)
  const [paymentContribsLoading, setPaymentContribsLoading] = useState(false)
  const [disbursements, setDisbursements] = useState<ApiDisbursement[]>([])
  const [disbursementsLoading, setDisbursementsLoading] = useState(false)
  const [contributionError, setContributionError] = useState(false)
  const [disbursementError, setDisbursementError] = useState(false)

  // Refetches on every tab-visit (isActive flips to true) and whenever refreshToken bumps,
  // matching the original "refetch each time you switch into this tab" behavior.
  useEffect(() => {
    if (isActive && circleId) {
      let active = true
      setDisbursementsLoading(true)
      setDisbursementError(false)
      getAdminDisbursements(circleId)
        .then(value => { if (active) setDisbursements(value) })
        .catch(() => { if (active) setDisbursementError(true) })
        .finally(() => { if (active) setDisbursementsLoading(false) })
      return () => { active = false }
    }
  }, [isActive, circleId, refreshToken])

  useEffect(() => {
    if (!isActive || !circleId || !selectedRound) return
    let active = true
    setPaymentContribsLoading(true)
    setPaymentContribs(null)
    setContributionError(false)
    getAdminCircleContributions(circleId, Number(selectedRound))
      .then(value => { if (active) setPaymentContribs(value) })
      .catch(() => { if (active) setContributionError(true) })
      .finally(() => { if (active) setPaymentContribsLoading(false) })
    return () => { active = false }
  }, [isActive, selectedRound, circleId, refreshToken])

  return (
    <Stack gap="lg">
      {/* Financial Health */}
      <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" mb="md">
          <Text fw={600} fz="md">Financial Health</Text>
          {financialHealthLoading && <Loader size="xs" color={PRIMARY} />}
        </Group>
        {financialHealth ? (() => {
          const cycles = financialHealth.cycles ?? []
          const totalExpKobo = sumKobo(cycles.map(c => c.expectedPot))?.toString()
          const totalColKobo = sumKobo(cycles.map(c => c.collected))?.toString()
          const overallRate = koboPercent(totalColKobo, totalExpKobo)
          return (
            <Stack gap="md">
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                  <Text fz="xs" c="dimmed" mb={4}>Total Expected</Text>
                  <Text fz="lg" fw={700}>{formatKobo(totalExpKobo)}</Text>
                </Box>
                <Box style={{ textAlign: 'center', background: '#f0faf7', borderRadius: 8, padding: '12px 8px' }}>
                  <Text fz="xs" c="dimmed" mb={4}>Total Collected</Text>
                  <Text fz="lg" fw={700} style={{ color: PRIMARY }}>{formatKobo(totalColKobo)}</Text>
                </Box>
                <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                  <Text fz="xs" c="dimmed" mb={4}>Collection Rate</Text>
                  <Text fz="lg" fw={700}>{overallRate == null ? "Unavailable" : `${overallRate.toFixed(1)}%`}</Text>
                </Box>
                <Box style={{ textAlign: 'center', background: '#f8f9fa', borderRadius: 8, padding: '12px 8px' }}>
                  <Text fz="xs" c="dimmed" mb={4}>Total Outstanding</Text>
                  <Text fz="lg" fw={700}>{formatKobo(sumKobo(cycles.map(c => c.outstanding))?.toString())}</Text>
                </Box>
              </SimpleGrid>
              {cycles.length > 0 && (
                <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="md" style={{ minWidth: 480 }}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8f9fa' }}>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Cycle</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Deadline</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Expected Pot</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Collected</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Rate</Table.Th>
                      <Table.Th style={{ fontWeight: 600, fontSize: 12, color: '#6B7280' }}>Outstanding</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {cycles.map((cyc) => {
                      const exp = cyc.expectedPot
                      const col = cyc.collected
                      const rate = koboPercent(col, exp)
                      const deadline = cyc.contributionDeadline
                        ? new Date(cyc.contributionDeadline).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short' })
                        : '-'
                      return (
                        <Table.Tr key={cyc.cycleNumber}>
                          <Table.Td><Text fz="sm" fw={500}>Cycle {cyc.cycleNumber}</Text></Table.Td>
                          <Table.Td><Text fz="sm" c="dimmed">{deadline}</Text></Table.Td>
                          <Table.Td><Text fz="sm">{formatKobo(exp)}</Text></Table.Td>
                          <Table.Td><Text fz="sm" style={{ color: PRIMARY }}>{formatKobo(col)}</Text></Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="sm" style={{ background: (rate ?? 0) >= 80 ? '#e6f5f1' : '#fdf3e7', color: (rate ?? 0) >= 80 ? PRIMARY : '#e67e22', border: 'none', fontWeight: 600 }}>
                              {rate == null ? "Unavailable" : `${rate}%`}
                            </Badge>
                          </Table.Td>
                          <Table.Td><Text fz="sm" c="dimmed">{formatKobo(cyc.outstanding)}</Text></Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table></div>
              )}
            </Stack>
          )
        })() : !financialHealthLoading ? (
          <Text fz="sm" c="dimmed">No financial health data available</Text>
        ) : null}
      </Paper>

      {/* Contributions In */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group
          justify="space-between"
          align="center"
          px="lg"
          py="sm"
          style={{ background: PRIMARY }}
        >
          <Text fw={600} fz="sm" c="white">Contributions In</Text>
          <Select
            data={financialHealth?.cycles?.map((c) => ({ value: String(c.cycleNumber), label: `Round ${c.cycleNumber}` })) ?? []}
            value={selectedRound}
            onChange={setSelectedRound}
            size="xs"
            radius="md"
            rightSection={<IconChevronDown size={12} color="white" />}
            styles={{
              input: {
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                minWidth: 110,
              },
            }}
            allowDeselect={false}
          />
        </Group>

        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
          <Table.Thead>
            <Table.Tr style={{ background: '#f8f9fa' }}>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Members Name</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Amount (₦)</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Status</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Payout Method</Table.Th>
              <Table.Th style={{ fontWeight: 600, fontSize: 13, color: '#495057' }}>Date & Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paymentContribsLoading ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Loader size="sm" color={PRIMARY} />
                </Table.Td>
              </Table.Tr>
            ) : contributionError ? (
              <Table.Tr><Table.Td colSpan={5}><Text role="alert" c="red" ta="center" py="xl">Could not load contributions. Refresh the group to try again.</Text></Table.Td></Table.Tr>
            ) : (paymentContribs?.contributions ?? []).length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No contributions found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              (paymentContribs?.contributions ?? []).map((c) => {
                const amountNaira = formatKobo(c.amount)
                const dateStr = c.paidAt
                  ? new Date(c.paidAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '-'
                return (
                  <Table.Tr key={c.contributionId}>
                    <Table.Td>
                      <Group gap="sm" align="center">
                        <Avatar size={28} radius="xl" color="gray">{(c.memberName || '?').charAt(0)}</Avatar>
                        <Text fz="sm" fw={500}>{c.memberName}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text fz="sm">{amountNaira}</Text></Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        radius="sm"
                        style={{
                          background: c.isLate ? '#fdf3e7' : '#e6f5f1',
                          color: c.isLate ? '#e67e22' : PRIMARY,
                          border: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {c.isLate ? 'Late' : 'Paid'}
                      </Badge>
                    </Table.Td>
                    <Table.Td><Text fz="sm">Wallet</Text></Table.Td>
                    <Table.Td><Text fz="sm">{dateStr}</Text></Table.Td>
                  </Table.Tr>
                )
              })
            )}
          </Table.Tbody>
        </Table></div>

        {/* Summary footer */}
        <Group
          justify="space-between"
          align="center"
          px="lg"
          py="md"
          style={{ borderTop: '1px solid #e9ecef', background: '#f8f9fa' }}
        >
          {paymentContribs && financialHealth && !paymentContribsLoading && !contributionError && <Group gap="xl">
            <Box>
              <Text fz="xs" c="dimmed">Total Expected</Text>
              <Text fz="sm" fw={600}>
                {(() => {
                  const cyc = financialHealth?.cycles?.find((c) => c.cycleNumber === Number(selectedRound))
                  return formatKobo(cyc?.expectedPot)
                })()}
              </Text>
            </Box>
            <Box>
              <Text fz="xs" c="dimmed">Total Received</Text>
              <Text fz="sm" fw={600} style={{ color: PRIMARY }}>
                {formatKobo(paymentContribs?.totalCollected)}
              </Text>
            </Box>
            <Box>
              <Text fz="xs" c="dimmed">Complete Rate</Text>
              <Text fz="sm" fw={600} style={{ color: PRIMARY }}>
                {(() => {
                  const cyc = financialHealth?.cycles?.find((c) => c.cycleNumber === Number(selectedRound))
                  const rate = koboPercent(cyc?.collected, cyc?.expectedPot)
                  return rate == null ? 'Unavailable' : `${rate}%`
                })()}
              </Text>
            </Box>
          </Group>}
        </Group>
      </Paper>

      {/* Disbursement Status */}
      <Paper radius="md" style={{ border: '1px solid #e9ecef' }}>
        <Group justify="space-between" align="center" px="lg" py="md">
          <Text fw={600} fz="md">Disbursement Status</Text>
        </Group>

        <div style={{ overflowX: 'auto' }}><Table verticalSpacing="sm" horizontalSpacing="lg" style={{ minWidth: 560 }}>
          <Table.Thead>
            <Table.Tr style={{ background: PRIMARY }}>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Members Name</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Amount</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Status</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Payment Method</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Date Disbursed</Table.Th>
              <Table.Th style={{ color: 'white', fontWeight: 600, fontSize: 13 }} w={140} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {disbursementsLoading ? (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Loader size="sm" color={PRIMARY} />
                </Table.Td>
              </Table.Tr>
            ) : disbursementError ? (
              <Table.Tr><Table.Td colSpan={6}><Text role="alert" c="red" ta="center" py="xl">Could not load disbursements. Refresh the group to try again.</Text></Table.Td></Table.Tr>
            ) : disbursements.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="xl" fz="sm">No disbursements found</Text>
                </Table.Td>
              </Table.Tr>
            ) : disbursements.map((d) => {
              const settlement = payoutSettlementDisplay(d.settlementStatus, d.amountPaidOut, d.payoutStatus ?? d.scheduleStatus)
              const isSuccess = settlement.label === 'Settled'
              const isUpcoming = settlement.label === 'Upcoming' || settlement.label === 'Pending' || settlement.label === 'Processing'
              const isStuck = isUpcoming && d.payoutDate != null && new Date(d.payoutDate) < new Date()
              const amountNaira = d.amountPaidOut != null ? formatKobo(d.amountPaidOut) : null
              const canExtend = allowExtensions && d.scheduleStatus === 'UPCOMING' && d.payoutStatus == null && Date.parse(d.contributionDeadline) > Date.now()
              const dateStr = (d.processedAt ?? (isUpcoming ? d.payoutDate : null))
                ? new Date((d.processedAt ?? d.payoutDate) as string).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' })
                : '-'
              return (
                <Table.Tr key={d.cycleNumber} style={isStuck ? { background: '#fff5f5' } : isUpcoming ? { background: '#f0faf7' } : undefined}>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Avatar size={28} radius="xl" color="gray">{(d.recipientName || '?').charAt(0)}</Avatar>
                      <Box>
                        <Text fz="sm" fw={500}>{d.recipientName}</Text>
                        <Text fz="xs" c="dimmed">Cycle {d.cycleNumber}</Text>
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c={isUpcoming ? 'dimmed' : undefined}>
                      {amountNaira ?? 'Not settled'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      radius="sm"
                      style={{
                        background: isSuccess ? '#e6f5f1' : isStuck ? '#ffe3e3' : isUpcoming ? '#fdf3e7' : '#f1f3f5',
                        color: isSuccess ? PRIMARY : isStuck ? '#c92a2a' : isUpcoming ? '#e67e22' : '#868e96',
                        border: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {isSuccess ? 'Settled' : isStuck ? 'Overdue' : settlement.label}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text fz="sm">Wallet</Text></Table.Td>
                  <Table.Td><Text fz="sm" c={isUpcoming ? 'dimmed' : undefined}>{dateStr}</Text></Table.Td>
                  <Table.Td>
                    {canExtend && (
                      <Button
                        size="xs"
                        variant="light"
                        color="orange"
                        onClick={() => onExtendDeadline(d.cycleNumber)}
                      >
                        Extend Deadline
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table></div>
      </Paper>
    </Stack>
  )
}
