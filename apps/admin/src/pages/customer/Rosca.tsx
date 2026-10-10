import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Badge,
  Avatar,
  Tabs,
  Loader,
} from "@mantine/core";
import {
  IconSearch,
  IconMessageCircle,
  IconHeadset,
} from "@tabler/icons-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isCircleAdmin } from "@/utils/auth-role";
import {
  listRoscaCircles,
  getMyJoinRequests,
  getMyParticipations,
  type RoscaCircle,
  type MyJoinRequest,
} from "@/utils/api";

type Participation = RoscaCircle;

// Discover tabs only — Joined is now rendered above the tab bar as its own section.
const TABS = ["All Groups", "Open Groups", "Invite-Only"] as const;

type GroupStatus = "Open" | "Invite Only";

interface RoscaGroup {
  id: string;
  name: string;
  duration: string;
  slots: string;
  status: GroupStatus;
  admin: string;
  hasInvite: boolean;
  canViewDetails: boolean;
  isRequestingUserAdmin: boolean;
}

interface JoinedGroup {
  id: string;
  name: string;
  completionRate: number;
  completedCycles: number;
  totalCycles: number;
  nextContribution: string;
  admin: string;
  circleStatus: string;
  frequency: string;
  contributionAmountNaira: number;
  memberCount: number;
  currentCycle: number;
}

