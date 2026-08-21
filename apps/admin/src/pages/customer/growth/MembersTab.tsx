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

      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
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
                Trust Score
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
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(100, member.trustScore ?? 50)}
                          size={6}
                          radius="xl"
                          color="#02A36E"
                          className="w-12 sm:w-16"
                        />
                        <Text fw={600} className="text-[13px] text-[#0F172A]">
                          {member.trustScore ?? 50}
                        </Text>
                      </div>
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
