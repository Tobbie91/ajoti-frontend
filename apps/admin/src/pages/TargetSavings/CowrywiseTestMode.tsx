import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Group, NumberInput, Select, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { TargetSavingsPlan } from "@/utils/targetSavingsApi";
import { activateCowrywise, createCowrywiseLockedSavings, fundCowrywiseSandboxWallet, fundCowrywiseSavings, getCowrywiseSavings, getCowrywiseState, getCowrywiseWallets, reconcileCowrywiseOperation, verifyCowrywiseSandboxIdentity, type CowrywiseSavings, type CowrywiseState, type CowrywiseWallet } from "@/utils/cowrywiseSavingsApi";

const key = (action: string) => `${action}-${crypto.randomUUID()}`;
const money = (minor: string) => `₦${(Number(minor || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

export function CowrywiseTestMode({ plans }: { plans: TargetSavingsPlan[] }) {
  const [state, setState] = useState<CowrywiseState>({ activated: false, testMode: true });
  const [wallets, setWallets] = useState<CowrywiseWallet[]>([]);
  const [savings, setSavings] = useState<CowrywiseSavings[]>([]);
  const [busy, setBusy] = useState("");
  const [amount, setAmount] = useState(5000);
  const [targetId, setTargetId] = useState<string | null>(null);
  const eligible = plans.filter((plan) => plan.type === "INDIVIDUAL");
  const refresh = async () => {
    const next = await getCowrywiseState(); setState(next);
    if (next.activated) {
      const [nextWallets, nextSavings] = await Promise.all([getCowrywiseWallets(), getCowrywiseSavings()]);
      setWallets(nextWallets); setSavings(nextSavings);
    }
  };
  useEffect(() => { refresh().catch(() => undefined); }, []);
  const run = async (name: string, action: () => Promise<unknown>) => {
    setBusy(name);
    try { await action(); await refresh(); notifications.show({ color: "green", message: "Authoritative Cowrywise state refreshed" }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Cowrywise action failed" }); }
    finally { setBusy(""); }
  };
  const ngn = wallets.find((wallet) => wallet.currency === "NGN");
  return <Card withBorder mb="lg" radius="md" p="lg">
    <Group justify="space-between"><div><Title order={3}>Cowrywise Savings</Title><Text size="sm" c="dimmed">Sandbox customer journey through Ajoti</Text></div><Badge color="orange">Test Mode</Badge></Group>
    <Stack mt="md">
      {!state.activated ? <Button loading={busy === "activate"} onClick={() => run("activate", activateCowrywise)}>Activate Savings</Button> : <Alert color={state.verified ? "green" : "yellow"} title={`Account ${state.accountStatus ?? "ACTIVE"}`}>Identity: {state.verificationStatus ?? "NOT VERIFIED"}</Alert>}
      {state.activated && !state.verified && <Button loading={busy === "verify"} onClick={() => run("verify", verifyCowrywiseSandboxIdentity)}>Verify with sandbox identity</Button>}
      {state.verified && <>
        <Card withBorder><Text fw={700}>NGN wallet</Text><Text>{ngn ? money(ngn.balanceMinor) : "Not available"}</Text><Text size="xs" c="dimmed">Provider status: {ngn?.status ?? "UNKNOWN"}</Text></Card>
        <Group align="end"><NumberInput label="Sandbox funds (₦)" min={500} max={10000} value={amount} onChange={(value) => setAmount(Number(value) || 5000)} /><Button loading={busy === "wallet"} onClick={() => run("wallet", () => fundCowrywiseSandboxWallet(String(amount), key("wallet-fund")))}>Add Sandbox Funds</Button></Group>
        {!savings.length && <><Select label="Individual savings target" placeholder="Create one below if this list is empty" value={targetId} onChange={setTargetId} data={eligible.map((plan) => ({ value: plan.id, label: plan.name }))} /><Button disabled={!targetId} loading={busy === "create"} onClick={() => targetId && run("create", () => createCowrywiseLockedSavings(targetId, key("locked-create")))}>Create 90-day Locked Savings</Button></>}
        {savings.map((item) => <Card withBorder key={item.id}><Group justify="space-between"><div><Text fw={700}>{item.productName ?? "Locked Savings"}</Text><Text size="sm">Balance {money(item.principalAmountMinor)} · {item.status}</Text><Text size="xs" c="dimmed">Matures {item.maturityDate ? new Date(item.maturityDate).toLocaleDateString() : "—"} · {item.locked ? "Locked" : "Unlocked"}</Text></div><Button loading={busy === `fund-${item.id}`} onClick={() => run(`fund-${item.id}`, () => fundCowrywiseSavings(item.id, "100000", key("savings-fund")))}>Fund ₦1,000</Button></Group>{item.operations.map((op) => <Group key={op.id} mt="xs" justify="space-between"><Text size="xs">{op.type}: {op.status}</Text>{["PENDING", "UNKNOWN"].includes(op.status) && <Button size="compact-xs" variant="light" onClick={() => run(`reconcile-${op.id}`, () => reconcileCowrywiseOperation(op.id))}>Refresh status</Button>}</Group>)}</Card>)}
      </>}
    </Stack>
  </Card>;
}
