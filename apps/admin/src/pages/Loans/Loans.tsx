import { useState, useEffect } from 'react'
import { Text, Select, Loader, Stack, Paper, Group, Box, Badge, SimpleGrid } from '@mantine/core'
import {
  IconArrowLeft,
  IconShieldCheck,
  IconAlertTriangle,
  IconCheck,
  IconBackspace,
  IconUsers,
  IconCalendar,
  IconCash,
  IconClock,
  IconHistory,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import {
  listAllRoscaCircles,
  getLoanEligibility,
  getLoanStatus,
  getLoanHistory,
  applyForLoan,
  type RoscaCircle,
  type Loan,
  type LoanEligibility,
} from '@/utils/api'

type Step = 'overview' | 'form' | 'confirm' | 'pin' | 'processing' | 'success' | 'error'

const PRIMARY = '#0b6b55'
const SERVICE_FEE_RATE = 0.02

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2 })
}

function loanStatusColor(status: string) {
  const s = status?.toUpperCase()
  if (s === 'ACTIVE' || s === 'DISBURSED') return PRIMARY
  if (s === 'PENDING' || s === 'PROCESSING') return '#F59E0B'
  if (s === 'DEFAULTED' || s === 'FAILED') return '#EF4444'
  return '#6B7280'
}

export function Loans() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('overview')

  const [circles, setCircles] = useState<RoscaCircle[]>([])
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null)
  const [loanHistory, setLoanHistory] = useState<Loan[]>([])
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listAllRoscaCircles()
        .then((res) => {
          const arr = Array.isArray(res) ? res : ((res as Record<string, unknown>)?.data ?? []) as RoscaCircle[]
          setCircles(arr.filter((c) => ['ACTIVE', 'STARTED'].includes((c.status ?? '').toUpperCase())))
        })
        .catch(() => {}),
      getLoanStatus().then(setActiveLoan).catch(() => {}),
      getLoanHistory().then(setLoanHistory).catch(() => {}),
    ]).finally(() => setLoadingPage(false))
  }, [])

  const selectedCircle = circles.find((c) => c.id === selectedCircleId)
  const payoutAmount = eligibility?.expectedPayout ?? (selectedCircle ? Number(selectedCircle.contributionAmount) * (selectedCircle.maxSlots ?? 1) : 0)
  const feeRate = eligibility?.feeRate ?? SERVICE_FEE_RATE
  const serviceFee = Math.round(payoutAmount * feeRate)
  const disbursementAmount = payoutAmount - serviceFee

  async function handleCircleSelect(id: string | null) {
    setSelectedCircleId(id)
    setEligibility(null)
    if (!id) return
    setCheckingEligibility(true)
    try {
      const result = await getLoanEligibility(id)
      setEligibility(result)
    } catch {
      setEligibility({ eligible: false, reason: 'Could not check eligibility. Try again.' })
    } finally {
      setCheckingEligibility(false)
    }
  }

  async function submitLoan() {
    if (!selectedCircleId) return
    setStep('processing')
    setError(null)
    try {
      await applyForLoan({ circleId: selectedCircleId })
      setStep('success')
      getLoanStatus().then(setActiveLoan).catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loan application failed. Please try again.')
      setStep('error')
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) setTimeout(() => submitLoan(), 300)
    }
  }

  if (loadingPage) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader color={PRIMARY} />
      </Box>
    )
  }

  if (step === 'processing') {
    return (
      <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: `4px solid #E5E7EB`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <Text fw={500} fz={14} c="dimmed">Processing your early payout...</Text>
      </Box>
    )
  }

  if (step === 'success') {
    return (
      <Stack align="center" gap="lg" pt={64} style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#D1FAE5', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: PRIMARY, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={28} color="white" strokeWidth={3} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text fw={700} fz={22}>Early Payout Approved!</Text>
          <Text fw={400} fz={14} c="dimmed" mt={8}>
            ₦{fmt(disbursementAmount)} from <strong>{selectedCircle?.name}</strong> has been disbursed to your wallet.
          </Text>
        </div>
        <Stack gap="sm" style={{ width: '100%', maxWidth: 300 }}>
          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          <button onClick={() => navigate('/rosca/groups')} style={{ width: '100%', background: 'white', color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>View My Groups</button>
        </Stack>
      </Stack>
    )
  }

  if (step === 'error') {
    return (
      <Stack align="center" gap="lg" pt={64} style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#FEF2F2', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#EF4444', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconAlertTriangle size={28} color="white" />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text fw={700} fz={22}>Application Failed</Text>
          <Text fw={400} fz={14} c="dimmed" mt={8}>{error}</Text>
        </div>
        <Stack gap="sm" style={{ width: '100%', maxWidth: 300 }}>
          <button onClick={() => { setPin(''); setStep('pin') }} style={{ width: '100%', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
          <button onClick={() => { setPin(''); setStep('form') }} style={{ width: '100%', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack gap="lg" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>

      {/* ==================== OVERVIEW ==================== */}
      {step === 'overview' && (
        <>
          <Box>
            <Text fz={22} fw={700}>Early Payout (Loans)</Text>
            <Text fz="sm" c="dimmed" mt={4}>Get your ROSCA payout before your turn arrives</Text>
          </Box>

          {/* Stats */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Text fz="xs" c="dimmed">Active Loan</Text>
              <Text fz={20} fw={700} mt={4}>{activeLoan ? `₦${fmt(Number(activeLoan.disbursedAmount ?? activeLoan.amount))}` : '—'}</Text>
              {activeLoan && <Badge size="xs" mt={4} style={{ background: `${loanStatusColor(activeLoan.status)}15`, color: loanStatusColor(activeLoan.status), border: 'none' }}>{activeLoan.status}</Badge>}
            </Paper>
            <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Text fz="xs" c="dimmed">Total Loans</Text>
              <Text fz={20} fw={700} mt={4}>{loanHistory.length}</Text>
            </Paper>
            <Paper p="md" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Text fz="xs" c="dimmed">Active Groups</Text>
              <Text fz={20} fw={700} mt={4}>{circles.length}</Text>
            </Paper>
          </SimpleGrid>

          {/* Active loan detail */}
          {activeLoan && (
            <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
              <Group mb="md" gap="sm">
                <IconClock size={16} color="#F59E0B" />
                <Text fw={600} fz="sm">Active Loan Details</Text>
              </Group>
              <Stack gap="sm">
                {[
                  { label: 'Amount', value: `₦${fmt(Number(activeLoan.disbursedAmount ?? activeLoan.amount))}` },
                  { label: 'Status', value: activeLoan.status },
                  ...(activeLoan.dueDate ? [{ label: 'Due Date', value: new Date(activeLoan.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
                  ...(activeLoan.disbursedAt ? [{ label: 'Disbursed', value: new Date(activeLoan.disbursedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) }] : []),
                ].map(({ label, value }) => (
                  <Group key={label} justify="space-between" style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 8 }}>
                    <Text fz="sm" c="dimmed">{label}</Text>
                    <Text fz="sm" fw={500}>{value}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Apply button */}
          {!activeLoan && circles.length > 0 && (
            <button onClick={() => setStep('form')} style={{ width: '100%', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Request Early Payout
            </button>
          )}

          {!activeLoan && circles.length === 0 && (
            <Paper p="xl" radius="md" style={{ border: '1px solid #e9ecef', textAlign: 'center' }}>
              <IconAlertTriangle size={28} color="#F59E0B" style={{ marginBottom: 12 }} />
              <Text fw={600} fz="md" mb={8}>No Active Groups</Text>
              <Text fz="sm" c="dimmed" mb={16}>You need an active ROSCA group to request an early payout.</Text>
              <button onClick={() => navigate('/rosca/groups')} style={{ background: PRIMARY, color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View Groups</button>
            </Paper>
          )}

          {/* Loan History */}
          {loanHistory.length > 0 && (
            <Paper radius="md" style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
              <Box px="lg" py="md" style={{ borderBottom: '1px solid #e9ecef' }}>
                <Group gap="sm">
                  <IconHistory size={16} color="#6B7280" />
                  <Text fw={600} fz="sm">Loan History</Text>
                </Group>
              </Box>
              <Stack gap={0}>
                {loanHistory.map((loan, i) => (
                  <Box key={loan.id} px="lg" py="sm" style={{ borderBottom: i < loanHistory.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Text fz="sm" fw={500}>{loan.circleName ?? `Loan ${loan.id.slice(0, 8)}`}</Text>
                      <Text fz="xs" c="dimmed">{new Date(loan.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </Box>
                    <Box style={{ textAlign: 'right' }}>
                      <Text fz="sm" fw={600} style={{ color: PRIMARY }}>₦{fmt(Number(loan.disbursedAmount ?? loan.amount))}</Text>
                      <Badge size="xs" style={{ background: `${loanStatusColor(loan.status)}15`, color: loanStatusColor(loan.status), border: 'none' }}>{loan.status}</Badge>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* ==================== SELECT GROUP ==================== */}
      {step === 'form' && (
        <>
          <button onClick={() => setStep('overview')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
            <IconArrowLeft size={18} /> Back
          </button>

          <Box>
            <Text fz={22} fw={700}>Request Early Payout</Text>
            <Text fz="sm" c="dimmed" mt={4}>Select an active ROSCA group</Text>
          </Box>

          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Text fw={600} fz="sm" mb="sm">Select ROSCA Group</Text>
            <Select
              data={circles.map((c) => ({ value: c.id, label: c.name }))}
              value={selectedCircleId}
              onChange={handleCircleSelect}
              placeholder="Choose a group"
              radius="md" size="md"
              styles={{ input: { borderColor: '#dee2e6', fontSize: 14, height: 48 } }}
            />
            {checkingEligibility && (
              <Group mt="sm" gap="xs">
                <Loader size={14} color={PRIMARY} />
                <Text fz="xs" c="dimmed">Checking eligibility...</Text>
              </Group>
            )}
          </Paper>

          {eligibility && !checkingEligibility && (
            <>
              {!eligibility.eligible ? (
                <Paper p="md" radius="md" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <Group gap="sm">
                    <IconAlertTriangle size={16} color="#EF4444" />
                    <Text fz="sm" style={{ color: '#B91C1C' }}>{eligibility.reason ?? 'Not eligible for this group.'}</Text>
                  </Group>
                </Paper>
              ) : (
                <>
                  {selectedCircle && (
                    <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
                      <Text fw={600} fz="sm" mb="md">{selectedCircle.name}</Text>
                      <SimpleGrid cols={2} spacing="sm">
                        {[
                          { icon: IconUsers, label: 'Members', value: `${selectedCircle.filledSlots}/${selectedCircle.maxSlots}` },
                          { icon: IconCalendar, label: 'Frequency', value: selectedCircle.frequency ?? '—' },
                          { icon: IconCash, label: 'Contribution', value: `₦${Number(selectedCircle.contributionAmount).toLocaleString()}` },
                          { icon: IconShieldCheck, label: 'Eligible', value: 'Yes', green: true },
                        ].map(({ icon: Icon, label, value, green }) => (
                          <Paper key={label} p="sm" radius="md" style={{ background: '#F9FAFB' }}>
                            <Group gap="sm">
                              <Icon size={18} color={green ? PRIMARY : '#6B7280'} />
                              <Box>
                                <Text fz={11} c="dimmed">{label}</Text>
                                <Text fz="sm" fw={600} style={green ? { color: PRIMARY } : {}}>{value}</Text>
                              </Box>
                            </Group>
                          </Paper>
                        ))}
                      </SimpleGrid>
                    </Paper>
                  )}

                  <Paper p="lg" radius="md" style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                    <Text fw={600} fz="sm" mb="sm">Early Payout Breakdown</Text>
                    <Stack gap="sm">
                      <Group justify="space-between"><Text fz="sm" c="dimmed">Payout Amount</Text><Text fz="sm" fw={600}>₦{fmt(payoutAmount)}</Text></Group>
                      <Group justify="space-between"><Text fz="sm" c="dimmed">Service Fee ({(feeRate * 100).toFixed(0)}%)</Text><Text fz="sm" fw={600} style={{ color: '#EF4444' }}>-₦{fmt(serviceFee)}</Text></Group>
                      <Box style={{ borderTop: '1px solid #D1FAE5', paddingTop: 12 }}>
                        <Group justify="space-between">
                          <Text fz="sm" fw={600}>You'll Receive</Text>
                          <Text fz={16} fw={700} style={{ color: PRIMARY }}>₦{fmt(disbursementAmount)}</Text>
                        </Group>
                      </Box>
                    </Stack>
                  </Paper>
                </>
              )}
            </>
          )}

          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedCircleId || !eligibility?.eligible || checkingEligibility}
            style={{ width: '100%', background: selectedCircleId && eligibility?.eligible && !checkingEligibility ? PRIMARY : '#9CA3AF', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: selectedCircleId && eligibility?.eligible ? 'pointer' : 'not-allowed' }}
          >
            Proceed
          </button>
        </>
      )}

      {/* ==================== CONFIRMATION ==================== */}
      {step === 'confirm' && selectedCircle && (
        <>
          <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
            <IconArrowLeft size={18} /> Back
          </button>

          <Box>
            <Text fz={22} fw={700}>Confirm Early Payout</Text>
            <Text fz="sm" c="dimmed" mt={4}>Review before proceeding</Text>
          </Box>

          <Paper p="lg" radius="md" style={{ border: '1px solid #e9ecef' }}>
            <Stack gap="md">
              {[
                { label: 'ROSCA Group', value: selectedCircle.name },
                { label: 'Payout Amount', value: `₦${fmt(payoutAmount)}` },
                { label: `Service Fee (${(feeRate * 100).toFixed(0)}%)`, value: `-₦${fmt(serviceFee)}`, red: true },
                { label: 'Contribution', value: `₦${Number(selectedCircle.contributionAmount).toLocaleString()} / ${(selectedCircle.frequency ?? '').toLowerCase()}` },
              ].map(({ label, value, red }) => (
                <Group key={label} justify="space-between" style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12 }}>
                  <Text fz="sm" c="dimmed">{label}</Text>
                  <Text fz="sm" fw={500} style={red ? { color: '#EF4444' } : {}}>{value}</Text>
                </Group>
              ))}
              <Group justify="space-between">
                <Text fz="sm" fw={600}>You'll Receive Now</Text>
                <Text fz={18} fw={700} style={{ color: PRIMARY }}>₦{fmt(disbursementAmount)}</Text>
              </Group>
            </Stack>
          </Paper>

          <button onClick={() => setStep('pin')} style={{ width: '100%', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Confirm Early Payout
          </button>
        </>
      )}

      {/* ==================== PIN ENTRY ==================== */}
      {step === 'pin' && (
        <Stack align="center" gap="xl" pt="xl">
          <button onClick={() => { setStep('confirm'); setPin('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151', alignSelf: 'flex-start' }}>
            <IconArrowLeft size={18} /> Back
          </button>

          <Box style={{ textAlign: 'center' }}>
            <Text fw={700} fz={22}>Enter Your PIN</Text>
            <Text fz="sm" c="dimmed" mt={4}>Enter your 4-digit transaction PIN</Text>
          </Box>

          <Group gap="md">
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} style={{ width: 56, height: 56, borderRadius: 12, border: `2px solid ${i < pin.length ? PRIMARY : '#E5E7EB'}`, background: i < pin.length ? '#F0FDF4' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i < pin.length && <div style={{ width: 12, height: 12, borderRadius: '50%', background: PRIMARY }} />}
              </Box>
            ))}
          </Group>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: 280 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
              if (key === '') return <div key="empty" />
              if (key === 'back') return (
                <button key="back" onClick={() => setPin((p) => p.slice(0, -1))} style={{ height: 64, borderRadius: 16, background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconBackspace size={22} color="#374151" />
                </button>
              )
              return (
                <button key={key} onClick={() => handlePinDigit(key)} style={{ height: 64, borderRadius: 16, background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 600, color: '#0F172A' }}>
                  {key}
                </button>
              )
            })}
          </div>
        </Stack>
      )}
    </Stack>
  )
}
