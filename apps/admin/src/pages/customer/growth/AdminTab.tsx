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

// ── Admin Tab ─────────────────────────────────────────────────────────────────

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
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"compose" | "sending" | "sent">("compose");

  function openModal() {
    setMessage("");
    setStep("compose");
    setModalOpen(true);
  }

  async function handleSend() {
    if (!message.trim()) return;
    setStep("sending");
    try {
      await messageAdmin(circleId, message.trim());
      setStep("sent");
    } catch {
      setStep("compose");
    }
  }

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
                styles={{
                  root: {
                    backgroundColor: "#02A36E",
                    color: "#FFFFFF",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 11,
                  },
                }}
              >
                Admin
              </Badge>
            </div>
            {adminBio ? (
              <Text
                fw={400}
                className="mt-2 text-[13px] leading-relaxed text-[#6B7280]"
              >
                {adminBio}
              </Text>
            ) : (
              <Text fw={400} className="mt-2 text-[13px] text-[#9CA3AF]">
                No bio provided.
              </Text>
            )}
            <button
              onClick={openModal}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg bg-[#02A36E] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              <IconMessageCircle size={16} />
              Message Admin
            </button>
          </div>
        </div>
      </div>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        withCloseButton={false}
        padding={0}
        radius="xl"
        size="sm"
      >
        {step === "compose" && (
          <div className="p-6">
            <Text fw={700} className="text-[17px] text-[#0F172A]">
              Message Admin
            </Text>
            <Text fw={400} className="mt-1 text-[13px] text-[#6B7280]">
              Send a message to {adminName}
            </Text>
            <Textarea
              className="mt-4"
              placeholder="Type your message..."
              minRows={4}
              radius="md"
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              styles={{ input: { borderColor: "#E5E7EB" } }}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className={`flex-1 cursor-pointer rounded-lg py-3 text-[13px] font-semibold text-white ${message.trim() ? "bg-[#02A36E]" : "cursor-not-allowed bg-[#9CA3AF]"}`}
              >
                Send
              </button>
            </div>
          </div>
        )}
        {step === "sending" && (
          <div className="flex flex-col items-center px-6 py-12">
            <Loader color="#02A36E" size="md" />
            <Text fw={600} className="mt-4 text-[15px] text-[#0F172A]">
              Sending your message…
            </Text>
          </div>
        )}
        {step === "sent" && (
          <div className="flex flex-col items-center px-6 py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconMessageCircle size={32} color="#02A36E" />
            </div>
            <Text fw={700} className="mt-4 text-[17px] text-[#0F172A]">
              Message sent!
            </Text>
            <Text
              fw={400}
              className="mt-1 text-center text-[13px] text-[#6B7280]"
            >
              {adminName} will be notified and can see your message.
            </Text>
            <button
              onClick={() => setModalOpen(false)}
              className="mt-6 w-full cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
