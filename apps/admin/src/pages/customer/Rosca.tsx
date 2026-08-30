import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  Badge,
  Avatar,
  Tabs,
  Progress,
  Textarea,
  Loader,
} from "@mantine/core";
import {
  IconSearch,
  IconMessageCircle,
  IconCalendar,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconCircleCheck,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { isCircleAdmin } from "@/utils/auth-role";
import {
  listRoscaCircles,
  getMyJoinRequests,
  getMyParticipations,
  leaveRoscaCircle,
  getCircleRules,
  messageAdmin as sendMessageToAdmin,
  type RoscaCircle,
  type MyJoinRequest,
} from "@/utils/api";

// Shape returned by getMyParticipations - a circle object with the user already a member
type Participation = RoscaCircle;

const TABS = ["All Groups", "Open Groups", "Invite-Only", "Joined"] as const;

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
}

const statusBadge: Record<GroupStatus, { bg: string; color: string; border: string }> = {
  Open: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  "Invite Only": { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

export function Rosca() {
  const navigate = useNavigate();
  const admin = isCircleAdmin();
  const [activeTab, setActiveTab] = useState("All Groups");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [postStartExitPenaltyPercent, setPostStartExitPenaltyPercent] =
    useState<number | null>(null);
  const [messageAdmin, setMessageAdmin] = useState<{
    circleId: string;
    adminName: string;
  } | null>(null);
  const [messageSendError, setMessageSendError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageStep, setMessageStep] = useState<
    "compose" | "sending" | "sent"
  >("compose");

  const [groups, setGroups] = useState<RoscaGroup[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroup[]>([]);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

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

      // Build set of circle IDs the user is already part of
      const ids = new Set<string>();
      if (partRes.status === "fulfilled") {
        partRes.value.forEach((c) => ids.add(c.id));
      }
      if (joinRes.status === "fulfilled") {
        joinRes.value
          .filter((r) =>
            ["ACTIVE", "STARTED"].includes((r.status ?? "").toUpperCase()),
          )
          .forEach((r) => ids.add(r.circleId));
      }
      setJoinedIds(ids);
    });
    // Live rate for the post-start exit warning - never hardcode it.
    getCircleRules()
      .then((res) =>
        setPostStartExitPenaltyPercent(res.data.postStartExitPenaltyPercent),
      )
      .catch(() => setPostStartExitPenaltyPercent(null));
  }, []);

  useEffect(() => {
    if (activeTab !== "Joined") return;
    setJoinedLoading(true);

    function mapJoinRequest(r: MyJoinRequest): JoinedGroup {
      const circle = r.circle ?? {};
      const completed = Number(circle.currentCycle ?? 0);
      const total = Number(circle.durationCycles ?? 1);
      const adminName = circle.admin
        ? `${circle.admin.firstName ?? ""} ${circle.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;
      const nextPayout = (circle as { nextPayoutDate?: string }).nextPayoutDate
        ? new Date(
            (circle as { nextPayoutDate?: string }).nextPayoutDate!,
          ).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "TBD";
      return {
        id: r.circleId,
        name: circle.name ?? `Circle ${r.circleId.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        nextContribution: nextPayout,
        admin: adminName,
        circleStatus: (circle as { status?: string }).status ?? "",
      };
    }

    function mapParticipation(c: Participation): JoinedGroup {
      const completed = Number(c.currentCycle ?? 0);
      const total = Number(c.durationCycles ?? 1);
      const adminName = c.admin
        ? `${c.admin.firstName ?? ""} ${c.admin.lastName ?? ""}`.trim()
        : "Admin";
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;
      const nextPayout = (c as { nextPayoutDate?: string }).nextPayoutDate
        ? new Date(
            (c as { nextPayoutDate?: string }).nextPayoutDate!,
          ).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "TBD";
      return {
        id: c.id,
        name: c.name ?? `Circle ${c.id.slice(0, 6)}`,
        completionRate,
        completedCycles: completed,
        totalCycles: total,
        nextContribution: nextPayout,
        admin: adminName,
        circleStatus: c.status ?? "",
      };
    }

    Promise.allSettled([getMyJoinRequests(), getMyParticipations()])
      .then(([joinRes, partRes]) => {
        const joinRequests =
          joinRes.status === "fulfilled" ? joinRes.value : [];
        const participations =
          partRes.status === "fulfilled" ? partRes.value : [];

        const approvedRequests = joinRequests.filter((r) =>
          ["ACTIVE", "STARTED"].includes((r.status ?? "").toUpperCase()),
        );

        // Build merged list - participations take priority (dedup by circleId)
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
  }, [activeTab]);

  const filtered = groups.filter((g) => {
    if (joinedIds.has(g.id)) return false;
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.admin.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "All Groups") return matchesSearch;
    if (activeTab === "Open Groups")
      return g.status === "Open" && matchesSearch;
    if (activeTab === "Invite-Only")
      return g.status === "Invite Only" && matchesSearch;
    return matchesSearch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 6);
  const isJoinedTab = activeTab === "Joined";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6">
        {/* Hero Banner */}
        <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-r from-[#02A36E] to-[#00C853] px-6 py-8 text-white sm:block sm:px-10 sm:py-10">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text
                fw={700}
                className="text-[22px] sm:text-[28px] leading-tight"
              >
                Welcome to ajo
              </Text>
              <Text size="sm" className="mt-2 text-white/90 leading-relaxed">
                Join trusted savings groups and grow your money together with
                others.
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

        <div className="sm:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text fw={700} className="text-[26px] leading-tight text-[#0F172A]">Find an ajo</Text>
              <Text size="sm" c="dimmed" className="mt-1">Discover a group or check the ones you've joined.</Text>
            </div>
            <button
              type="button"
              onClick={() => navigate("/rosca/how-it-works")}
              className="shrink-0 py-1 text-xs font-semibold text-[#0B6B55]"
            >
              How it works
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-[#EEF3F1] p-1" aria-label="Ajo view">
            <button
              type="button"
              onClick={() => { setActiveTab("All Groups"); setShowAll(false); }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab !== "Joined" ? "bg-white text-[#0B6B55] shadow-sm" : "text-[#667085]"}`}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("Joined"); setShowAll(false); }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${activeTab === "Joined" ? "bg-white text-[#0B6B55] shadow-sm" : "text-[#667085]"}`}
            >
              Joined
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="hidden sm:block">
          <Tabs
            value={activeTab}
            onChange={(v) => {
              setActiveTab(v || "All Groups");
              setShowAll(false);
            }}
            variant="default"
            styles={{
              list: {
                display: "flex",
                justifyContent: "space-between",
              },
              tab: {
                flex: 1,
                textAlign: "center",
                fontWeight: 500,
                fontSize: 14,
                padding: "10px 0",
                color: "#9CA3AF",
              },
            }}
          >
            <Tabs.List grow>
              {TABS.map((tab) => (
                <Tabs.Tab key={tab} value={tab}>
                  {tab}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>

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

        {/* Search + Filter */}
        <div className="hidden items-center gap-3 sm:flex">
          <TextInput
            placeholder="Search groups or admins..."
            leftSection={<IconSearch size={18} color="#9CA3AF" />}
            radius="md"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="flex-1"
            styles={{
              input: { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
            }}
          />
          <button
            onClick={() => navigate("/rosca/requests")}
            className="flex h-[42px] cursor-pointer items-center gap-2 rounded-lg border border-[#02A36E] bg-white px-4 text-[13px] font-medium text-[#02A36E]"
          >
            My Requests
          </button>
        </div>

        {activeTab !== "Joined" && (
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
                  onChange={(e) => { setActiveTab(e.currentTarget.value); setShowAll(false); }}
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
        )}

        {/* Joined Tab Content */}
        {isJoinedTab ? (
          <>
            {joinedLoading ? (
              <div className="flex justify-center py-16">
                <Loader color="#02A36E" size="md" />
              </div>
            ) : joinedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Text fw={600} className="text-[#374151]">
                  No joined groups yet
                </Text>
                <Text size="sm" className="text-[#9CA3AF]">
                  Groups you've been approved to join will appear here.
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {joinedGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#02A36E]">
                        <IconCheck size={22} color="white" stroke={2.5} />
                      </div>
                      <div>
                        <Text fw={700} className="text-[15px] text-[#0F172A]">
                          {group.name}
                        </Text>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-[#02A36E]" />
                          <Text fw={500} className="text-[12px] text-[#6B7280]">
                            {group.completionRate}% of cycles complete
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-5 flex items-center gap-3">
                      <Progress
                        value={
                          (group.completedCycles / group.totalCycles) * 100
                        }
                        size={8}
                        radius="xl"
                        color="#02A36E"
                        className="flex-1"
                        styles={{
                          root: { backgroundColor: "#E5E7EB" },
                        }}
                      />
                      <Text
                        fw={500}
                        className="flex-shrink-0 text-[11px] text-[#6B7280]"
                      >
                        ({group.completedCycles} of {group.totalCycles} cycles
                        complete)
                      </Text>
                    </div>

                    {/* Next Contribution */}
                    <div className="mt-4 flex items-center gap-2">
                      <IconCalendar size={15} color="#6B7280" />
                      <Text fw={500} className="text-[12px] text-[#6B7280]">
                        Next contribution{" "}
                        <Text
                          component="span"
                          fw={600}
                          className="text-[#0F172A]"
                        >
                          {group.nextContribution}
                        </Text>
                      </Text>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-3">
                      {group.completedCycles > 0 ? (
                        <button
                          onClick={() =>
                            navigate(`/rosca/${group.id}/activities`)
                          }
                          className="w-full cursor-pointer rounded-lg border border-[#02A36E] py-3 text-[13px] font-semibold text-[#02A36E]"
                        >
                          View Activities
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setMessageAdmin({
                                circleId: group.id,
                                adminName: group.admin,
                              });
                              setMessage("");
                              setMessageSendError(null);
                              setMessageStep("compose");
                            }}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
                          >
                            <IconMessageCircle size={16} />
                            Message Admin
                          </button>
                          <button
                            onClick={() => setLeaveGroupId(group.id)}
                            className="flex-1 cursor-pointer rounded-lg border border-[#EF4444] py-3 text-[13px] font-semibold text-[#EF4444]"
                          >
                            Leave Group
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show More */}
            {!joinedLoading && !showAll && joinedGroups.length > 6 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="cursor-pointer rounded-lg border border-[#02A36E] px-8 py-2.5 text-sm font-medium text-[#02A36E]"
                >
                  Show More
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Login prompt if not authenticated */}
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
                    group.canViewDetails ||
                    group.isRequestingUserAdmin ||
                    group.hasInvite;

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

                      <div className="mt-auto border-t border-[#F1F5F9] pt-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size={32}
                            radius="xl"
                            color="teal"
                            variant="light"
                          >
                            {group.admin.charAt(0)}
                          </Avatar>
                          <div className="min-w-0">
                            <Text size="xs" className="text-[#64748B]">
                              Organised by
                            </Text>
                            <Text
                              fw={600}
                              className="truncate text-[13px] text-[#1E293B]"
                            >
                              {group.admin}
                            </Text>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={openGroup}
                          disabled={!hasAction}
                          aria-label={`${actionLabel}: ${group.name}`}
                          className={`mt-4 w-full rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${hasAction ? "cursor-pointer bg-[#02A36E] text-white hover:bg-[#01875B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02A36E]" : "cursor-not-allowed bg-[#F1F5F9] text-[#94A3B8]"}`}
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

            {/* Show More */}
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
          </>
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

      {/* Leave Group Modal */}
      {leaveGroupId &&
        (() => {
          const leavingGroup = joinedGroups.find((g) => g.id === leaveGroupId);
          const isPostStart = leavingGroup?.circleStatus === "ACTIVE";
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
                {/* Warning Icon */}
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF3C7]">
                    <IconAlertTriangle size={32} color="#F59E0B" stroke={2} />
                  </div>
                </div>

                {/* Title */}
                <Text
                  fw={700}
                  className="mt-5 text-center text-[20px] text-[#0F172A]"
                >
                  Leave Group?
                </Text>

                {/* Warnings */}
                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                      1
                    </div>
                    <Text
                      fw={500}
                      className="text-[13px] leading-relaxed text-[#374151]"
                    >
                      Once you leave,{" "}
                      <Text component="span" fw={700}>
                        you forfeit your slot
                      </Text>{" "}
                      in the payout order.
                    </Text>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                      2
                    </div>
                    <Text
                      fw={500}
                      className="text-[13px] leading-relaxed text-[#374151]"
                    >
                      You{" "}
                      <Text component="span" fw={700}>
                        cannot rejoin
                      </Text>{" "}
                      the group once you leave.
                    </Text>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                      3
                    </div>
                    <Text
                      fw={500}
                      className="text-[13px] leading-relaxed text-[#374151]"
                    >
                      Leaving the group may affect your{" "}
                      <Text component="span" fw={700}>
                        Trust Score
                      </Text>
                      .
                    </Text>
                  </div>
                  {isPostStart && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[12px] font-bold text-[#92400E]">
                        4
                      </div>
                      <Text
                        fw={500}
                        className="text-[13px] leading-relaxed text-[#374151]"
                      >
                        This group has already started -{" "}
                        <Text component="span" fw={700}>
                          {postStartExitPenaltyPercent !== null
                            ? `${postStartExitPenaltyPercent}% of`
                            : "a share of"}{" "}
                          your collateral will be forfeited
                        </Text>{" "}
                        to the remaining members.
                      </Text>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                {leaveError && (
                  <Text className="mt-3 text-center text-[12px] text-[#EF4444]">
                    {leaveError}
                  </Text>
                )}
                <div className="mt-7 flex gap-3">
                  <button
                    onClick={() => {
                      setLeaveGroupId(null);
                      setLeaveError(null);
                    }}
                    className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={leaveLoading}
                    onClick={async () => {
                      if (!leaveGroupId) return;
                      setLeaveLoading(true);
                      setLeaveError(null);
                      try {
                        await leaveRoscaCircle(leaveGroupId);
                        setLeaveGroupId(null);
                        setJoinedGroups((prev) =>
                          prev.filter((g) => g.id !== leaveGroupId),
                        );
                        setJoinedIds((prev) => {
                          const s = new Set(prev);
                          s.delete(leaveGroupId);
                          return s;
                        });
                      } catch (e) {
                        setLeaveError(
                          e instanceof Error
                            ? e.message
                            : "Failed to leave group",
                        );
                      } finally {
                        setLeaveLoading(false);
                      }
                    }}
                    className={`flex-1 cursor-pointer rounded-lg py-3 text-[13px] font-semibold text-white ${leaveLoading ? "bg-[#9CA3AF]" : "bg-[#EF4444]"}`}
                  >
                    {leaveLoading ? "Leaving…" : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Message Admin Modal */}
      {messageAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl bg-white p-8">
            {messageStep === "compose" && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <Text fw={700} className="text-[18px] text-[#0F172A]">
                    Message admin
                  </Text>
                  <button
                    onClick={() => {
                      setMessageAdmin(null);
                      setMessageSendError(null);
                    }}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[#F3F4F6]"
                  >
                    <IconX size={18} color="#6B7280" />
                  </button>
                </div>

                {/* Admin Name */}
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  {messageAdmin?.adminName}
                </Text>

                {/* Message Input */}
                <Textarea
                  label="Your message"
                  placeholder="Type message"
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  minRows={5}
                  radius="md"
                  className="mt-5"
                  styles={{
                    input: {
                      borderColor: "#E5E7EB",
                      fontSize: 13,
                    },
                  }}
                />

                {/* Error */}
                {messageSendError && (
                  <Text className="mt-3 text-[12px] text-[#EF4444]">
                    {messageSendError}
                  </Text>
                )}

                {/* Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => {
                      setMessageAdmin(null);
                      setMessageSendError(null);
                    }}
                    className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!message.trim()}
                    onClick={async () => {
                      if (!messageAdmin?.circleId) return;
                      setMessageSendError(null);
                      setMessageStep("sending");
                      try {
                        await sendMessageToAdmin(
                          messageAdmin.circleId,
                          message,
                        );
                        setMessageStep("sent");
                      } catch (e) {
                        setMessageSendError(
                          e instanceof Error
                            ? e.message
                            : "Failed to send message",
                        );
                        setMessageStep("compose");
                      }
                    }}
                    className={`flex-1 cursor-pointer rounded-lg py-3 text-[13px] font-semibold text-white ${
                      message.trim()
                        ? "bg-[#02A36E]"
                        : "cursor-not-allowed bg-[#9CA3AF]"
                    }`}
                  >
                    Send
                  </button>
                </div>
              </>
            )}

            {messageStep === "sending" && (
              <div className="flex flex-col items-center py-8">
                <Loader color="#02A36E" size="lg" />
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">
                  Sending your message
                </Text>
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  Please wait...
                </Text>
              </div>
            )}

            {messageStep === "sent" && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
                  <IconCircleCheck size={36} color="#02A36E" />
                </div>
                <Text fw={700} className="mt-5 text-[18px] text-[#0F172A]">
                  Message sent
                </Text>
                <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
                  Your message has been delivered to the admin.
                </Text>
                <button
                  onClick={() => {
                    setMessageAdmin(null);
                    setMessage("");
                    setMessageStep("compose");
                  }}
                  className="mt-6 cursor-pointer rounded-lg bg-[#02A36E] px-8 py-3 text-[13px] font-semibold text-white"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
