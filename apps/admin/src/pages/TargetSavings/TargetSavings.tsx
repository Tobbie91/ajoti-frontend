import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Accordion,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  List,
  Modal,
  NumberInput,
  Progress,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconPlus,
  IconShare,
  IconUsers,
} from "@tabler/icons-react";
import {
  contributeTargetSavings,
  createTargetSavings,
  getMyTargetSavings,
  getPublicTargetSavings,
  joinTargetSavings,
  type TargetSavingsPlan,
} from "@/utils/targetSavingsApi";
import { getKycStatus } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { CowrywiseTestMode } from "./CowrywiseTestMode";
import { isDevAuthBypass } from "@/utils/dev-auth-bypass";

const toNaira = (k: string) => Number(k || 0) / 100;
const money = (k: string) =>
  `₦${toNaira(k).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function countPeriods(maturityDate: string, frequency: string) {
  if (!maturityDate) return 0;
  const startDate = new Date();
  const maturity = new Date(`${maturityDate}T23:59:59`);
  if (Number.isNaN(maturity.getTime()) || maturity <= startDate) return 0;

  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const end = Date.UTC(maturity.getUTCFullYear(), maturity.getUTCMonth(), maturity.getUTCDate());
  const diffDays = Math.max(1, Math.ceil((end - start) / 86_400_000));

  if (frequency === "DAILY") return diffDays;
  if (frequency === "WEEKLY") return Math.max(1, Math.ceil(diffDays / 7));

  let months =
    (maturity.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (maturity.getUTCMonth() - startDate.getUTCMonth());
  if (maturity.getUTCDate() > startDate.getUTCDate()) months += 1;
  return Math.max(1, months);
}

function GroupRules({ plan }: { plan?: TargetSavingsPlan | null }) {
  return (
    <Stack gap="xs">
      {plan && (
        <Card withBorder padding="sm">
          <Text fw={700}>{plan.name}</Text>
          <Text size="sm" c="dimmed">
            {money(plan.contributionAmountKobo)} {plan.frequency.toLowerCase()} · Personal target {money(plan.targetAmountKobo)}
          </Text>
          <Text size="xs" c="dimmed" mt={3}>
            {plan.memberCount} member{plan.memberCount === 1 ? "" : "s"} · Matures {new Date(plan.maturityDate).toLocaleDateString()}
          </Text>
        </Card>
      )}
      <List spacing="xs" size="sm">
        <List.Item>Each member has the same personal savings target.</List.Item>
        <List.Item>You can contribute ahead of schedule or make multiple manual contributions.</List.Item>
        <List.Item>Ajoti does not automatically debit your wallet.</List.Item>
        <List.Item>Your savings remain locked until the maturity date, even if you finish early.</List.Item>
        <List.Item>Early withdrawal is not currently available.</List.Item>
      </List>
    </Stack>
  );
}

function LocalReviewSavingsCard() {
  const [saved, setSaved] = useState(1000);
  const [available, setAvailable] = useState(5000);
  const [amount, setAmount] = useState(2500);
  const [open, setOpen] = useState(false);
  const progress = Math.round((saved / 10000) * 100);

  const addMoney = () => {
    const value = Math.min(Math.max(0, amount), available);
    if (!value) return;
    setSaved((current) => current + value);
    setAvailable((current) => current - value);
    setOpen(false);
  };

  return (
    <Card withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge color="green" variant="light" mb="xs">Active savings</Badge>
          <Title order={3}>Cowrywise E2E Test</Title>
          <Text size="sm" c="dimmed" mt={4}>A focused plan for reaching your savings goal.</Text>
        </div>
        <Text fw={700} c="teal">{progress}% complete</Text>
      </Group>

      <Group align="baseline" gap={6} mt="xl">
        <Text fw={800} fz={34}>₦{saved.toLocaleString("en-NG")}</Text>
        <Text c="dimmed">of ₦10,000</Text>
      </Group>
      <Progress value={progress} size="xl" radius="xl" mt="sm" color="teal" />
      <Group justify="space-between" mt="xs">
        <Text size="sm" c="dimmed">{progress}% complete</Text>
        <Text size="sm" fw={600}>₦{(10000 - saved).toLocaleString("en-NG")} remaining</Text>
      </Group>

      <Group grow mt="xl" align="flex-start">
        <div><Text size="xs" c="dimmed">Next contribution</Text><Text fw={700}>₦2,500 monthly</Text></div>
        <div><Text size="xs" c="dimmed">Matures</Text><Text fw={700}>24 Dec 2026</Text></div>
      </Group>

      <Button fullWidth size="md" mt="xl" onClick={() => setOpen(true)}>Add to savings</Button>

      <Card withBorder radius="md" p="md" mt="lg" bg="gray.0">
        <Text fw={700}>Your savings plan</Text>
        <Group grow mt="md" align="flex-start">
          <div><Text size="xs" c="dimmed">Savings type</Text><Text size="sm" fw={600}>90-day Locked Savings</Text></div>
          <div><Text size="xs" c="dimmed">Access</Text><Text size="sm" fw={600}>Locked until maturity</Text></div>
        </Group>
        <Group grow mt="md" align="flex-start">
          <div><Text size="xs" c="dimmed">Provider</Text><Text size="sm" fw={600}>Cowrywise</Text></div>
          <div><Text size="xs" c="dimmed">Interest</Text><Text size="sm" fw={600}>Rate unavailable in sandbox</Text></div>
        </Group>
        <Text size="xs" c="dimmed" mt="md">Your savings are held through Cowrywise. Ajoti will show the applicable rate and fees when the provider returns them.</Text>
      </Card>

      <div className="mt-5">
        <Text fw={700}>Recent activity</Text>
        <Group justify="space-between" mt="sm">
          <div><Text size="sm">₦1,000 added</Text><Text size="xs" c="dimmed">24 Sep 2026</Text></div>
          <Badge color="green" variant="light">Successful</Badge>
        </Group>
        {saved > 1000 && <Group justify="space-between" mt="sm"><div><Text size="sm">₦{(saved - 1000).toLocaleString("en-NG")} added</Text><Text size="xs" c="dimmed">Just now</Text></div><Badge color="green" variant="light">Successful</Badge></Group>}
      </div>

      <Modal opened={open} onClose={() => setOpen(false)} title="Add to your savings" centered>
        <Stack>
          <Text size="sm" c="dimmed">Available to save: ₦{available.toLocaleString("en-NG")}</Text>
          <NumberInput label="Amount" min={1} max={available} value={amount} onChange={(value) => setAmount(Number(value) || 0)} prefix="₦" thousandSeparator="," />
          <Text size="sm" c="dimmed">Suggested this month: ₦2,500</Text>
          <Alert color="blue" title="Before you continue">Your money will remain locked until 24 Dec 2026. Early withdrawal is not available.</Alert>
          <Button onClick={addMoney} disabled={amount <= 0 || amount > available}>Add money</Button>
        </Stack>
      </Modal>
    </Card>
  );
}

export function TargetSavings() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<TargetSavingsPlan[]>([]);
  const [pub, setPub] = useState<TargetSavingsPlan[]>([]);
  const [view, setView] = useState<"MINE" | "DISCOVER">("MINE");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"INTRO" | "FORM">("INTRO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [joinPlan, setJoinPlan] = useState<TargetSavingsPlan | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [privateInvite, setPrivateInvite] = useState<{ id: string; token: string } | null>(null);
  const [kycLevel, setKycLevel] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: "INDIVIDUAL",
    name: "",
    description: "",
    targetAmount: 100000,
    contributionAmount: 10000,
    frequency: "MONTHLY",
    maturityDate: "",
    isPublic: false,
  });

  const plannedContributionCount = useMemo(
    () => countPeriods(form.maturityDate, form.frequency),
    [form.maturityDate, form.frequency],
  );

  const calculatedIndividualContribution =
    plannedContributionCount > 0 && form.targetAmount > 0
      ? Math.ceil(form.targetAmount / plannedContributionCount)
      : 0;

  const calculatedGroupMemberTarget =
    plannedContributionCount > 0 && form.contributionAmount > 0
      ? form.contributionAmount * plannedContributionCount
      : 0;

  const load = () =>
    Promise.all([getMyTargetSavings(), getPublicTargetSavings()]).then(([m, p]) => {
      setPlans(m);
      setPub(p.filter((x) => !m.some((y) => y.id === x.id)));
    });

  useEffect(() => {
    load().catch(() => {});
    getKycStatus()
      .then((kyc) => setKycLevel(kyc.kycLevel ?? 0))
      .catch(() => setKycLevel(0));

    const params = new URLSearchParams(window.location.search);
    const id = params.get("targetInviteId");
    const token = params.get("targetInviteToken");
    if (id && token) setPrivateInvite({ id, token });
  }, []);

  const kycReady = (kycLevel ?? 0) >= 1;

  const clearInviteFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("targetInviteId");
    url.searchParams.delete("targetInviteToken");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const joinPublic = async () => {
    if (!joinPlan) return;
    setJoining(true);
    setJoinError("");
    try {
      await joinTargetSavings(joinPlan.id);
      setJoinPlan(null);
      setView("MINE");
      await load();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Unable to join this group");
    } finally {
      setJoining(false);
    }
  };

  const joinPrivate = async () => {
    if (!privateInvite) return;
    setJoining(true);
    setJoinError("");
    try {
      await joinTargetSavings(privateInvite.id, privateInvite.token);
      setPrivateInvite(null);
      clearInviteFromUrl();
      setView("MINE");
      await load();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Unable to join this private group");
    } finally {
      setJoining(false);
    }
  };

  const openCreate = () => {
    setError("");
    setStep("INTRO");
    setOpen(true);
  };

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const basePayload = {
        type: form.type as "INDIVIDUAL" | "GROUP",
        name: form.name,
        description: form.description || undefined,
        frequency: form.frequency as "DAILY" | "WEEKLY" | "MONTHLY",
        startDate: new Date().toISOString(),
        maturityDate: new Date(`${form.maturityDate}T23:59:59`).toISOString(),
        isPublic: form.type === "GROUP" ? form.isPublic : false,
      };

      await createTargetSavings(
        form.type === "GROUP"
          ? {
              ...basePayload,
              contributionAmountKobo: String(Math.round(form.contributionAmount * 100)),
            }
          : {
              ...basePayload,
              targetAmountKobo: String(Math.round(form.targetAmount * 100)),
            },
      );
      setOpen(false);
      setView("MINE");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create target");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <Group justify="space-between" mb="lg" align="flex-start">
        <div>
          <Title order={2}>Target Savings</Title>
          <Text c="dimmed">Save towards your own goal or stay accountable with a group.</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={!kycReady}>
          New target
        </Button>
      </Group>

      {kycLevel !== null && !kycReady && (
        <Alert mb="lg" color="yellow" icon={<IconInfoCircle size={18} />} title="Complete KYC Level 1 to use Target Savings">
          You can browse groups and view existing memberships, but you cannot create, join, or contribute until verification is complete.
          <Button ml="sm" size="xs" variant="light" onClick={() => navigate("/kyc")}>Complete KYC</Button>
        </Alert>
      )}

      <SegmentedControl
        mb="lg"
        value={view}
        onChange={(value) => setView(value as "MINE" | "DISCOVER")}
        data={[
          { value: "MINE", label: "My Savings" },
          { value: "DISCOVER", label: `Discover Groups${pub.length ? ` (${pub.length})` : ""}` },
        ]}
      />

      {view === "MINE" ? (
        <Stack gap="md">
          {isDevAuthBypass && plans.length === 0 && <LocalReviewSavingsCard />}
          {plans.length === 0 && (
            <Card withBorder style={{ display: isDevAuthBypass ? "none" : undefined }}>
              <Text fw={600}>No savings targets yet</Text>
              <Text size="sm" c="dimmed">Create an individual target, start a group target, or discover a public group.</Text>
              <Button variant="light" size="xs" mt="sm" onClick={() => setView("DISCOVER")}>Discover groups</Button>
            </Card>
          )}

          {plans.map((p) => (
            <CustomerTargetCard key={p.id} plan={p} onChanged={load} kycReady={kycReady} />
          ))}

          {isDevAuthBypass && (
            <Accordion variant="separated" mt="md">
              <Accordion.Item value="developer-tools">
                <Accordion.Control>Developer sandbox tools</Accordion.Control>
                <Accordion.Panel><CowrywiseTestMode plans={plans} /></Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}
        </Stack>
      ) : (
        <Stack gap="md">
          <div>
            <Title order={3}>Discover public groups</Title>
            <Text size="sm" c="dimmed">Browse active public Target Savings groups and review the rules before joining.</Text>
          </div>

          {pub.length === 0 ? (
            <Card withBorder>
              <Text fw={600}>No public groups available right now</Text>
              <Text size="sm" c="dimmed">Private groups can still be joined through an invitation link from their organiser.</Text>
            </Card>
          ) : (
            pub.map((p) => (
              <Card key={p.id} withBorder radius="md" p="lg">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs">
                      <Text fw={700} fz="lg">{p.name}</Text>
                      <Badge variant="light" color="green">Public</Badge>
                    </Group>
                    {p.description && <Text size="sm" mt={4}>{p.description}</Text>}
                    <Text size="sm" c="dimmed" mt="xs">
                      {p.memberCount} member{p.memberCount === 1 ? "" : "s"} · {money(p.contributionAmountKobo)} {p.frequency.toLowerCase()}
                    </Text>
                    <Text size="xs" c="dimmed" mt={3}>
                      Personal target {money(p.targetAmountKobo)} · Matures {new Date(p.maturityDate).toLocaleDateString()}
                    </Text>
                  </div>
                  <Button variant="light" leftSection={<IconUsers size={16} />} onClick={() => { setJoinError(""); setJoinPlan(p); }}>
                    View & join
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      )}

      <Modal opened={Boolean(joinPlan)} onClose={() => setJoinPlan(null)} title="Join public savings group" centered>
        <Stack>
          <Alert icon={<IconInfoCircle size={18} />} color="blue" title="Review before joining">
            Joining adds this group to My Savings and gives you the same personal target and maturity date as other members.
          </Alert>
          {!kycReady && (
            <Alert color="yellow" title="KYC Level 1 required">
              Complete identity verification before joining this group.
              <Button ml="sm" size="xs" variant="light" onClick={() => navigate("/kyc")}>Complete KYC</Button>
            </Alert>
          )}
          <GroupRules plan={joinPlan} />
          {joinError && <Alert color="red">{joinError}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setJoinPlan(null)}>Cancel</Button>
            <Button loading={joining} disabled={!kycReady} onClick={joinPublic}>Join group</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={Boolean(privateInvite)}
        onClose={() => { setPrivateInvite(null); clearInviteFromUrl(); }}
        title="You've been invited to a savings group"
        centered
      >
        <Stack>
          <Alert icon={<IconInfoCircle size={18} />} color="blue">
            This is a private Target Savings invitation. Review the rules before joining.
          </Alert>
          {!kycReady && (
            <Alert color="yellow" title="KYC Level 1 required">
              Complete identity verification before accepting this invitation.
              <Button ml="sm" size="xs" variant="light" onClick={() => navigate("/kyc")}>Complete KYC</Button>
            </Alert>
          )}
          <GroupRules />
          {joinError && <Alert color="red">{joinError}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { setPrivateInvite(null); clearInviteFromUrl(); }}>Not now</Button>
            <Button loading={joining} disabled={!kycReady} onClick={joinPrivate}>Join private group</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={step === "INTRO" ? "How Target Savings works" : "Create savings target"}
        centered
      >
        {step === "INTRO" ? (
          <Stack>
            <Alert icon={<IconInfoCircle size={18} />} title="Investment growth is not available yet" color="orange">
              Target Savings currently uses Ajoti&apos;s wallet-backed flow. Investment-backed growth remains disabled until provider operations and settlement are fully enabled.
            </Alert>
            <Alert icon={<IconInfoCircle size={18} />} title="Your money stays locked until maturity" color="blue">
              Reaching your target early does not unlock your savings. Early withdrawal is not currently available.
            </Alert>
            <List spacing="sm" size="sm">
              <List.Item>Choose a savings frequency and maturity date.</List.Item>
              <List.Item>Individual targets calculate a suggested contribution for you.</List.Item>
              <List.Item>Group organisers set the amount each member should contribute per interval.</List.Item>
              <List.Item>You may contribute more or less than the planned amount and may contribute multiple times.</List.Item>
              <List.Item>Contributions stop when your personal target is reached or the maturity date arrives, whichever comes first.</List.Item>
              <List.Item>At maturity, the amount you actually saved is released back to your Ajoti wallet.</List.Item>
            </List>
            <Button onClick={() => setStep("FORM")}>Set up a target</Button>
          </Stack>
        ) : (
          <Stack>
            <SegmentedControl
              value={form.type}
              onChange={(type) => setForm({ ...form, type })}
              data={[
                { label: "Individual", value: "INDIVIDUAL" },
                { label: "Group", value: "GROUP" },
              ]}
            />

            <TextInput label="Target name" value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
            <Textarea label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.currentTarget.value })} />

            {form.type === "INDIVIDUAL" ? (
              <NumberInput label="Target amount (₦)" min={1} value={form.targetAmount} onChange={(v) => setForm({ ...form, targetAmount: Number(v) || 0 })} thousandSeparator="," />
            ) : (
              <NumberInput
                label="Amount each member should save per interval (₦)"
                description="Members can contribute ahead of schedule, but each member has the same planned target."
                min={1}
                value={form.contributionAmount}
                onChange={(v) => setForm({ ...form, contributionAmount: Number(v) || 0 })}
                thousandSeparator="," />
            )}

            <Select
              label="How often?"
              description="This sets the savings plan and reminder cadence. Ajoti does not auto-debit your wallet."
              value={form.frequency}
              onChange={(v) => setForm({ ...form, frequency: v || "MONTHLY" })}
              data={[
                { value: "DAILY", label: "Daily" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
              ]}
            />

            <TextInput
              type="date"
              label="Maturity date"
              description="Your savings remain locked until this date even if you finish saving earlier."
              value={form.maturityDate}
              onChange={(e) => setForm({ ...form, maturityDate: e.currentTarget.value })}
            />

            {plannedContributionCount > 0 && (
              <Card withBorder padding="sm">
                <Text size="sm" fw={600}>Plan summary</Text>
                <Text size="sm" c="dimmed">{plannedContributionCount} planned {form.frequency.toLowerCase()} contribution{plannedContributionCount === 1 ? "" : "s"}.</Text>
                {form.type === "INDIVIDUAL" ? (
                  <Text size="sm" mt={4}>Suggested contribution: <strong>₦{calculatedIndividualContribution.toLocaleString("en-NG")}</strong> per interval</Text>
                ) : (
                  <Text size="sm" mt={4}>Planned target per member: <strong>₦{calculatedGroupMemberTarget.toLocaleString("en-NG")}</strong></Text>
                )}
              </Card>
            )}

            {form.type === "GROUP" && (
              <Switch
                label="Make this group public"
                description="Public groups appear in Discover Groups. Private groups can only be joined through an invitation link."
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.currentTarget.checked })}
              />
            )}


            <Divider />
            <Text size="xs" c="dimmed">No early withdrawal is available. Ajoti stops accepting contributions once you reach your personal target or the maturity date passes.</Text>
            {error && <Text c="red" size="sm">{error}</Text>}

            <Group justify="space-between">
              <Button variant="subtle" onClick={() => setStep("INTRO")}>Back</Button>
              <Button
                loading={busy}
                disabled={!form.name || !form.maturityDate || plannedContributionCount < 1 || (form.type === "INDIVIDUAL" ? form.targetAmount <= 0 : form.contributionAmount <= 0)}
                onClick={create}
              >Create target</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

function CustomerTargetCard({ plan, onChanged, kycReady }: { plan: TargetSavingsPlan; onChanged: () => Promise<unknown>; kycReady: boolean }) {
  const mine = plan.myMembership;
  const saved = toNaira(mine?.savedAmountKobo ?? "0");
  const target = toNaira(plan.targetAmountKobo);
  const remaining = Math.max(0, target - saved);
  const progress = Math.min(100, Math.round((saved / Math.max(target, 1)) * 100));
  const [amount, setAmount] = useState(Math.min(toNaira(plan.contributionAmountKobo), remaining || toNaira(plan.contributionAmountKobo)));
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const maturityReached = new Date(plan.maturityDate).getTime() <= Date.now();
  const provider = plan.investment.provider ?? "Ajoti";
  const savingsType = plan.investment.productType ?? (plan.type === "GROUP" ? "Group Target Savings" : "Target Savings");
  const actionLabel = saved > 0 ? "Add to savings" : "Start saving";

  const addMoney = async () => {
    if (!mine || !kycReady || amount <= 0 || amount > remaining) return;
    setSaving(true);
    setError("");
    try {
      await contributeTargetSavings(plan.id, String(Math.round(amount * 100)));
      setOpen(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not add this contribution");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-start">
        <div><Badge color={maturityReached ? "blue" : "green"} variant="light" mb="xs">{maturityReached ? "Matured" : "Active savings"}</Badge><Title order={3}>{plan.name}</Title></div>
        <Text fw={700} c="teal">{progress}% complete</Text>
      </Group>
      <Group align="baseline" gap={6} mt="xl"><Text fw={800} fz={34}>{money(String(Math.round(saved * 100)))}</Text><Text c="dimmed">of {money(plan.targetAmountKobo)}</Text></Group>
      <Progress value={progress} size="xl" radius="xl" mt="sm" color="teal" />
      <Group justify="space-between" mt="xs"><Text size="sm" c="dimmed">{progress}% complete</Text><Text size="sm" fw={600}>{money(String(Math.round(remaining * 100)))} remaining</Text></Group>

      <Group grow mt="xl" align="flex-start">
        <div><Text size="xs" c="dimmed">Next contribution</Text><Text fw={700}>{money(plan.contributionAmountKobo)} {plan.frequency.toLowerCase()}</Text></div>
        <div><Text size="xs" c="dimmed">Matures</Text><Text fw={700}>{new Date(plan.maturityDate).toLocaleDateString()}</Text></div>
      </Group>

      <Button fullWidth size="md" mt="xl" disabled={!kycReady || maturityReached || !mine || remaining <= 0} onClick={() => setOpen(true)}>{actionLabel}</Button>
      {!kycReady && <Alert mt="md" color="yellow">Complete KYC Level 1 before adding money to this goal.</Alert>}
      {maturityReached && <Alert mt="md" color="blue" title="Your savings have matured">Contributions are closed for this goal.</Alert>}

      <Card withBorder radius="md" p="md" mt="lg" bg="gray.0">
        <Text fw={700}>Your savings plan</Text>
        <Group grow mt="md" align="flex-start"><div><Text size="xs" c="dimmed">Savings type</Text><Text size="sm" fw={600}>{savingsType}</Text></div><div><Text size="xs" c="dimmed">Access</Text><Text size="sm" fw={600}>Locked until maturity</Text></div></Group>
        <Group grow mt="md" align="flex-start"><div><Text size="xs" c="dimmed">Provider</Text><Text size="sm" fw={600}>{provider}</Text></div><div><Text size="xs" c="dimmed">Interest</Text><Text size="sm" fw={600}>Rate unavailable</Text></div></Group>
        <Text size="xs" c="dimmed" mt="md">Provider details, applicable rates and fees will be shown when returned by the savings provider.</Text>
      </Card>

      <div className="mt-5"><Text fw={700}>Recent activity</Text><Text size="sm" c="dimmed" mt="sm">{saved > 0 ? "Your recent contribution activity will appear here." : "Your first contribution will appear here."}</Text></div>

      <Modal opened={open} onClose={() => setOpen(false)} title={actionLabel} centered>
        <Stack><Text size="sm" c="dimmed">Available to save is managed securely behind the scenes. Your goal has {money(String(Math.round(remaining * 100)))} left to reach.</Text><NumberInput label="Amount" min={1} max={remaining} value={amount} onChange={(value) => setAmount(Number(value) || 0)} prefix="₦" thousandSeparator="," /><Text size="sm" c="dimmed">Suggested contribution: {money(plan.contributionAmountKobo)}</Text><Alert color="blue" title="Before you continue">Your money remains locked until {new Date(plan.maturityDate).toLocaleDateString()}.</Alert>{error && <Alert color="red">{error}</Alert>}<Button loading={saving} onClick={addMoney} disabled={amount <= 0 || amount > remaining}>Add money</Button></Stack>
      </Modal>
    </Card>
  );
}

function TargetCard({ plan, onChanged, kycReady }: { plan: TargetSavingsPlan; onChanged: () => Promise<unknown>; kycReady: boolean }) {
  const mine = plan.myMembership;
  const plannedAmount = toNaira(plan.contributionAmountKobo);
  const remaining = toNaira(mine?.remainingAmountKobo ?? "0");
  const [amount, setAmount] = useState(Math.min(plannedAmount, remaining || plannedAmount));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const nextRemaining = toNaira(plan.myMembership?.remainingAmountKobo ?? "0");
    setAmount(Math.min(toNaira(plan.contributionAmountKobo), nextRemaining || toNaira(plan.contributionAmountKobo)));
  }, [plan.contributionAmountKobo, plan.myMembership?.remainingAmountKobo]);

  const maturityReached = new Date(plan.maturityDate).getTime() <= Date.now();
  const targetReached = !mine || Number(mine.remainingAmountKobo) <= 0;
  const contributionAvailable = plan.status === "ACTIVE" && Boolean(mine) && !maturityReached && !targetReached;
  const canContribute = contributionAvailable && kycReady;
  const organiser = plan.members.find((member) => member.userId === plan.ownerId);

  const inviteUrl = plan.inviteToken
    ? `${window.location.origin}${window.location.pathname}?targetInviteId=${encodeURIComponent(plan.id)}&targetInviteToken=${encodeURIComponent(plan.inviteToken)}`
    : "";

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareInvite = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      await navigator.share({ title: `Join ${plan.name} on Ajoti`, text: `You've been invited to join ${plan.name} on Ajoti Target Savings.`, url: inviteUrl });
      return;
    }
    await copyInvite();
  };

  const save = async () => {
    if (!canContribute || amount <= 0) return;
    setSaving(true);
    setError("");
    try {
      await contributeTargetSavings(plan.id, String(Math.round(amount * 100)));
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save to this target");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap="xs">
            <Text fw={700} fz="lg">{plan.name}</Text>
            {plan.type === "GROUP" && <Badge variant="light" color={plan.isPublic ? "green" : "gray"}>{plan.isPublic ? "Public" : "Private"}</Badge>}
          </Group>
          <Text size="sm" c="dimmed">{plan.type === "GROUP" ? `${plan.memberCount} members · Group accountability` : "Individual target"} · {plan.frequency.toLowerCase()}</Text>
        </div>
        <Text size="sm" fw={600}>{plan.status}</Text>
      </Group>

      <Progress mt="md" value={mine?.progressPercent ?? 0} />
      <Group justify="space-between" mt="xs">
        <Text size="sm">{money(mine?.savedAmountKobo ?? "0")} saved</Text>
        <Text size="sm">Personal target {money(plan.targetAmountKobo)}</Text>
      </Group>

      <Text size="xs" c="dimmed" mt="xs">Planned contribution: {money(plan.contributionAmountKobo)} {plan.frequency.toLowerCase()} · Matures {new Date(plan.maturityDate).toLocaleDateString()}</Text>
      {plan.investment.enabled && (
        <Alert mt="md" color="orange" title="Investment-backed target is not active">
          Provider: {plan.investment.provider ?? "Not assigned"}. Contributions and maturity settlement remain disabled until provider operations are enabled.
        </Alert>
      )}
      {plan.type === "GROUP" && <Text size="xs" c="dimmed" mt={2}>Current group target: {money(plan.groupTargetAmountKobo)}. This grows as new members join.</Text>}

      {targetReached && !maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="green" title="Target reached">You have finished contributing. Your savings remain locked until the maturity date.</Alert>
      )}
      {maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="blue" title="Maturity reached">Contributions are closed. Your saved amount is being released to your Ajoti wallet.</Alert>
      )}
      {contributionAvailable && !kycReady && (
        <Alert mt="md" color="yellow">Complete KYC Level 1 before contributing to this target.</Alert>
      )}

      {canContribute && (
        <>
          <Group mt="md" align="end">
            <NumberInput
              label="Save now"
              description={`Suggested: ${money(plan.contributionAmountKobo)}. You can save more or less.`}
              min={1}
              max={remaining}
              value={amount}
              onChange={(v) => setAmount(Number(v) || 0)}
              prefix="₦"
              thousandSeparator=","
              style={{ flex: 1 }}
            />
            <Button loading={saving} disabled={amount <= 0 || amount > remaining} onClick={save}>Save now</Button>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>Remaining target: {money(mine?.remainingAmountKobo ?? "0")}. Multiple manual contributions are allowed; Ajoti does not auto-debit.</Text>
        </>
      )}

      {error && <Alert color="red" mt="sm">{error}</Alert>}

      {plan.type === "GROUP" && plan.inviteToken && (
        <Card withBorder radius="md" p="sm" mt="md">
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" fw={600}>Invite people</Text>
              <Text size="xs" c="dimmed">Share a normal Ajoti link. Invitees never need to handle an invitation token.</Text>
            </div>
            <Group gap="xs">
              <Button size="xs" variant="default" leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />} onClick={copyInvite}>{copied ? "Copied" : "Copy link"}</Button>
              <Button size="xs" variant="light" leftSection={<IconShare size={14} />} onClick={shareInvite}>Share</Button>
            </Group>
          </Group>
        </Card>
      )}

      {plan.type === "GROUP" && (
        <Stack gap={4} mt="md">
          {plan.members
            .slice()
            .sort((a, b) => b.progressPercent - a.progressPercent)
            .map((m, i) => (
              <Group key={m.id} justify="space-between">
                <Group gap="xs">
                  <Text size="sm">{i + 1}. {m.user.firstName} {m.user.lastName}</Text>
                  {m.userId === plan.ownerId && <Badge size="xs" variant="light">Organiser</Badge>}
                </Group>
                <Text size="sm">{m.progressPercent.toFixed(0)}%</Text>
              </Group>
            ))}
          {organiser && plan.members.length === 0 && <Text size="xs" c="dimmed">Organised by {organiser.user.firstName}</Text>}
        </Stack>
      )}
    </Card>
  );
}
