import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Divider,
  Group,
  JsonInput,
  Loader,
  NumberInput,
  Paper,
  Progress,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconFlask,
  IconPlayerPlay,
  IconRefresh,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import {
  runAutoSimulation,
  runManualSimulation,
  sandboxCreateUsers,
  sandboxCreateCircle,
  sandboxRunCycle,
  sandboxApplyLoan,
  sandboxInspectLedger,
  sandboxReconcile,
  sandboxReset,
  type AutoSimResult,
  type SimResult,
  type SandboxUsersResult,
  type SandboxCircleResult,
  type SandboxCycleResult,
  type LedgerInspectResult,
  type ReconcileRunResult,
} from '@/utils/api'

// ── helpers ───────────────────────────────────────────────────────────────────

function scoreColor(display: number) {
  if (display >= 750) return 'green'
  if (display >= 650) return 'teal'
  if (display >= 550) return 'yellow'
  if (display >= 450) return 'orange'
  return 'red'
}

function formatKobo(kobo: string | number) {
  const n = typeof kobo === 'string' ? parseFloat(kobo) : kobo
  if (isNaN(n)) return '₦0.00'
  return `₦${(n / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

// ── SimResultCard ─────────────────────────────────────────────────────────────

function SimResultCard({ label, result }: { label: string; result: SimResult }) {
  return (
    <Card withBorder radius="md" p="md">
      <Text fw={700} mb="sm">{label}</Text>

      <Text size="xs" c="dimmed" fw={600} mb={4}>Final Scores</Text>
      <Group gap="xs" mb="md" wrap="wrap">
        {result.finalScores.map((m) => (
          <Badge key={m.label} color={scoreColor(m.finalDisplay)} variant="light" size="md">
            {m.label}: {m.finalDisplay}
          </Badge>
        ))}
      </Group>

      <Text size="xs" c="dimmed" fw={600} mb={4}>Event Log</Text>
      <ScrollArea h={200}>
        <Stack gap={4}>
          {result.events.map((e, i) => (
            <Paper key={i} withBorder p="xs" radius="sm">
              <Group justify="space-between" mb={2}>
                <Text size="xs" fw={600}>{e.cycle}</Text>
                <Text size="xs" c="dimmed">{e.event}</Text>
              </Group>
              <Group gap={6} wrap="wrap">
                {e.scores.map((s) => (
                  <Badge key={s.memberLabel} size="xs" color={scoreColor(s.display)} variant="dot">
                    {s.memberLabel}: {s.display}
                  </Badge>
                ))}
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  )
}

// ── Auto Sim Tab ──────────────────────────────────────────────────────────────

function AutoSimTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AutoSimResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await runAutoSimulation()
      setResult(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Text fw={600} mb={4}>3-Circle Auto Simulation</Text>
        <Text size="sm" c="dimmed" mb="md">
          Runs three pre-configured ROSCA circles in sequence — best case (Circle A), mixed (Circle B), and worst case (Circle C). All data is ephemeral and deleted automatically.
        </Text>
        <Group gap="xs" mb="md" wrap="wrap">
          <Badge color="green" variant="light">Circle A — Best case: all on-time</Badge>
          <Badge color="yellow" variant="light">Circle B — Mixed: late + missed + malicious rating</Badge>
          <Badge color="red" variant="light">Circle C — Worst: defaults + post-payout default + loan</Badge>
        </Group>
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          loading={loading}
          onClick={handleRun}
        >
          Run Auto Simulation
        </Button>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      {loading && (
        <Group justify="center" py="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Running simulation…</Text>
        </Group>
      )}

      {result && (
        <Stack gap="md">
          <Text size="xs" c="dimmed">Run ID: <Code>{result.runId}</Code></Text>
          <SimResultCard label="Circle A — Best Case" result={result.circleA} />
          <SimResultCard label="Circle B — Mixed" result={result.circleB} />
          <SimResultCard label="Circle C — Worst Case" result={result.circleC} />
        </Stack>
      )}
    </Stack>
  )
}

// ── Manual Sim Tab ────────────────────────────────────────────────────────────

const MANUAL_EXAMPLE: string = JSON.stringify({
  circleName: 'Test Circle',
  contributionAmountKobo: 100000,
  maxSlots: 3,
  frequency: 'MONTHLY',
  payoutLogic: 'SEQUENTIAL',
  members: [
    { label: 'Alice', payoutPosition: 1 },
    { label: 'Bob', payoutPosition: 2 },
    { label: 'Carol', payoutPosition: 3 },
  ],
  cycles: [
    {
      cycleNumber: 1,
      contributions: [
        { member: 'Alice', timing: 'on_time' },
        { member: 'Bob', timing: 'late' },
        { member: 'Carol', timing: 'on_time' },
      ],
    },
    {
      cycleNumber: 2,
      contributions: [
        { member: 'Alice', timing: 'on_time' },
        { member: 'Bob', timing: 'on_time' },
        { member: 'Carol', timing: 'missed' },
      ],
    },
    {
      cycleNumber: 3,
      contributions: [
        { member: 'Alice', timing: 'on_time' },
        { member: 'Bob', timing: 'on_time' },
        { member: 'Carol', timing: 'on_time' },
      ],
    },
  ],
  peerReviews: [
    { reviewer: 'Alice', reviewee: 'Bob', rating: 3 },
    { reviewer: 'Carol', reviewee: 'Alice', rating: 5 },
  ],
}, null, 2)

function ManualSimTab() {
  const [body, setBody] = useState(MANUAL_EXAMPLE)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const dto = JSON.parse(body)
      const res = await runManualSimulation(dto)
      setResult(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Text fw={600} mb={4}>Manual Simulation</Text>
        <Text size="sm" c="dimmed" mb="md">
          Configure your own circle, member labels, per-cycle contribution timing, and optional peer reviews. Edit the JSON below then run.
        </Text>
        <JsonInput
          value={body}
          onChange={setBody}
          minRows={20}
          formatOnBlur
          validationError="Invalid JSON"
          radius="md"
          styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
        />
        <Button
          leftSection={<IconPlayerPlay size={16} />}
          loading={loading}
          onClick={handleRun}
          mt="sm"
        >
          Run Manual Simulation
        </Button>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      {result && <SimResultCard label="Result" result={result} />}
    </Stack>
  )
}

// ── Sandbox Tab ───────────────────────────────────────────────────────────────

type SandboxStep = 'users' | 'circle' | 'cycles' | 'done'

function SandboxTab() {
  const [step, setStep] = useState<SandboxStep>('users')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Create Users
  const [userCount, setUserCount] = useState<number | string>(4)
  const [fundAmount, setFundAmount] = useState<number | string>(5000000)
  const [usersResult, setUsersResult] = useState<SandboxUsersResult | null>(null)

  // Step 2 — Create Circle
  const [circleName, setCircleName] = useState('Sandbox Circle')
  const [contributionKobo, setContributionKobo] = useState<number | string>(100000)
  const [frequency, setFrequency] = useState<string>('MONTHLY')
  const [payoutLogic, setPayoutLogic] = useState<string>('SEQUENTIAL')
  const [circleResult, setCircleResult] = useState<SandboxCircleResult | null>(null)

  // Step 3 — Cycles
  const [cycleNumber, setCycleNumber] = useState(1)
  const [memberTimings, setMemberTimings] = useState<Record<string, 'on_time' | 'late' | 'skip'>>({})
  const [cycleResults, setCycleResults] = useState<SandboxCycleResult[]>([])

  // Loan
  const [loanUserId, setLoanUserId] = useState('')
  const [loanLoading, setLoanLoading] = useState(false)
  const [loanDone, setLoanDone] = useState(false)

  // Ledger / Reconcile
  const [ledgerWalletId, setLedgerWalletId] = useState('')
  const [ledgerResult, setLedgerResult] = useState<LedgerInspectResult | null>(null)
  const [reconcileResult, setReconcileResult] = useState<ReconcileRunResult | null>(null)

  function reset() {
    setStep('users')
    setUsersResult(null)
    setCircleResult(null)
    setCycleResults([])
    setCycleNumber(1)
    setMemberTimings({})
    setLoanDone(false)
    setLedgerResult(null)
    setReconcileResult(null)
    setError(null)
  }

  async function handleCreateUsers() {
    setLoading(true); setError(null)
    try {
      const res = await sandboxCreateUsers({
        count: Number(userCount),
        fundAmountKobo: Number(fundAmount),
      })
      setUsersResult(res.data)
      const timings: Record<string, 'on_time' | 'late' | 'skip'> = {}
      res.data.users.forEach((u) => { timings[u.id] = 'on_time' })
      setMemberTimings(timings)
      setStep('circle')
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function handleCreateCircle() {
    if (!usersResult) return
    setLoading(true); setError(null)
    try {
      const res = await sandboxCreateCircle({
        runId: usersResult.runId,
        memberIds: usersResult.users.map((u) => u.id),
        name: circleName,
        contributionAmountKobo: Number(contributionKobo),
        frequency,
        payoutLogic,
      })
      setCircleResult(res.data)
      setStep('cycles')
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function handleRunCycle() {
    if (!circleResult || !usersResult) return
    setLoading(true); setError(null)
    try {
      const res = await sandboxRunCycle({
        circleId: circleResult.circleId,
        cycleNumber,
        contributions: usersResult.users.map((u) => ({
          userId: u.id,
          timing: memberTimings[u.id] ?? 'on_time',
        })),
      })
      setCycleResults((prev) => [...prev, res.data])
      setCycleNumber((n) => n + 1)
      if (res.data.payout.isLastCycle) setStep('done')
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function handleApplyLoan() {
    if (!circleResult || !loanUserId) return
    setLoanLoading(true); setError(null)
    try {
      await sandboxApplyLoan({ userId: loanUserId, circleId: circleResult.circleId })
      setLoanDone(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoanLoading(false) }
  }

  async function handleLedger() {
    if (!ledgerWalletId.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await sandboxInspectLedger(ledgerWalletId.trim())
      setLedgerResult(res.data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function handleReconcile() {
    if (!usersResult) return
    setLoading(true); setError(null)
    try {
      const res = await sandboxReconcile(usersResult.runId)
      setReconcileResult(res.data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function handleReset() {
    if (!usersResult) { reset(); return }
    setLoading(true); setError(null)
    try {
      await sandboxReset(usersResult.runId)
      reset()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  const users = usersResult?.users ?? []

  return (
    <Stack gap="md">
      {/* Progress header */}
      <Paper withBorder radius="md" p="md">
        <Group justify="space-between">
          <Group gap="xs">
            {(['users', 'circle', 'cycles', 'done'] as SandboxStep[]).map((s, i) => (
              <Badge
                key={s}
                color={step === s ? 'teal' : ((['users', 'circle', 'cycles', 'done'] as SandboxStep[]).indexOf(step) > i ? 'green' : 'gray')}
                variant={step === s ? 'filled' : 'light'}
                size="sm"
              >
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </Badge>
            ))}
          </Group>
          {usersResult && (
            <Group gap="xs">
              <Text size="xs" c="dimmed">Run: <Code>{usersResult.runId}</Code></Text>
              <Button size="xs" color="red" variant="subtle" leftSection={<IconTrash size={12} />} onClick={handleReset} loading={loading}>
                Reset
              </Button>
            </Group>
          )}
        </Group>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
          {error}
        </Alert>
      )}

      {/* Step 1: Create Users */}
      <Paper withBorder radius="md" p="md">
        <Group gap="xs" mb="sm">
          {step !== 'users' ? <IconCircleCheck size={18} color="green" /> : <IconFlask size={18} />}
          <Text fw={600} size="sm">Step 1 — Create Sandbox Users</Text>
        </Group>
        {!usersResult ? (
          <Stack gap="sm">
            <Group gap="sm">
              <NumberInput label="Number of users" value={userCount} onChange={setUserCount} min={2} max={20} style={{ width: 160 }} size="sm" radius="md" />
              <NumberInput label="Fund per user (kobo)" value={fundAmount} onChange={setFundAmount} min={1} style={{ width: 200 }} size="sm" radius="md" />
            </Group>
            <Text size="xs" c="dimmed">{formatKobo(Number(fundAmount))} per user</Text>
            <Button size="sm" loading={loading && step === 'users'} onClick={handleCreateUsers} style={{ width: 'fit-content' }}>
              Create Users
            </Button>
          </Stack>
        ) : (
          <Stack gap="xs">
            <Text size="xs" c="dimmed">Created {users.length} users</Text>
            <Table.ScrollContainer minWidth={600}>
            <Table withTableBorder withColumnBorders fz="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>Wallet ID</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.label}</Table.Td>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td><Code style={{ fontSize: 10 }}>{u.id}</Code></Table.Td>
                    <Table.Td><Code style={{ fontSize: 10 }}>{u.walletId}</Code></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            </Table.ScrollContainer>
          </Stack>
        )}
      </Paper>

      {/* Step 2: Create Circle */}
      {(step === 'circle' || step === 'cycles' || step === 'done') && (
        <Paper withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            {(step === 'cycles' || step === 'done') ? <IconCircleCheck size={18} color="green" /> : <IconFlask size={18} />}
            <Text fw={600} size="sm">Step 2 — Create Circle</Text>
          </Group>
          {!circleResult ? (
            <Stack gap="sm">
              <Group gap="sm" wrap="wrap">
                <TextInput label="Circle name" value={circleName} onChange={(e) => setCircleName(e.currentTarget.value)} size="sm" radius="md" style={{ width: 200 }} />
                <NumberInput label="Contribution (kobo)" value={contributionKobo} onChange={setContributionKobo} min={1} size="sm" radius="md" style={{ width: 180 }} />
                <Select label="Frequency" data={['WEEKLY', 'BI_WEEKLY', 'MONTHLY']} value={frequency} onChange={(v) => setFrequency(v ?? 'MONTHLY')} size="sm" radius="md" style={{ width: 150 }} />
                <Select label="Payout logic" data={['SEQUENTIAL', 'RANDOM_DRAW', 'TRUST_SCORE', 'COMBINED', 'ADMIN_ASSIGNED']} value={payoutLogic} onChange={(v) => setPayoutLogic(v ?? 'SEQUENTIAL')} size="sm" radius="md" style={{ width: 180 }} />
              </Group>
              <Text size="xs" c="dimmed">{formatKobo(Number(contributionKobo))} per cycle · all {users.length} users added as members</Text>
              <Button size="sm" loading={loading && step === 'circle'} onClick={handleCreateCircle} style={{ width: 'fit-content' }}>
                Create &amp; Activate Circle
              </Button>
            </Stack>
          ) : (
            <Stack gap="xs">
              <Group gap="xs">
                <Badge color="green" variant="light">Circle ID: {circleResult.circleId.slice(0, 8)}…</Badge>
                <Badge color="blue" variant="light">{circleResult.durationCycles} cycles</Badge>
              </Group>
            </Stack>
          )}
        </Paper>
      )}

      {/* Step 3: Cycles */}
      {(step === 'cycles' || step === 'done') && circleResult && (
        <Paper withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            {step === 'done' ? <IconCircleCheck size={18} color="green" /> : <IconFlask size={18} />}
            <Text fw={600} size="sm">Step 3 — Run Cycles</Text>
          </Group>

          {/* Loan tool */}
          <Paper withBorder radius="sm" p="sm" mb="sm" bg="gray.0">
            <Text size="xs" fw={600} mb="xs">Apply Loan (optional — run before cycle where user receives payout)</Text>
            <Group gap="sm">
              <Select
                placeholder="Select user..."
                data={users.map((u) => ({ value: u.id, label: u.label }))}
                value={loanUserId}
                onChange={(v) => setLoanUserId(v ?? '')}
                size="xs"
                radius="md"
                style={{ width: 180 }}
              />
              <Button size="xs" loading={loanLoading} disabled={!loanUserId || loanDone} onClick={handleApplyLoan}
                color={loanDone ? 'green' : 'blue'}
                leftSection={loanDone ? <IconCheck size={12} /> : undefined}
              >
                {loanDone ? 'Loan Applied' : 'Apply Loan'}
              </Button>
            </Group>
          </Paper>

          {step === 'cycles' && (
            <Stack gap="sm">
              <Text size="sm" fw={600}>Cycle {cycleNumber} of {circleResult.durationCycles}</Text>
              <Progress value={(cycleNumber - 1) / circleResult.durationCycles * 100} size="sm" radius="xl" color="teal" />
              <Stack gap="xs">
                {users.map((u) => (
                  <Group key={u.id} gap="sm">
                    <Text size="sm" style={{ width: 100 }}>{u.label}</Text>
                    <Select
                      data={[
                        { value: 'on_time', label: 'On Time' },
                        { value: 'late', label: 'Late' },
                        { value: 'skip', label: 'Skip (Missed)' },
                      ]}
                      value={memberTimings[u.id] ?? 'on_time'}
                      onChange={(v) => setMemberTimings((prev) => ({ ...prev, [u.id]: (v ?? 'on_time') as 'on_time' | 'late' | 'skip' }))}
                      size="sm"
                      radius="md"
                      style={{ width: 180 }}
                    />
                  </Group>
                ))}
              </Stack>
              <Button
                size="sm"
                loading={loading}
                onClick={handleRunCycle}
                style={{ width: 'fit-content' }}
                leftSection={<IconPlayerPlay size={14} />}
              >
                Run Cycle {cycleNumber}
              </Button>
            </Stack>
          )}

          {step === 'done' && (
            <Alert color="green" radius="md" variant="light" icon={<IconCheck size={14} />}>
              All {circleResult.durationCycles} cycles complete.
            </Alert>
          )}

          {/* Cycle results */}
          {cycleResults.length > 0 && (
            <Stack gap="xs" mt="md">
              <Divider label="Cycle Results" labelPosition="left" />
              {cycleResults.map((cr) => (
                <Paper key={cr.cycleNumber} withBorder radius="sm" p="sm">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={600}>Cycle {cr.cycleNumber}</Text>
                    <Group gap="xs">
                      <Badge size="xs" color="blue" variant="light">
                        Payout → {users.find((u) => u.id === cr.payout.recipientId)?.label ?? cr.payout.recipientId.slice(0, 8)}
                      </Badge>
                      <Badge size="xs" color="teal" variant="light">{formatKobo(cr.payout.amount)}</Badge>
                      {cr.payout.isLastCycle && <Badge size="xs" color="grape" variant="filled">Final</Badge>}
                    </Group>
                  </Group>
                  <Group gap="xs" wrap="wrap">
                    {cr.members.map((m) => {
                      const label = users.find((u) => u.id === m.userId)?.label ?? m.userId.slice(0, 6)
                      return (
                        <Tooltip key={m.userId} label={`ATI: ${m.trustScore.display}`}>
                          <Badge
                            size="xs"
                            color={m.timing === 'on_time' ? 'green' : m.timing === 'late' ? 'orange' : 'red'}
                            variant="light"
                          >
                            {label}: {m.timing} · {m.trustScore.display}
                          </Badge>
                        </Tooltip>
                      )
                    })}
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Ledger inspect + Reconcile — available once circle exists */}
      {circleResult && (
        <Paper withBorder radius="md" p="md">
          <Text fw={600} size="sm" mb="sm">Inspect &amp; Reconcile</Text>
          <Stack gap="sm">
            {/* Ledger */}
            <Group gap="sm" align="flex-end">
              <Select
                label="Wallet to inspect"
                placeholder="Pick a user..."
                data={users.map((u) => ({ value: u.walletId, label: u.label }))}
                value={ledgerWalletId}
                onChange={(v) => setLedgerWalletId(v ?? '')}
                size="sm"
                radius="md"
                style={{ width: 200 }}
              />
              <Button size="sm" variant="outline" loading={loading} disabled={!ledgerWalletId} onClick={handleLedger}>
                Inspect Ledger
              </Button>
            </Group>

            {ledgerResult && (
              <Paper withBorder radius="sm" p="sm" bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color={ledgerResult.isReconciled ? 'green' : 'red'} variant="filled" size="sm">
                    {ledgerResult.isReconciled ? 'Reconciled' : 'DISCREPANCY'}
                  </Badge>
                  <Text size="xs" c="dimmed">{ledgerResult.entryCount} entries · reported: {formatKobo(ledgerResult.reportedBalance)} · computed: {formatKobo(ledgerResult.computedBalance)}</Text>
                </Group>
                <ScrollArea h={180}>
                  <Table fz="xs" withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Balance After</Table.Th>
                        <Table.Th>Source</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {ledgerResult.entries.map((e) => (
                        <Table.Tr key={e.id}>
                          <Table.Td>
                            <Badge size="xs" color={e.entryType === 'CREDIT' ? 'green' : 'red'} variant="light">{e.movementType || e.entryType}</Badge>
                          </Table.Td>
                          <Table.Td>{formatKobo(e.amount)}</Table.Td>
                          <Table.Td>{formatKobo(e.balanceAfter)}</Table.Td>
                          <Table.Td>{e.sourceType}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            )}

            {/* Reconcile all */}
            <Group gap="sm">
              <Button size="sm" variant="outline" leftSection={<IconRefresh size={14} />} loading={loading} onClick={handleReconcile}>
                Reconcile All Wallets
              </Button>
            </Group>

            {reconcileResult && (
              <Paper withBorder radius="sm" p="sm" bg="gray.0">
                <Group gap="xs" mb="xs">
                  <Badge color={reconcileResult.allReconciled ? 'green' : 'red'} variant="filled" size="sm">
                    {reconcileResult.allReconciled ? 'All Reconciled' : 'Discrepancies Found'}
                  </Badge>
                </Group>
                <Stack gap={4}>
                  {reconcileResult.wallets.map((w) => (
                    <Group key={w.walletId} gap="xs">
                      {w.isReconciled
                        ? <IconCheck size={14} color="green" />
                        : <IconX size={14} color="red" />}
                      <Text size="xs">{users.find((u) => u.walletId === w.walletId)?.label ?? w.userId.slice(0, 8)}</Text>
                      <Text size="xs" c="dimmed">{w.entryCount} entries · {formatKobo(w.reportedBalance)}</Text>
                      {!w.isReconciled && (
                        <Badge size="xs" color="red" variant="light">Δ {formatKobo(w.discrepancy)}</Badge>
                      )}
                    </Group>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Simulations() {
  return (
    <Stack gap="lg" p="xl">
      <div>
        <Title order={2} fw={700}>Simulations</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Test ROSCA behaviour and trust scoring without touching production data.
        </Text>
      </div>

      <Tabs defaultValue="auto" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="auto" leftSection={<IconPlayerPlay size={14} />}>Auto Simulation</Tabs.Tab>
          <Tabs.Tab value="manual" leftSection={<IconFlask size={14} />}>Manual Simulation</Tabs.Tab>
          <Tabs.Tab value="sandbox" leftSection={<IconFlask size={14} />}>Sandbox</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="auto"><AutoSimTab /></Tabs.Panel>
        <Tabs.Panel value="manual"><ManualSimTab /></Tabs.Panel>
        <Tabs.Panel value="sandbox"><SandboxTab /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}

export default Simulations
