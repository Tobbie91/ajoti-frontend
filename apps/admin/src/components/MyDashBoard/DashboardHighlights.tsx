import { Link } from "react-router-dom";
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconCalendar,
  IconLock,
  IconTarget,
} from "@tabler/icons-react";
import type { RoscaCircle, WalletTransaction } from "@/utils/api";
import type { TargetSavingsPlan } from "@/utils/targetSavingsApi";
import type { CircleDeadline } from "@/hooks/useCircleDeadline";
import { formatKobo, kobo, koboPercent } from "@/utils/kobo";

const date = (value: string) =>
  new Date(value).toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function NextContribution({
  deadline,
  circles,
  loading,
  error,
  hidden,
  heading = "Next contribution",
}: {
  deadline: CircleDeadline | null;
  circles: RoscaCircle[];
  loading: boolean;
  error: boolean;
  hidden: boolean;
  heading?: string;
}) {
  const circle = deadline
    ? circles.find((circle) => circle.id === deadline.circleId)
    : null;
  return (
    <section className="growth-next-contribution" aria-label={heading}>
      <span className="growth-calendar" aria-hidden="true">
        <IconCalendar size={30} />
      </span>
      <p className="growth-eyebrow">{heading}</p>
      <h2>
        {loading
          ? "Loading…"
          : error
            ? "Unable to load contribution"
            : deadline
              ? date(deadline.deadline)
              : "No scheduled contribution"}
      </h2>
      {deadline && !loading && !error && (
        <>
          <p>
            {deadline.groupName} · Cycle {deadline.cycleNumber}
            {circle?.durationCycles ? ` of ${circle.durationCycles}` : ""}
          </p>
          <strong className="growth-contribution-amount">
            {hidden ? "••••••" : formatKobo(circle?.contributionAmount)}
          </strong>
          <p>
            Scheduled amount per slot · check your payment status in the circle.
          </p>
          <Link className="growth-pay-link" to={`/rosca/${deadline.circleId}`}>
            View contribution <IconArrowRight size={15} />
          </Link>
        </>
      )}
      {!deadline && !loading && !error && (
        <p>Your next circle deadline will appear here.</p>
      )}
    </section>
  );
}

export function DashboardHighlights({
  plans,
  plansLoading,
  plansError,
  transactions,
  activityLoading,
  activityError,
  hidden,
}: {
  plans: TargetSavingsPlan[];
  plansLoading: boolean;
  plansError: boolean;
  transactions: WalletTransaction[];
  activityLoading: boolean;
  activityError: boolean;
  hidden: boolean;
}) {
  // Joining time identifies the latest goal belonging to this customer.
  const latest = [...plans].sort(
    (a, b) =>
      Date.parse(b.myMembership?.joinedAt || b.startDate) -
      Date.parse(a.myMembership?.joinedAt || a.startDate),
  )[0];
  const membership = latest?.myMembership;
  const saved = kobo(membership?.savedAmountKobo);
  const target = kobo(membership?.targetAmountKobo);
  const percent = koboPercent(
    membership?.savedAmountKobo,
    membership?.targetAmountKobo,
  );
  const progress =
    percent === null ? null : Math.max(0, Math.min(100, percent));
  const recent = [...transactions]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 4);
  return (
    <div className="growth-highlights">
      <section className="growth-activity" aria-label="Recent transactions">
        <div className="growth-strip-heading">
          <h2>Recent transactions</h2>
          <Link to="/transactions">
            View all transactions <IconArrowRight size={15} />
          </Link>
        </div>
        {hidden ? (
          <p>
            <IconLock size={18} /> Transaction history hidden
          </p>
        ) : activityLoading ? (
          <p>Loading activity…</p>
        ) : activityError ? (
          <p role="alert">Unable to load recent activity.</p>
        ) : !recent.length ? (
          <p>No activity yet. Your latest transactions will appear here.</p>
        ) : (
          recent.map((transaction) => {
            const credit = transaction.entryType === "CREDIT";
            const debit = transaction.entryType === "DEBIT";
            const label =
              transaction.description ||
              transaction.movementType?.replaceAll("_", " ").toLowerCase() ||
              transaction.entryType;
            return (
              <Link
                className="growth-activity-row"
                to="/transactions"
                key={transaction.id}
              >
                <span
                  className={`growth-activity-icon ${credit ? "growth-credit" : ""}`}
                >
                  {credit ? (
                    <IconArrowDownLeft size={20} />
                  ) : (
                    <IconArrowUpRight size={20} />
                  )}
                </span>
                <span className="growth-activity-description">
                  <strong>{label}</strong>
                  <small>{date(transaction.createdAt)}</small>
                </span>
                <strong className={credit ? "growth-credit-amount" : ""}>
                  {credit ? "+ " : debit ? "− " : ""}
                  {formatKobo(transaction.amount)}
                </strong>
              </Link>
            );
          })
        )}
      </section>
      <section className="growth-savings-goal" aria-label="Latest savings goal">
        <div className="growth-strip-heading">
          <p className="growth-eyebrow">Your latest savings goal</p>
          <Link to="/target-savings">
            View all goals <IconArrowRight size={15} />
          </Link>
        </div>
        {plansLoading ? (
          <p>Loading savings goal…</p>
        ) : plansError ? (
          <p role="alert">Unable to load savings goals.</p>
        ) : !latest ? (
          <>
            <h2>Make room for your next goal</h2>
            <p>Start saving towards something that matters to you.</p>
            <Link className="growth-view-link" to="/target-savings?create=1">
              Create a savings goal <IconArrowRight size={15} />
            </Link>
          </>
        ) : (
          <>
            <div className="growth-goal-title">
              <span className="growth-goal-icon">
                <IconTarget size={26} />
              </span>
              <div>
                <h2>{latest.name}</h2>
                <p>
                  {hidden
                    ? "••••••"
                    : `${formatKobo(membership?.savedAmountKobo)} of ${formatKobo(membership?.targetAmountKobo)}`}
                </p>
              </div>
              <strong>
                {hidden || progress === null ? "—" : `${Math.round(progress)}%`}
              </strong>
            </div>
            {!hidden && progress !== null && (
              <div
                className="growth-progress"
                role="progressbar"
                aria-label="Savings goal progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
            <div className="growth-goal-details">
              <span>
                <small>Target date</small>
                <strong>
                  {latest.maturityDate
                    ? date(latest.maturityDate)
                    : "Not scheduled"}
                </strong>
              </span>
              <span>
                <small>Remaining</small>
                <strong>
                  {hidden
                    ? "••••••"
                    : saved === null || target === null
                      ? "Unavailable"
                      : formatKobo(
                          String(target > saved ? target - saved : 0n),
                        )}
                </strong>
              </span>
            </div>
            <Link
              className="growth-goal-link"
              to={`/target-savings#target-plan-${encodeURIComponent(latest.id)}`}
            >
              {latest.status === "ACTIVE"
                ? "Add to this goal"
                : "View this goal"}{" "}
              <IconArrowRight size={15} />
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
