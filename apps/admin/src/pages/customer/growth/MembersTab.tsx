import { useState, useEffect } from "react";
import {
  Text,
  Badge,
  Avatar,
  Progress,
  RingProgress,
  Textarea,
  Slider,
  Loader,
  Modal,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconMessageCircle,
  IconCalendar,
  IconShieldCheck,
  IconWallet,
  IconCheck,
  IconCash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  leaveRoscaCircle,
  messageAdmin,
  makeContribution,
  getWalletBalance,
  submitPeerReview,
  type CircleContribution,
  type CircleMember,
} from "@/utils/api";

// ── Members Tab ───────────────────────────────────────────────────────────────

export function MembersTab({
  circleName,
  statusBadge,
  members,
}: {
  circleName: string;
  statusBadge: { bg: string; color: string; label: string };
  members: CircleMember[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <Text fw={700} className="text-[20px] text-[#0F172A]">
            {circleName}
          </Text>
          <Badge
            size="md"
            radius="xl"
            styles={{
              root: {
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 12,
              },
            }}
          >
            {statusBadge.label}
          </Badge>
        </div>
        <Text fw={500} className="mt-1 text-[13px] text-[#6B7280]">
          {statusBadge.label} &middot; {members.length} Member
          {members.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Mobile: vertical card list for each member. */}
      <div className="flex flex-col gap-2 sm:hidden">
        {members.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
            No members yet
          </div>
        ) : (
          members.map((member) => {
            const joinDate = member.joinedAt
              ? new Date(member.joinedAt as string).toLocaleDateString("en-NG", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : "-";
            return (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-3"
              >
                <Avatar
                  src={member.avatarUrl || undefined}
                  size={36}
                  radius="xl"
                  color="teal"
                  variant="filled"
                >
                  {(member.name || "?").charAt(0).toUpperCase()}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Text fw={600} truncate className="text-[13.5px] text-[#0F172A]">
                    {member.name}
                  </Text>
                  <Text className="text-[11.5px] text-[#9CA3AF]">
                    Joined {joinDate}{member.position != null ? ` · #${member.position}` : ""}
                  </Text>
                </div>
                <div className="flex flex-col items-end">
                  <Text className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Trust
                  </Text>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#DCFCE7",
                      color: "#065F46",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {member.trustScore ?? 50}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white sm:block">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                Name
              </th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                Join Date
              </th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                Payout Position
              </th>
              <th className="px-3 py-3 text-left text-[12px] font-semibold text-[#6B7280] sm:px-5">
                Membership
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]"
                >
                  No members yet
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const joinDate = member.joinedAt
                  ? new Date(member.joinedAt as string).toLocaleDateString(
                      "en-NG",
                      { day: "numeric", month: "short", year: "numeric" },
                    )
                  : "-";
                return (
                  <tr
                    key={member.userId}
                    className="border-b border-[#F3F4F6] last:border-b-0"
                  >
                    <td className="px-3 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={member.avatarUrl || undefined}
                          size={28}
                          radius="xl"
                          color="teal"
                          variant="filled"
                        >
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </Avatar>
                        <Text fw={600} className="text-[13px] text-[#0F172A]">
                          {member.name}
                        </Text>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <Text fw={500} className="text-[13px] text-[#6B7280]">
                        {joinDate}
                      </Text>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <Text fw={600} className="text-[13px] text-[#0F172A]">
                        {member.position != null ? `#${member.position}` : "-"}
                      </Text>
                    </td>
                    <td className="px-3 py-3.5 sm:px-5">
                      <Text size="sm">{member.status ?? "Unavailable"}</Text>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
