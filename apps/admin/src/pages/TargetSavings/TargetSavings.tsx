import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { IconInfoCircle, IconPlus, IconUsers } from "@tabler/icons-react";
import {
  contributeTargetSavings,
  createTargetSavings,
  getMyTargetSavings,
  getPublicTargetSavings,
  joinTargetSavings,
  type TargetSavingsPlan,
} from "@/utils/targetSavingsApi";

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

export function TargetSavings() {
  const [plans, setPlans] = useState<TargetSavingsPlan[]>([]);
  const [pub, setPub] = useState<TargetSavingsPlan[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"INTRO" | "FORM">("INTRO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
  }, []);

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
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create target");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Target Savings</Title>
          <Text c="dimmed">Save towards your own goal or stay accountable with a group.</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New target
        </Button>
      </Group>

      <Stack gap="md">
        {plans.length === 0 && (
          <Card withBorder>
            <Text fw={600}>No savings targets yet</Text>
            <Text size="sm" c="dimmed">Create an individual target or start a group target.</Text>
          </Card>
        )}

        {plans.map((p) => (
          <TargetCard key={p.id} plan={p} onChanged={load} />
        ))}

        {pub.length > 0 && (
          <>
            <Title order={3} mt="lg">Public group targets</Title>
            {pub.map((p) => (
              <Card key={p.id} withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={700}>{p.name}</Text>
                    <Text size="sm" c="dimmed">
                      {p.memberCount} members · {money(p.contributionAmountKobo)} {p.frequency.toLowerCase()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Per-member target: {money(p.targetAmountKobo)} · Matures {new Date(p.maturityDate).toLocaleDateString()}
                    </Text>
                  </div>
                  <Button variant="light" leftSection={<IconUsers size={16} />} onClick={() => joinTargetSavings(p.id).then(load)}>
                    Join
                  </Button>
                </Group>
              </Card>
            ))}
          </>
        )}
      </Stack>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title={step === "INTRO" ? "How Target Savings works" : "Create savings target"}
        centered
      >
        {step === "INTRO" ? (
          <Stack>
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

            <TextInput
              label="Target name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
            />
            <Textarea
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
            />

            {form.type === "INDIVIDUAL" ? (
              <NumberInput
                label="Target amount (₦)"
                min={1}
                value={form.targetAmount}
                onChange={(v) => setForm({ ...form, targetAmount: Number(v) || 0 })}
                thousandSeparator=","
              />
            ) : (
              <NumberInput
                label="Amount each member should save per interval (₦)"
                description="Members can contribute ahead of schedule, but each member has the same planned target."
                min={1}
                value={form.contributionAmount}
                onChange={(v) => setForm({ ...form, contributionAmount: Number(v) || 0 })}
                thousandSeparator=","
              />
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
                <Text size="sm" c="dimmed">
                  {plannedContributionCount} planned {form.frequency.toLowerCase()} contribution{plannedContributionCount === 1 ? "" : "s"}.
                </Text>
                {form.type === "INDIVIDUAL" ? (
                  <Text size="sm" mt={4}>
                    Suggested contribution: <strong>₦{calculatedIndividualContribution.toLocaleString("en-NG")}</strong> per interval
                  </Text>
                ) : (
                  <Text size="sm" mt={4}>
                    Planned target per member: <strong>₦{calculatedGroupMemberTarget.toLocaleString("en-NG")}</strong>
                  </Text>
                )}
              </Card>
            )}

            {form.type === "GROUP" && (
              <Switch
                label="Make this group public"
                description="Private groups can only be joined with their invitation."
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.currentTarget.checked })}
              />
            )}

            <Divider />
            <Text size="xs" c="dimmed">
              No early withdrawal is available. Ajoti stops accepting contributions once you reach your personal target or the maturity date passes.
            </Text>

            {error && <Text c="red" size="sm">{error}</Text>}

            <Group justify="space-between">
              <Button variant="subtle" onClick={() => setStep("INTRO")}>Back</Button>
              <Button
                loading={busy}
                disabled={
                  !form.name ||
                  !form.maturityDate ||
                  plannedContributionCount < 1 ||
                  (form.type === "INDIVIDUAL" ? form.targetAmount <= 0 : form.contributionAmount <= 0)
                }
                onClick={create}
              >
                Create target
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

function TargetCard({ plan, onChanged }: { plan: TargetSavingsPlan; onChanged: () => Promise<unknown> }) {
  const mine = plan.myMembership;
  const plannedAmount = toNaira(plan.contributionAmountKobo);
  const remaining = toNaira(mine?.remainingAmountKobo ?? "0");
  const [amount, setAmount] = useState(Math.min(plannedAmount, remaining || plannedAmount));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextRemaining = toNaira(plan.myMembership?.remainingAmountKobo ?? "0");
    setAmount(Math.min(toNaira(plan.contributionAmountKobo), nextRemaining || toNaira(plan.contributionAmountKobo)));
  }, [plan.contributionAmountKobo, plan.myMembership?.remainingAmountKobo]);

  const maturityReached = new Date(plan.maturityDate).getTime() <= Date.now();
  const targetReached = !mine || Number(mine.remainingAmountKobo) <= 0;
  const canContribute = plan.status === "ACTIVE" && Boolean(mine) && !maturityReached && !targetReached;

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
          <Text fw={700} fz="lg">{plan.name}</Text>
          <Text size="sm" c="dimmed">
            {plan.type === "GROUP" ? `${plan.memberCount} members · Group accountability` : "Individual target"} · {plan.frequency.toLowerCase()}
          </Text>
        </div>
        <Text size="sm" fw={600}>{plan.status}</Text>
      </Group>

      <Progress mt="md" value={mine?.progressPercent ?? 0} />
      <Group justify="space-between" mt="xs">
        <Text size="sm">{money(mine?.savedAmountKobo ?? "0")} saved</Text>
        <Text size="sm">Personal target {money(plan.targetAmountKobo)}</Text>
      </Group>

      <Text size="xs" c="dimmed" mt="xs">
        Planned contribution: {money(plan.contributionAmountKobo)} {plan.frequency.toLowerCase()} · Matures {new Date(plan.maturityDate).toLocaleDateString()}
      </Text>

      {plan.type === "GROUP" && (
        <Text size="xs" c="dimmed" mt={2}>
          Current group target: {money(plan.groupTargetAmountKobo)}. This grows as new members join.
        </Text>
      )}

      {targetReached && !maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="green" title="Target reached">
          You have finished contributing. Your savings remain locked until the maturity date.
        </Alert>
      )}

      {maturityReached && plan.status === "ACTIVE" && (
        <Alert mt="md" color="blue" title="Maturity reached">
          Contributions are closed. Your saved amount is being released to your Ajoti wallet.
        </Alert>
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
            <Button loading={saving} disabled={amount <= 0 || amount > remaining} onClick={save}>
              Save now
            </Button>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            Remaining target: {money(mine?.remainingAmountKobo ?? "0")}. Multiple manual contributions are allowed; Ajoti does not auto-debit.
          </Text>
        </>
      )}

      {error && <Text c="red" size="sm" mt="xs">{error}</Text>}

      {plan.type === "GROUP" && plan.inviteToken && (
        <Text mt="md" size="xs" c="dimmed">Invite token: {plan.inviteToken}</Text>
      )}

      {plan.type === "GROUP" && (
        <Stack gap={4} mt="md">
          {plan.members
            .slice()
            .sort((a, b) => b.progressPercent - a.progressPercent)
            .map((m, i) => (
              <Group key={m.id} justify="space-between">
                <Text size="sm">{i + 1}. {m.user.firstName} {m.user.lastName}</Text>
                <Text size="sm">{m.progressPercent.toFixed(0)}%</Text>
              </Group>
            ))}
        </Stack>
      )}
    </Card>
  );
}
