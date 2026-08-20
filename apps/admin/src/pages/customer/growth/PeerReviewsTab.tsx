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
  IconArrowLeft,
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
import { getRatingColor } from "./GrowthTab";

// ── Peer Reviews Tab ──────────────────────────────────────────────────────────

function getRatingLabel(rating: number) {
  if (rating >= 80) return "Excellent";
  if (rating >= 60) return "Good";
  if (rating >= 40) return "Fair";
  return "Poor";
}

export function PeerReviewsTab({
  circleId,
  circleName,
  circleStatus,
  members,
  currentUserId,
}: {
  circleId: string;
  circleName: string;
  circleStatus: string;
  members: CircleMember[];
  currentUserId: string;
}) {
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(
    null,
  );
  const [rating, setRating] = useState(70);
  const [message, setMessage] = useState("");
  const [submitStep, setSubmitStep] = useState<"idle" | "submitting" | "done">(
    "idle",
  );
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const isCompleted = circleStatus.toUpperCase() === "COMPLETED";

  if (!isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F4F6]">
          <IconShieldCheck size={36} color="#9CA3AF" />
        </div>
        <Text fw={600} className="text-[16px] text-[#374151]">
          Peer reviews unlock after completion
        </Text>
        <Text
          fw={400}
          className="max-w-[320px] text-center text-[13px] leading-relaxed text-[#9CA3AF]"
        >
          Once the &ldquo;{circleName}&rdquo; circle completes, you&rsquo;ll be
          able to rate your fellow members here.
        </Text>
      </div>
    );
  }

  async function handleSubmit() {
    if (!selectedMember || rating === 0) return;
    setSubmitStep("submitting");
    try {
      await submitPeerReview(circleId, {
        revieweeId: selectedMember.userId,
        rating: Math.round(rating / 20), // convert 0-100 to 1-5
        comment: message.trim() || undefined,
      });
      setSubmitted((prev) => new Set([...prev, selectedMember.userId]));
    } catch {
      /* still mark as done */
    }
    setSubmitStep("done");
  }

  if (selectedMember) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedMember(null);
              setSubmitStep("idle");
              setRating(70);
              setMessage("");
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#E5E7EB] bg-white"
          >
            <IconArrowLeft size={18} color="#374151" />
          </button>
          <Text fw={700} className="text-[18px] text-[#0F172A]">
            Review {selectedMember.name}
          </Text>
        </div>

        {submitStep === "done" ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <IconCheck size={32} color="#02A36E" />
            </div>
            <Text fw={700} className="text-[18px] text-[#0F172A]">
              Review submitted!
            </Text>
            <Text fw={400} className="text-[13px] text-[#6B7280]">
              Thank you for your feedback.
            </Text>
            <button
              onClick={() => {
                setSelectedMember(null);
                setSubmitStep("idle");
                setRating(70);
                setMessage("");
              }}
              className="cursor-pointer rounded-lg bg-[#02A36E] px-8 py-3 text-[13px] font-semibold text-white"
            >
              Back to Reviews
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="mb-6 flex items-center gap-4">
              <Avatar size={52} radius="xl" color="teal" variant="filled">
                {selectedMember.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text fw={700} className="text-[16px] text-[#0F172A]">
                  {selectedMember.name}
                </Text>
                <Text fw={400} className="text-[13px] text-[#6B7280]">
                  Rate their performance this cycle
                </Text>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <Text fw={600} className="text-[14px] text-[#0F172A]">
                  Performance Rating
                </Text>
                <div className="flex items-center gap-2">
                  <Text
                    fw={800}
                    className="text-[24px]"
                    style={{ color: getRatingColor(rating) }}
                  >
                    {rating}%
                  </Text>
                  <Badge
                    size="sm"
                    radius="xl"
                    styles={{
                      root: {
                        backgroundColor: `${getRatingColor(rating)}15`,
                        color: getRatingColor(rating),
                        border: `1px solid ${getRatingColor(rating)}30`,
                        textTransform: "none",
                        fontWeight: 600,
                      },
                    }}
                  >
                    {getRatingLabel(rating)}
                  </Badge>
                </div>
              </div>
              <Slider
                value={rating}
                onChange={setRating}
                min={0}
                max={100}
                step={5}
                color="#02A36E"
                size="lg"
                marks={[
                  { value: 0, label: "0%" },
                  { value: 50, label: "50%" },
                  { value: 100, label: "100%" },
                ]}
              />
            </div>

            <div className="mt-8">
              <Text fw={600} className="mb-2 text-[14px] text-[#0F172A]">
                Comment (optional)
              </Text>
              <Textarea
                placeholder="Share your experience with this member..."
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                minRows={3}
                radius="md"
                styles={{ input: { borderColor: "#E5E7EB", fontSize: 13 } }}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setSubmitStep("idle");
                }}
                className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] py-3 text-[13px] font-semibold text-[#374151]"
              >
                Cancel
              </button>
              <button
                disabled={submitStep === "submitting"}
                onClick={handleSubmit}
                className="flex-1 cursor-pointer rounded-lg bg-[#02A36E] py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitStep === "submitting"
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Text fw={600} className="text-[15px] text-[#0F172A]">
        Rate your fellow members from the &ldquo;{circleName}&rdquo; circle
      </Text>
      {members.length === 0 ? (
        <Text fw={400} className="text-[13px] text-[#9CA3AF]">
          No other members to review.
        </Text>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {members.map((m) => {
            const alreadyReviewed = submitted.has(m.userId);
            return (
              <button
                key={m.userId}
                onClick={() => {
                  if (!alreadyReviewed) {
                    setSelectedMember(m);
                    setRating(70);
                    setMessage("");
                    setSubmitStep("idle");
                  }
                }}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                  alreadyReviewed
                    ? "cursor-default border-[#D1FAE5] bg-[#F0FDF4]"
                    : "cursor-pointer border-[#E5E7EB] bg-white hover:bg-[#F9FAFB]"
                }`}
              >
                <Avatar size={40} radius="xl" color="teal" variant="filled">
                  {m.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text fw={600} className="text-[12px] text-[#0F172A]">
                  {m.name}
                </Text>
                {alreadyReviewed ? (
                  <Text fw={500} className="text-[11px] text-[#02A36E]">
                    Reviewed ✓
                  </Text>
                ) : (
                  <Text fw={400} className="text-[11px] text-[#9CA3AF]">
                    Tap to review
                  </Text>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
