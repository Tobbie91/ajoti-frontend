import { useEffect, useMemo, useRef, useState } from "react";
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
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconShare,
  IconUsers,
} from "@tabler/icons-react";
import {
  contributeTargetSavings,
  cancelTargetSavings,
  createTargetSavings,
  getMyTargetSavings,
  getPublicTargetSavings,
  joinTargetSavings,
  type TargetSavingsPlan,
} from "@/utils/targetSavingsApi";
import { getKycStatus } from "@/utils/api";
import { useLocation, useNavigate } from "react-router-dom";
import { getCowrywiseState } from "@/utils/cowrywiseSavingsApi";
import { fundSandboxAjotiWallet } from "@/utils/sandboxWalletApi";
import { isDevAuthBypass } from "@/utils/dev-auth-bypass";

const toNaira = (k: string) => Number(k || 0) / 100;
const money = (k: string) =>
  `₦${toNaira(k).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MASKED = "₦••••••";
const fmtMoney = (k: string, show: boolean) => (show ? money(k) : MASKED);

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
        <List.Item>You may cancel your own membership before maturity. A 1.5% fee applies to the amount you have actually saved.</List.Item>
        <List.Item>For a group target, cancelling affects only your savings; other members and the group stay active.</List.Item>
        <List.Item>Provider-backed plans cannot be cancelled until safe provider redemption is available.</List.Item>
      </List>
    </Stack>
  );
}

function investmentActionsUnavailable(investment: TargetSavingsPlan["investment"]) {
  return investment.enabled || investment.lifecycleStatus !== "LEGACY";
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
          <div><Text size="xs" c="dimmed">Access</Text><Text size="sm" fw={600}>Maturity or early cancellation</Text></div>
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
          <Alert color="orange" title="Cancellation fee">For wallet-backed targets, cancellation before maturity carries a 1.5% fee on the amount saved. Provider-backed plans remain unavailable until safe redemption is available.</Alert>
          <Button onClick={addMoney} disabled={amount <= 0 || amount > available}>Add money</Button>
        </Stack>
      </Modal>
    </Card>
  );
}

export function TargetSavings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState<TargetSavingsPlan[]>([]);
  useEffect(() => {
    const plan = plans.find(p => location.hash === `#target-plan-${p.id}`);
    if (plan) document.getElementById(`target-plan-${plan.id}`)?.scrollIntoView({ block: 'start' });
  }, [plans, location.hash]);
  const [pub, setPub] = useState<TargetSavingsPlan[]>([]);
  const [view, setView] = useState<"MINE" | "DISCOVER">("MINE");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"INTRO" | "FORM" | "REVIEW">("INTRO");
  const [busy, setBusy] = useState(false);
  const createStarted = useRef(false);
  const [error, setError] = useState("");
  const [joinPlan, setJoinPlan] = useState<TargetSavingsPlan | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [privateInvite, setPrivateInvite] = useState<{ id: string; token: string } | null>(null);
  const [kycLevel, setKycLevel] = useState<number | null>(null);
  const [showAmounts, setShowAmounts] = useState<boolean>(() => {
    try {
      return localStorage.getItem("targetSavings:showAmounts") !== "0";
    } catch {
      return true;
    }
  });
  const toggleAmounts = () => {
    setShowAmounts((visible) => {
      const next = !visible;
      try { localStorage.setItem("targetSavings:showAmounts", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };
  const [sandboxStagingAvailable, setSandboxStagingAvailable] = useState(false);
  const [sandboxFunding, setSandboxFunding] = useState(false);
  const [sandboxWallet, setSandboxWallet] = useState<string | null>(null);
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
    getCowrywiseState()
      .then((state) => setSandboxStagingAvailable(state.testMode === true))
      .catch(() => setSandboxStagingAvailable(false));

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
    if (createStarted.current) return;
    createStarted.current = true;
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
      createStarted.current = false;
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
        <Group gap="xs">
          <Button
            variant="default"
            onClick={toggleAmounts}
            leftSection={showAmounts ? <IconEye size={16} /> : <IconEyeOff size={16} />}
            aria-label={showAmounts ? "Hide amounts" : "Show amounts"}
          >
            {showAmounts ? "Hide amounts" : "Show amounts"}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={!kycReady}>
            New target
          </Button>
        </Group>
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
            <CustomerTargetCard key={p.id} plan={p} onChanged={load} kycReady={kycReady} showAmounts={showAmounts} />
          ))}

          {sandboxStagingAvailable && (
            <Accordion variant="separated" mt="md">
              <Accordion.Item value="developer-tools">
                <Accordion.Control>Sandbox tools</Accordion.Control>
                <Accordion.Panel>
                  <Card withBorder radius="md" p="md">
                    <Text fw={700}>Fake Ajoti wallet funding</Text>
                    <Text size="sm" c="dimmed" mt={4}>
                      Staging-only test funds. The normal savings action will use this Ajoti wallet balance.
                    </Text>
                    {sandboxWallet && <Text size="sm" mt="sm">Available: ₦{(Number(sandboxWallet) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>}
                    <Button
                      mt="sm"
                      loading={sandboxFunding}
                      onClick={async () => {
                        setSandboxFunding(true);
                        try {
                          const result = await fundSandboxAjotiWallet("500000", `sandbox-ajoti-${crypto.randomUUID()}`);
                          setSandboxWallet(result.balance?.available ?? null);
                        } finally {
                          setSandboxFunding(false);
                        }
                      }}
                    >
                      Add ₦5,000 test funds
                    </Button>
                  </Card>
                </Accordion.Panel>
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
        onClose={() => { setOpen(false); setStep("INTRO"); }}
        title={step === "INTRO" ? "How Target Savings works" : step === "FORM" ? "Create savings target" : "Review your target"}
        centered
      >
        {step === "INTRO" ? (
          <Stack>
            <Alert icon={<IconInfoCircle size={18} />} title="Investment growth is not available yet" color="orange">
              Target Savings currently uses Ajoti&apos;s wallet-backed flow. Investment-backed growth remains disabled until provider operations and settlement are fully enabled.
            </Alert>
            <Alert icon={<IconInfoCircle size={18} />} title="Know the cancellation fee" color="orange">
              You can cancel your own savings before maturity. A 1.5% fee is charged on the amount you have actually saved, and the rest is returned to your Ajoti wallet. For group targets, this affects only your membership.
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
        ) : step === "FORM" ? (
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
              description="Your savings are released at maturity, or earlier if you cancel with a 1.5% fee on the amount saved."
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
            <Alert color="orange" title="Cancellation fee">
              If you cancel before maturity, Ajoti charges 1.5% of the amount you have actually saved and returns the remaining 98.5%. Group cancellation affects only your membership.
            </Alert>
            {error && <Text c="red" size="sm">{error}</Text>}

            <Group justify="space-between">
              <Button variant="default" onClick={() => { setOpen(false); setStep("INTRO"); }}>Cancel</Button>
              <Button
                disabled={!form.name || !form.maturityDate || plannedContributionCount < 1 || (form.type === "INDIVIDUAL" ? form.targetAmount <= 0 : form.contributionAmount <= 0)}
                onClick={() => { setError(""); setStep("REVIEW"); }}
              >Review target</Button>
            </Group>
          </Stack>
        ) : (
          <Stack>
            <Card withBorder>
              <Stack gap="xs">
                <Group justify="space-between"><Text c="dimmed">Target</Text><Text fw={600}>{form.name}</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Type</Text><Text fw={600}>{form.type === "GROUP" ? "Group" : "Individual"}</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Frequency</Text><Text fw={600}>{form.frequency.toLowerCase()}</Text></Group>
                <Group justify="space-between"><Text c="dimmed">Maturity</Text><Text fw={600}>{new Date(`${form.maturityDate}T00:00:00`).toLocaleDateString()}</Text></Group>
                {form.type === "INDIVIDUAL" ? (
                  <Group justify="space-between"><Text c="dimmed">Target amount</Text><Text fw={600}>{money(String(Math.round(form.targetAmount * 100)))}</Text></Group>
                ) : (
                  <Group justify="space-between"><Text c="dimmed">Per member, each interval</Text><Text fw={600}>{money(String(Math.round(form.contributionAmount * 100)))}</Text></Group>
                )}
                {form.type === "GROUP" && <Group justify="space-between"><Text c="dimmed">Visibility</Text><Text fw={600}>{form.isPublic ? "Public" : "Private"}</Text></Group>}
              </Stack>
            </Card>
            <Alert icon={<IconInfoCircle size={18} />} color="orange" title="Cancellation costs 1.5% of your saved amount">
              If you cancel before maturity, the fee is based on what you have actually saved at that time—not your target amount. The remaining 98.5% is returned. For a group target, only your membership is cancelled.
            </Alert>
            {error && <Alert color="red">{error}</Alert>}
            <Group justify="space-between">
              <Button variant="default" disabled={busy} onClick={() => setStep("FORM")}>Back</Button>
              <Button loading={busy} onClick={create}>Confirm and create target</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

function CustomerTargetCard({ plan, onChanged, kycReady, showAmounts }: { plan: TargetSavingsPlan; onChanged: () => Promise<unknown>; kycReady: boolean; showAmounts: boolean }) {
  const mine = plan.myMembership;
  const providerActionsUnavailable = investmentActionsUnavailable(plan.investment);
  const savedKobo = BigInt(mine?.savedAmountKobo ?? "0");
  const cancellationFeeKobo = (savedKobo * 150n) / 10_000n;
  const cancellationReturnKobo = savedKobo - cancellationFeeKobo;
  const plannedAmount = toNaira(plan.contributionAmountKobo);
  const remaining = toNaira(mine?.remainingAmountKobo ?? "0");
  const [amount, setAmount] = useState(Math.min(plannedAmount, remaining || plannedAmount));
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const nextRemaining = toNaira(plan.myMembership?.remainingAmountKobo ?? "0");
    setAmount(Math.min(toNaira(plan.contributionAmountKobo), nextRemaining || toNaira(plan.contributionAmountKobo)));
  }, [plan.contributionAmountKobo, plan.myMembership?.remainingAmountKobo]);

  const maturityReached = new Date(plan.maturityDate).getTime() <= Date.now();
  const targetReached = !mine || Number(mine.remainingAmountKobo) <= 0;
  const contributionAvailable = plan.status === "ACTIVE" && Boolean(mine) && !maturityReached && !targetReached && !providerActionsUnavailable;
  const canContribute = contributionAvailable && kycReady;
  const provider = plan.investment.provider ?? "Ajoti";
  const savingsType = plan.investment.productType ?? (plan.type === "GROUP" ? "Group Target Savings" : "Target Savings");
  const actionLabel = savedKobo > 0n ? "Add to savings" : "Start saving";
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

  const addMoney = async () => {
    if (providerActionsUnavailable) {
      setError("Provider-backed contributions are unavailable until the product and full provider lifecycle are approved and enabled.");
      return;
    }
    if (!canContribute || amount <= 0 || amount > remaining) return;
    setSaving(true);
    setError("");
    try {
      await contributeTargetSavings(plan.id, String(Math.round(amount * 100)), `target-${plan.id}-${crypto.randomUUID()}`);
      setOpen(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not add this contribution");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!mine || plan.status !== "ACTIVE" || providerActionsUnavailable || canceling) return;
    setCanceling(true);
    setError("");
    try {
      await cancelTargetSavings(plan.id);
      setCancelOpen(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not cancel this savings membership");
    } finally {
      setCanceling(false);
    }
  };

  // ─── Derived display values (no backend changes) ──────────────────────────
  const nowMs = Date.now();
  const maturityMs = new Date(plan.maturityDate).getTime();
  const startMs = new Date(plan.startDate).getTime();
  const daysLeft = Math.max(0, Math.ceil((maturityMs - nowMs) / 86_400_000));
  const totalMs = Math.max(1, maturityMs - startMs);
  const elapsedMs = Math.max(0, Math.min(totalMs, nowMs - startMs));
  const expectedPct = (elapsedMs / totalMs) * 100;
  const actualPct = Math.max(0, Math.min(100, mine?.progressPercent ?? 0));

  const savedKoboStr = mine?.savedAmountKobo ?? "0";
  const personalTargetKoboStr = mine?.targetAmountKobo ?? plan.targetAmountKobo;
  const remainingKoboStr = mine?.remainingAmountKobo ?? "0";
  const dateFormat: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const maturityLabel = new Date(plan.maturityDate).toLocaleDateString("en-NG", dateFormat);

  type StatusKind = "matured" | "reached" | "behind" | "on-track";
  const statusKind: StatusKind = maturityReached
    ? "matured"
    : targetReached
      ? "reached"
      : actualPct + 10 < expectedPct
        ? "behind"
        : "on-track";

  const statusMeta: Record<StatusKind, { label: string; color: string; heroHex: string; barColor: string }> = {
    "on-track": { label: "On track", color: "green", heroHex: "#0B6B55", barColor: "green" },
    behind:     { label: "Behind pace", color: "orange", heroHex: "#B45309", barColor: "orange" },
    reached:    { label: "Target reached", color: "blue", heroHex: "#1E40AF", barColor: "blue" },
    matured:    { label: "Matured", color: "gray", heroHex: "#374151", barColor: "gray" },
  };
  const meta = statusMeta[statusKind];

  // Catch-up pace (used by the "behind" nudge). Planned pace shown in the stats tile is the admin-set value.
  const freqLabel = plan.frequency === "DAILY" ? "daily" : plan.frequency === "WEEKLY" ? "weekly" : "monthly";
  const paceLabel = plan.frequency === "DAILY" ? "Daily pace" : plan.frequency === "WEEKLY" ? "Weekly pace" : "Monthly pace";
  const periodsLeft = countPeriods(plan.maturityDate.slice(0, 10), plan.frequency);
  const catchUpKobo = periodsLeft > 0 ? Math.ceil(Number(remainingKoboStr) / periodsLeft) : Number(remainingKoboStr);
  const daysLeftLabel = maturityReached
    ? "Matured"
    : daysLeft === 0
      ? "Matures today"
      : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
  const daysUrgent = !maturityReached && !targetReached && daysLeft > 0 && daysLeft < 7;

  return (
    <Card id={`target-plan-${plan.id}`} withBorder radius="md" p="lg" style={{ scrollMarginTop: 90 }}>
      {/* ─── Header: name + status + days-left ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="wrap">
            <Text fw={700} fz="lg" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{plan.name}</Text>
            {plan.type === "GROUP" && (
              <Badge variant="light" color={plan.isPublic ? "green" : "gray"}>
                {plan.isPublic ? "Public" : "Private"}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            {plan.type === "GROUP"
              ? `${plan.memberCount} member${plan.memberCount === 1 ? "" : "s"} · Group · ${freqLabel}`
              : `Individual · ${freqLabel}`}
          </Text>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end sm:gap-1.5">
          <Badge
            variant="filled"
            color={meta.color}
            size="lg"
            radius="sm"
            leftSection={statusKind === "reached" || statusKind === "matured" ? (statusKind === "matured" ? <IconLockOpen size={13} stroke={2.5} /> : <IconLock size={13} stroke={2.5} />) : undefined}
            style={{ fontWeight: 700, letterSpacing: 0.4 }}
          >
            {meta.label}
          </Badge>
          <Text
            size="xs"
            fw={daysUrgent ? 700 : 500}
            c={daysUrgent ? "orange.7" : "dimmed"}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {daysLeftLabel}
          </Text>
        </div>
      </div>

      {/* ─── Hero amount ─── */}
      <Group gap={8} align="baseline" mt="md" wrap="wrap">
        <Text fw={700} fz={32} style={{ color: meta.heroHex, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {fmtMoney(savedKoboStr, showAmounts)}
        </Text>
        <Text size="sm" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
          of <Text component="span" fw={600} c="dark" inherit>{fmtMoney(personalTargetKoboStr, showAmounts)}</Text>{plan.type === "GROUP" ? " personal" : " target"}
        </Text>
      </Group>

      {/* ─── Progress bar ─── */}
      <Progress mt="sm" size="md" radius="xl" value={actualPct} color={meta.barColor} />
      <Group justify="space-between" mt={6}>
        <Text size="xs" c="dimmed" style={{ letterSpacing: 0.5, textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
          {actualPct.toFixed(0)}% saved
        </Text>
        <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
          Matures {maturityLabel}
        </Text>
      </Group>

      {/* ─── Stats tiles ─── */}
      <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="xs" mt="md">
        <StatTile label="Saved" value={fmtMoney(savedKoboStr, showAmounts)} accent />
        <StatTile label="Remaining" value={fmtMoney(remainingKoboStr, showAmounts)} subtle />
        <StatTile label={paceLabel} value={fmtMoney(plan.contributionAmountKobo, showAmounts)} />
        <StatTile label="Days left" value={maturityReached ? "0" : String(daysLeft)} subtle />
      </SimpleGrid>

      {/* ─── Group-only pot line ─── */}
      {plan.type === "GROUP" && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#F5FBF8", border: "1px solid #DBEDE1", borderRadius: 8 }}>
          <Text size="xs" style={{ color: "#374151", fontWeight: 500 }}>
            Group pot: <strong style={{ color: "#0B6B55", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(plan.totalSavedKobo, showAmounts)}</strong> of <strong style={{ color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{fmtMoney(plan.groupTargetAmountKobo, showAmounts)}</strong>. Grows as members join and contribute.
          </Text>
        </div>
      )}

      {/* ─── Status nudges ─── */}
      {statusKind === "behind" && (
        <Alert mt="md" color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
          You're {fmtMoney(remainingKoboStr, showAmounts)} short with {daysLeft} day{daysLeft === 1 ? "" : "s"} left. Save about <strong>{fmtMoney(String(catchUpKobo), showAmounts)}</strong> {freqLabel} to finish on time.
        </Alert>
      )}
      {targetReached && !maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="blue" variant="light" icon={<IconLock size={18} />} title="Target reached">
          You've hit your target. Your savings will be released at <strong>{maturityLabel}</strong>; you can also cancel early with a 1.5% fee on the amount saved.
        </Alert>
      )}
      {maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="gray" variant="light" icon={<IconLockOpen size={18} />} title="Matured — funds unlocked">
          Contributions are closed. {fmtMoney(savedKoboStr, showAmounts)} is being released to your Ajoti wallet.
        </Alert>
      )}
      {contributionAvailable && !kycReady && (
        <Alert mt="md" color="yellow" variant="light">Complete KYC Level 1 before contributing to this target.</Alert>
      )}

      {providerActionsUnavailable && (
        <Alert mt="md" color="orange" title="Investment-backed target is not active">
          Provider: {plan.investment.provider ?? "Not assigned"}. Contributions, cancellation and maturity settlement remain disabled until product eligibility and provider operations are approved and enabled.
        </Alert>
      )}

      <Group grow mt="lg" align="flex-start">
        <div><Text size="xs" c="dimmed">Next contribution</Text><Text fw={700}>{fmtMoney(plan.contributionAmountKobo, showAmounts)} {freqLabel}</Text></div>
        <div><Text size="xs" c="dimmed">Access</Text><Text fw={700}>Maturity or early cancellation</Text></div>
      </Group>

      {canContribute && (
        <Button fullWidth size="md" mt="lg" onClick={() => setOpen(true)}>{actionLabel}</Button>
      )}
      {plan.status === "ACTIVE" && mine && !maturityReached && !providerActionsUnavailable && (
        <Button mt="md" variant="light" color="red" onClick={() => setCancelOpen(true)}>Cancel my savings</Button>
      )}
      {plan.status === "ACTIVE" && mine && providerActionsUnavailable && (
        <Alert mt="md" color="orange" title="Cancellation unavailable">
          This provider-backed plan cannot be cancelled until product eligibility and safe provider redemption are approved.
        </Alert>
      )}

      <Card withBorder radius="md" p="md" mt="lg" bg="gray.0">
        <Text fw={700}>Your savings plan</Text>
        <Group grow mt="md" align="flex-start">
          <div><Text size="xs" c="dimmed">Savings type</Text><Text size="sm" fw={600}>{savingsType}</Text></div>
          <div><Text size="xs" c="dimmed">Provider</Text><Text size="sm" fw={600}>{provider}</Text></div>
        </Group>
        <Text size="xs" c="dimmed" mt="md">Provider details, applicable rates and fees will be shown when returned by the savings provider.</Text>
      </Card>

      {error && <Alert color="red" mt="sm">{error}</Alert>}

      {/* ─── Group invite card (unchanged) ─── */}
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

      {/* ─── Group member list — amounts first, then percent ─── */}
      {plan.type === "GROUP" && plan.members.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E5E7EB" }}>
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">Members</Text>
            <Text size="xs" c="dimmed">Sorted by progress</Text>
          </Group>
          <Stack gap={10}>
            {plan.members
              .slice()
              .sort((a, b) => b.progressPercent - a.progressPercent)
              .map((m, i) => (
                <MemberRow
                  key={m.id}
                  rank={i + 1}
                  name={`${m.user.firstName} ${m.user.lastName}`.trim()}
                  isOrganiser={m.userId === plan.ownerId}
                  savedKobo={m.savedAmountKobo}
                  targetKobo={m.targetAmountKobo || plan.targetAmountKobo}
                  progressPercent={m.progressPercent}
                  showAmounts={showAmounts}
                />
              ))}
          </Stack>
        </div>
      )}
      {plan.type === "GROUP" && plan.members.length === 0 && organiser && (
        <Text size="xs" c="dimmed" mt="md">Organised by {organiser.user.firstName}</Text>
      )}
      <Modal opened={open} onClose={() => !saving && setOpen(false)} title={actionLabel} centered>
        <Stack>
          <Text size="sm" c="dimmed">Your goal has {fmtMoney(remainingKoboStr, showAmounts)} left to reach.</Text>
          <NumberInput label="Amount" min={1} max={remaining} value={amount} onChange={(value) => setAmount(Number(value) || 0)} prefix="₦" thousandSeparator="," />
          <Text size="sm" c="dimmed">Suggested contribution: {fmtMoney(plan.contributionAmountKobo, showAmounts)}</Text>
          <Alert color="orange" title="Cancellation fee">You may cancel before maturity; a 1.5% fee applies to the amount you have actually saved.</Alert>
          {error && <Alert color="red">{error}</Alert>}
          <Button loading={saving} onClick={addMoney} disabled={providerActionsUnavailable || amount <= 0 || amount > remaining}>Add money</Button>
        </Stack>
      </Modal>

      <Modal opened={cancelOpen} onClose={() => !canceling && setCancelOpen(false)} title="Cancel your savings" centered>
        <Stack>
          <Alert color="orange" title="A 1.5% cancellation fee applies">
            The fee is calculated on your actual saved balance. For this target, {fmtMoney(savedKobo.toString(), showAmounts)} saved means {fmtMoney(cancellationFeeKobo.toString(), showAmounts)} fee and {fmtMoney(cancellationReturnKobo.toString(), showAmounts)} returned to your Ajoti wallet. {plan.type === "GROUP" ? "Only your membership will be cancelled; other members and their money are unaffected." : "Your individual plan will be cancelled."}
          </Alert>
          {error && <Alert color="red">{error}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" disabled={canceling} onClick={() => setCancelOpen(false)}>Keep savings</Button>
            <Button color="red" loading={canceling} disabled={providerActionsUnavailable} onClick={cancel}>Confirm cancellation</Button>
          </Group>
        </Stack>
      </Modal>

    </Card>
  );
}

function StatTile({ label, value, subtle, accent }: { label: string; value: string; subtle?: boolean; accent?: boolean }) {
  // Accent tile = brand solid green (most important metric). Others sit on a brand-tinted ground with a subtle green border.
  const bg = accent ? "#0B6B55" : "#E7F4EE";
  const border = accent ? "#0B6B55" : "#BFE0CC";
  const labelColor = accent ? "rgba(255,255,255,0.85)" : "#047857";
  const valueColor = accent ? "#FFFFFF" : "#0F172A";
  return (
    <div style={{ padding: "12px 14px", background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
      <Text style={{ letterSpacing: 0.6, textTransform: "uppercase", fontSize: 10, fontWeight: 600, color: labelColor }}>
        {label}
      </Text>
      <Text
        mt={3}
        style={{ fontSize: 15, fontWeight: subtle ? 600 : 700, color: valueColor, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}
      >
        {value}
      </Text>
    </div>
  );
}

function MemberRow({
  rank,
  name,
  isOrganiser,
  savedKobo,
  targetKobo,
  progressPercent,
  showAmounts,
}: {
  rank: number;
  name: string;
  isOrganiser: boolean;
  savedKobo: string;
  targetKobo: string;
  progressPercent: number;
  showAmounts: boolean;
}) {
  const pct = Math.max(0, Math.min(100, progressPercent));
  const done = pct >= 100;
  return (
    <div
      className="flex flex-col gap-2 py-2 border-b border-dashed border-[#E5E7EB] sm:flex-row sm:items-center sm:gap-3"
    >
      {/* Line 1 on mobile / left on desktop: rank + name + badges */}
      <div className="flex items-center gap-2 min-w-0 sm:flex-1">
        <Text size="xs" c="dimmed" ta="center" style={{ width: 18, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
          {rank}
        </Text>
        <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name || "Member"}
        </Text>
        {isOrganiser && <Badge size="xs" variant="light" color="green" style={{ flexShrink: 0 }}>Organiser</Badge>}
        {done && !isOrganiser && <Badge size="xs" variant="light" color="green" style={{ flexShrink: 0 }}>Done</Badge>}
      </div>

      {/* Line 2 on mobile / right on desktop: bar + amount */}
      <div className="flex items-center gap-3 pl-7 sm:pl-0 sm:flex-shrink-0">
        <div style={{ flex: 1 }} className="sm:!flex-none sm:w-24">
          <Progress value={pct} size="xs" radius="xl" color="green" />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <Text size="xs" fw={600} style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {fmtMoney(savedKobo, showAmounts)} <Text component="span" c="dimmed" fw={400} inherit>of {fmtMoney(targetKobo, showAmounts)}</Text>
          </Text>
          <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
            {pct.toFixed(0)}%
          </Text>
        </div>
      </div>
    </div>
  );
}
