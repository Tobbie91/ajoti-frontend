import { Text, Badge, Avatar } from "@mantine/core";
import { IconMessageCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

// Circle-wide messaging is intentionally separate from one-to-one admin messaging.
// A group chat is visible to every participating member; do not label it as a private DM.
export function AdminTab({
  circleId,
  circleName,
  statusBadge,
  adminName,
  adminBio,
}: {
  circleId: string;
  circleName: string;
  statusBadge: { bg: string; color: string; label: string };
  adminName: string;
  adminBio: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
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

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-start gap-4">
          <Avatar size={56} radius="xl" color="dark" variant="filled">
            {adminName.charAt(0).toUpperCase()}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Text fw={700} className="text-[18px] text-[#0F172A]">
                {adminName}
              </Text>
              <Badge
                size="sm"
                radius="xl"
                styles={{ root: { backgroundColor: "#02A36E", color: "#FFFFFF", textTransform: "none", fontWeight: 600, fontSize: 11 } }}
              >
                Admin
              </Badge>
            </div>
            <Text fw={400} className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
              {adminBio || "No bio provided."}
            </Text>
            <button
              type="button"
              onClick={() => navigate(`/messages?circleId=${encodeURIComponent(circleId)}`)}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              <IconMessageCircle size={16} />
              Open Group Chat
            </button>
            <Text size="xs" c="dimmed" mt={2}>Messages in this chat are visible to the group's members.</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