const statusBadge: Record<GroupStatus, { bg: string; color: string; border: string }> = {
  Open: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  "Invite Only": { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

function contributionDate(circle: { status?: string; nextContributionDeadline?: string | null }): string {
  const date = circle.nextContributionDeadline ? new Date(circle.nextContributionDeadline) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }
  if (circle.status === "DRAFT") return "After the organiser starts the group";
  if (["COMPLETED", "CANCELLED"].includes(circle.status ?? "")) return "No further contributions";
  return "Schedule unavailable";
}

function money(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

// Status-driven visual tone for the joined card.
type CardTone = "active" | "notready" | "completed" | "cancelled";
const CARD_TONE: Record<CardTone, { rail: string; badgeBg: string; badgeFg: string; badgeLabel: string; cycleBg: string; cycleBorder: string; cycleText: string }> = {
  active:    { rail: "#02A36E", badgeBg: "#E7F4EE", badgeFg: "#056148", badgeLabel: "Active",      cycleBg: "#FEF3C7", cycleBorder: "#FDE68A", cycleText: "#92400E" },
  notready:  { rail: "#9CA3AF", badgeBg: "#E5E7EB", badgeFg: "#374151", badgeLabel: "Not started", cycleBg: "#F3F4F6", cycleBorder: "#E5E7EB", cycleText: "#6B7280" },
  completed: { rail: "#1E40AF", badgeBg: "#DBEAFE", badgeFg: "#1E40AF", badgeLabel: "Completed",   cycleBg: "#DBEAFE", cycleBorder: "#BFDBFE", cycleText: "#1E40AF" },
  cancelled: { rail: "#9CA3AF", badgeBg: "#FEE2E2", badgeFg: "#991B1B", badgeLabel: "Cancelled",   cycleBg: "#F3F4F6", cycleBorder: "#E5E7EB", cycleText: "#6B7280" },
};

function cardToneFor(status: string): CardTone {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "completed";
  if (s === "CANCELLED") return "cancelled";
  if (s === "ACTIVE" || s === "STARTED") return "active";
  return "notready";
}

interface JoinedGroupCardProps {
  group: JoinedGroup;
  onView: () => void;
  onPay: () => void;
  onChat: () => void;
  onSupport: () => void;
}

function JoinedGroupCard({ group, onView, onPay, onChat, onSupport }: JoinedGroupCardProps) {
  const tone = cardToneFor(group.circleStatus);
  const t = CARD_TONE[tone];
  const canPay = tone === "active";
  const canExit = ["DRAFT", "ACTIVE"].includes(group.circleStatus);
  const pct = Math.max(0, Math.min(100, group.totalCycles > 0 ? Math.round((group.completedCycles / group.totalCycles) * 100) : 0));
  const ringDeg = (pct / 100) * 360;

  const cycleStripLabel = (() => {
    if (tone === "completed") return "All cycles complete";
    if (tone === "cancelled") return "Group cancelled";
    if (tone === "notready")  return "Starts when the organiser activates the group";
    return `Cycle ${group.currentCycle || "—"} contribution`;
  })();

  const cycleStripSubtle = (() => {
    if (tone === "active") return `Next pay by ${group.nextContribution}`;
    if (tone === "notready") return "No contributions yet";
    return group.nextContribution;
  })();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#E4E6E1] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ paddingLeft: 20 }}
    >
      {/* Status rail */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: t.rail }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text fw={700} className="truncate text-[17px] leading-tight text-[#0F172A]">
            {group.name}
          </Text>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#64748B]">
            <span>{group.memberCount || "—"} members</span>
            <span className="inline-block h-1 w-1 rounded-full bg-[#CBD5E1]" />
            <span>{group.frequency ? group.frequency.toLowerCase() : "—"}</span>
            {group.contributionAmountNaira > 0 && (
              <>
                <span className="inline-block h-1 w-1 rounded-full bg-[#CBD5E1]" />
                <span>{money(group.contributionAmountNaira)}</span>
              </>
            )}
          </div>
        </div>
        <Badge
          size="sm"
          radius="xl"
          styles={{
            root: {
              backgroundColor: t.badgeBg,
              color: t.badgeFg,
              border: `1px solid ${t.badgeBg}`,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 10.5,
              letterSpacing: 0.4,
              paddingLeft: 10,
              paddingRight: 10,
              height: 22,
              flexShrink: 0,
            },
          }}
        >
          {t.badgeLabel}
        </Badge>
      </div>

      {/* Progress ring + text */}
      <div className="mt-4 flex items-center gap-4">
        <div
          className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${t.rail} 0deg ${ringDeg}deg, #F1F3EF ${ringDeg}deg 360deg)`,
          }}
          aria-hidden="true"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
            <Text fw={700} className="text-[12px]" style={{ color: t.rail }}>
              {pct}%
            </Text>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Text className="text-[11px] uppercase tracking-wide text-[#64748B]">
            Cycle progress
          </Text>
          <Text fw={700} className="mt-0.5 text-[13.5px] text-[#0F172A]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {group.completedCycles} of {group.totalCycles} cycles
          </Text>
        </div>
      </div>

      {/* Cycle info strip */}
      <div
        className="mt-4 rounded-xl border px-3.5 py-3"
        style={{ background: t.cycleBg, borderColor: t.cycleBorder, color: t.cycleText }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Text fw={700} className="text-[12.5px] leading-tight" style={{ color: t.cycleText }}>
              {cycleStripLabel}
            </Text>
            <Text className="mt-0.5 text-[11.5px]" style={{ color: t.cycleText, opacity: 0.9 }}>
              {cycleStripSubtle}
            </Text>
          </div>
          {tone === "active" && group.contributionAmountNaira > 0 && (
            <Text
              fw={700}
              className="flex-shrink-0 text-[13px]"
              style={{ color: t.cycleText, fontVariantNumeric: "tabular-nums" }}
            >
              {money(group.contributionAmountNaira)}
            </Text>
          )}
        </div>
      </div>

      {/* Primary CTA pair */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onView}
          className="cursor-pointer rounded-lg border border-[#02A36E] bg-white py-2.5 text-[12.5px] font-semibold text-[#0B6B55] transition-colors hover:bg-[#E7F4EE]"
        >
          View group
        </button>
        <button
          type="button"
          onClick={canPay ? onPay : undefined}
          disabled={!canPay}
          aria-disabled={!canPay}
          className={`rounded-lg py-2.5 text-[12.5px] font-semibold transition-colors ${
            canPay
              ? "cursor-pointer bg-[#0B6B55] text-white hover:bg-[#095C49]"
              : "cursor-not-allowed border border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
          }`}
        >
          Pay contribution
        </button>
      </div>

      {/* Secondary links */}
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onChat}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-[11.5px] text-[#64748B] transition-colors hover:bg-[#F1F3EF] hover:text-[#0F172A]"
        >
          <IconMessageCircle size={13} />
          Group chat
        </button>
        {canExit && (
          <button
            type="button"
            onClick={onSupport}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-[11.5px] text-[#64748B] transition-colors hover:bg-[#F1F3EF] hover:text-[#0F172A]"
          >
            <IconHeadset size={13} />
            Contact support
          </button>
        )}
      </div>
    </div>
  );
}

export function Rosca() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const admin = isCircleAdmin();
  // "Joined" is no longer a tab; if an old deep-link lands here with ?tab=joined
  // we treat it as the default All Groups discover view (the Joined section is
  // always visible at the top anyway).
  const initialTab = searchParams.get("tab") === "joined" ? "All Groups" : "All Groups";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [groups, setGroups] = useState<RoscaGroup[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroup[]>([]);
  const [joinedLoading, setJoinedLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  // ─── Fetch discover list + joined-ID set ────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      listRoscaCircles(),
      getMyParticipations(),
      getMyJoinRequests(),
    ]).then(([circlesRes, partRes, joinRes]) => {
      if (circlesRes.status === "fulfilled") {
        const mapped: RoscaGroup[] = circlesRes.value.map((c: RoscaCircle) => {
          const slotsLeft = (c.maxSlots ?? 0) - (c.filledSlots ?? 0);
          const adminName = c.admin
            ? `${c.admin.firstName ?? ""} ${c.admin.lastName ?? ""}`.trim()
            : "Unknown";
          return {
            id: c.id,
            name: c.name,
            duration: c.durationCycles ? `${c.durationCycles} cycles` : "",
            slots: `${slotsLeft} Slots`,
            status: (c.visibility === "PRIVATE"
              ? "Invite Only"
              : "Open") as GroupStatus,
            admin: adminName,
            hasInvite: c.hasInvite ?? false,
            canViewDetails: c.canViewDetails ?? c.visibility !== "PRIVATE",
            isRequestingUserAdmin: c.isRequestingUserAdmin ?? false,
          };
        });
        setGroups(mapped);
      } else {
        const err = circlesRes.reason;
        if (
          err instanceof Error &&
          err.message.toLowerCase().includes("unauthorized")
        ) {
          setNeedsLogin(true);
        }
      }

      const ids = new Set<string>();
      if (partRes.status === "fulfilled") {
        partRes.value.forEach((c) => ids.add(c.id));
      }
      if (joinRes.status === "fulfilled") {
        joinRes.value
          .filter((r) => ["ACTIVE", "STARTED"].includes((r.status ?? "").toUpperCase()))
          .forEach((r) => ids.add(r.circleId));
      }
      setJoinedIds(ids);
    });
  }, [refreshVersion]);

  // ─── Fetch joined-group details — always, not only on Joined tab ─────────
  useEffect(() => {
    setJoinedLoading(true);

    function mapJoinRequest(r: MyJoinRequest): JoinedGroup {
      const circle = (r.circle ?? {}) as Partial<RoscaCircle>;
      const completed = circle.status === "COMPLETED"
        ? Number(circle.durationCycles ?? 0)
        : Math.max(0, Number(circle.currentCycle ?? 1) - 1);
      const total = Number(circle.durationCycles ?? 1);
      const adminName = circle.admin
        ? `${circle.admin.firstName ?? ""} ${circle.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: r.circleId,
        name: circle.name ?? `Circle ${r.circleId.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        nextContribution: contributionDate(circle),
        admin: adminName,
        circleStatus: (circle.status as string) ?? "",
        frequency: (circle.frequency as string) ?? "",
        contributionAmountNaira: Number(circle.contributionAmount ?? 0) / 100,
        memberCount: Number(circle.filledSlots ?? 0),
        currentCycle: Number(circle.currentCycle ?? 0),
      };
    }

    function mapParticipation(c: Participation): JoinedGroup {
      const completed = c.status === "COMPLETED"
        ? Number(c.durationCycles ?? 0)
        : Math.max(0, Number(c.currentCycle ?? 1) - 1);
      const total = Number(c.durationCycles ?? 1);
      const adminName = c.admin
        ? `${c.admin.firstName ?? ""} ${c.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: c.id,
        name: c.name ?? `Circle ${c.id.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        nextContribution: contributionDate(c),
        admin: adminName,
        circleStatus: c.status ?? "",
        frequency: c.frequency ?? "",
        contributionAmountNaira: Number(c.contributionAmount ?? 0) / 100,
        memberCount: Number(c.filledSlots ?? 0),
        currentCycle: Number(c.currentCycle ?? 0),
      };
    }

    Promise.allSettled([getMyJoinRequests(), getMyParticipations()])
      .then(([joinRes, partRes]) => {
        const joinRequests = joinRes.status === "fulfilled" ? joinRes.value : [];
        const participations = partRes.status === "fulfilled" ? partRes.value : [];

        const approvedRequests = joinRequests.filter((r) =>
          ["ACTIVE", "STARTED"].includes((r.status ?? "").toUpperCase()),
        );

        const seenIds = new Set<string>();
        const merged: JoinedGroup[] = [];
        for (const c of participations) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            merged.push(mapParticipation(c));
          }
        }
        for (const r of approvedRequests) {
          if (!seenIds.has(r.circleId)) {
            seenIds.add(r.circleId);
            merged.push(mapJoinRequest(r));
          }
        }
        setJoinedGroups(merged);
      })
      .finally(() => setJoinedLoading(false));
  }, [refreshVersion]);

  // Discover list filtering
  const filtered = groups.filter((g) => {
    if (joinedIds.has(g.id)) return false;
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.admin.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "All Groups") return matchesSearch;
    if (activeTab === "Open Groups") return g.status === "Open" && matchesSearch;
    if (activeTab === "Invite-Only") return g.status === "Invite Only" && matchesSearch;
    return matchesSearch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 6);
  const hasJoined = joinedGroups.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setRefreshVersion((v) => v + 1)}
          className="cursor-pointer text-sm font-semibold text-[#02A36E]"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* ─── Hero banner (desktop) ──────────────────────────────────────── */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-r from-[#02A36E] to-[#00C853] px-6 py-8 text-white sm:block sm:px-10 sm:py-10">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text fw={700} className="text-[22px] sm:text-[28px] leading-tight">
                Welcome to ajo
              </Text>
              <Text size="sm" className="mt-2 text-white/90 leading-relaxed">
                Join trusted savings groups and grow your money together with others.
              </Text>
            </div>
            <button
              onClick={() => navigate("/rosca/how-it-works")}
              className="w-fit flex-shrink-0 cursor-pointer rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#02A36E] shadow-sm"
            >
              How it Works
            </button>
          </div>
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-28 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute right-48 top-2 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {/* ─── Mobile heading ─────────────────────────────────────────────── */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text fw={700} className="text-[26px] leading-tight text-[#0F172A]">
                Find an ajo
              </Text>
              <Text size="sm" c="dimmed" className="mt-1">
                Discover a group or jump into one you've joined.
              </Text>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rosca/how-it-works")}
              className="shrink-0 py-1 text-xs font-semibold text-[#0B6B55]"
            >
              How it works
            </button>
          </div>
        </div>

        {/* ─── Your groups (always on top, when non-empty) ─────────────────── */}
        {joinedLoading ? (
          <div className="flex justify-center py-6">
            <Loader color="#02A36E" size="sm" />
          </div>
        ) : hasJoined ? (
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <Text fw={700} className="text-[18px] text-[#0F172A]">
                  Your groups
                </Text>
                <Text className="text-[12px] text-[#64748B]">
                  Groups you've joined · pay contributions and track progress
                </Text>
              </div>
              <Text
                className="hidden text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] sm:block"
                style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}
              >
                {joinedGroups.length} active
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {joinedGroups.map((group) => (
                <JoinedGroupCard
                  key={group.id}
                  group={group}
                  onView={() => navigate(`/rosca/${group.id}/activities`)}
                  onPay={() =>
                    navigate(`/rosca/${group.id}/activities?tab=growth&pay=1`)
                  }
                  onChat={() =>
                    navigate(`/messages?circleId=${encodeURIComponent(group.id)}`)
                  }
                  onSupport={() =>
                    navigate(
                      `/support?category=ROSCA&subject=${encodeURIComponent(
                        `Group exit request: ${group.name}`,
                      )}&body=${encodeURIComponent(
                        `Group ID: ${group.id}\nReason for requesting to leave: `,
                      )}`,
                    )
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── Become-admin promo (desktop only) ──────────────────────────── */}
        {!admin && (
          <div className="hidden items-center justify-between rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-6 py-4 sm:flex">
            <div>
              <Text fw={600} size="sm" className="text-[#0F172A]">
                Become an ajo admin
              </Text>
              <Text size="xs" className="text-[#6B7280]">
                Activate admin access to create and manage your own group.
              </Text>
            </div>
            <button
              onClick={() => navigate("/rosca/become-admin")}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-5 py-2.5 text-sm font-medium text-white"
            >
              Activate
            </button>
          </div>
        )}

        {/* ─── Discover section header + tab filter ───────────────────────── */}
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <Text fw={700} className="text-[18px] text-[#0F172A]">
                {hasJoined ? "Discover more groups" : "Discover groups"}
              </Text>
              <Text className="text-[12px] text-[#64748B]">
                Browse public circles or filter by invite-only
              </Text>
            </div>
          </div>

          {/* Desktop 3-tab filter */}
          <div className="hidden sm:block">
            <Tabs
              value={activeTab}
              onChange={(v) => {
                setActiveTab(v || "All Groups");
                setShowAll(false);
              }}
              variant="default"
              styles={{
                list: { display: "flex", justifyContent: "flex-start" },
                tab: {
                  fontWeight: 500,
                  fontSize: 14,
                  padding: "10px 20px",
                  color: "#9CA3AF",
                },
              }}
            >
              <Tabs.List>
                {TABS.map((tab) => (
                  <Tabs.Tab key={tab} value={tab}>
                    {tab}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
        </div>

        {/* ─── Desktop search + my-requests ───────────────────────────────── */}
        <div className="hidden items-center gap-3 sm:flex">
          <TextInput
            placeholder="Search groups or admins..."
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="flex-1"
            styles={{ input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" } }}
          />
          <button
            onClick={() => navigate("/rosca/requests")}
            className="flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-[#02A36E] bg-white px-4 text-[13px] font-medium text-[#02A36E]"
          >
            My Requests
          </button>
        </div>

        {/* ─── Mobile search + filter ─────────────────────────────────────── */}
        <div className="space-y-3 sm:hidden">
          <TextInput
            aria-label="Search ajo groups"
            placeholder="Search groups or admins"
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            styles={{ input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" } }}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex flex-1 items-center gap-2 text-xs font-medium text-[#475467]">
              Show
              <select
                aria-label="Filter ajo groups"
                value={activeTab}
                onChange={(e) => {
                  setActiveTab(e.currentTarget.value);
                  setShowAll(false);
                }}
                className="min-w-0 flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
              >
                <option value="All Groups">All groups</option>
                <option value="Open Groups">Open groups</option>
                <option value="Invite-Only">Invite-only</option>
              </select>
            </label>
            <div className="flex shrink-0 items-center gap-3 text-xs font-semibold text-[#0B6B55]">
              <button type="button" onClick={() => navigate("/rosca/requests")}>Requests</button>
              <button type="button" onClick={() => navigate("/rosca/invites")}>Invites</button>
            </div>
          </div>
        </div>

        {/* ─── Discover grid ──────────────────────────────────────────────── */}
        {needsLogin ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Text fw={600} className="text-[#374151]">
              Login to view available ajo groups
            </Text>
            <button
              onClick={() => navigate("/login")}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-8 py-2.5 text-sm font-semibold text-white"
            >
              Login
            </button>
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((group) => {
              const openGroup = () => {
                if (group.canViewDetails || group.isRequestingUserAdmin) {
                  navigate(`/rosca/${group.id}`);
                } else if (group.hasInvite) {
                  navigate("/rosca/invites");
                }
              };
              const hasAction =
                group.canViewDetails || group.isRequestingUserAdmin || group.hasInvite;
              const actionLabel =
                group.status === "Open"
                  ? "View group"
                  : group.canViewDetails || group.isRequestingUserAdmin
                    ? "View group"
                    : group.hasInvite
                      ? "View invitation"
                      : "Invite only";

              return (
                <article
                  key={group.id}
                  className="flex min-h-[210px] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B7D9CF] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Text
                      component="h3"
                      fw={700}
                      className="line-clamp-2 text-[17px] leading-snug text-[#0F172A]"
                    >
                      {group.name}
                    </Text>
                    <Badge
                      size="md"
                      radius="xl"
                      className="shrink-0"
                      styles={{
                        root: {
                          backgroundColor: statusBadge[group.status].bg,
                          color: statusBadge[group.status].color,
                          border: `1px solid ${statusBadge[group.status].border}`,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: 11,
                          paddingLeft: 10,
                          paddingRight: 10,
                          height: 25,
                        },
                      }}
                    >
                      {group.status}
                    </Badge>
                  </div>

                  <Text size="sm" fw={600} className="mt-3 text-[#475569]">
                    {group.slots} available
                  </Text>
                  <Text size="sm" c="dimmed" mb="sm">
                    {group.duration}
                  </Text>

                  <div className="mt-auto border-t border-[#F1F5F9] pt-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar size={32} radius="xl" color="teal" variant="light">
                        {group.admin.charAt(0)}
                      </Avatar>
                      <div className="min-w-0">
                        <Text size="xs" className="text-[#64748B]">
                          Organised by
                        </Text>
                        <Text fw={600} className="truncate text-[13px] text-[#1E293B]">
                          {group.admin}
                        </Text>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openGroup}
                      disabled={!hasAction}
                      aria-label={`${actionLabel}: ${group.name}`}
                      className={`mt-4 w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                        hasAction
                          ? "cursor-pointer bg-[#02A36E] text-white hover:bg-[#01875B]"
                          : "cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]"
                      }`}
                    >
                      {actionLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Text fw={600} className="text-[#374151]">
              No groups found
            </Text>
            <Text size="sm" className="mt-1 text-[#9CA3AF]">
              Try adjusting your search or filter.
            </Text>
          </div>
        )}

        {!showAll && filtered.length > 6 && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAll(true)}
              className="rounded-lg border border-[#02A36E] px-8 py-2.5 text-sm font-medium text-[#02A36E]"
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {!admin && (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#E5E7EB] py-5 sm:hidden">
          <div>
            <Text fw={600} size="sm">Want to organise an ajo?</Text>
            <Text size="xs" c="dimmed">Learn about creating and managing a group.</Text>
          </div>
          <button
            type="button"
            onClick={() => navigate("/rosca/become-admin")}
            className="shrink-0 text-xs font-semibold text-[#0B6B55]"
          >
            Learn more
          </button>
        </div>
      )}
    </div>
  );
}
