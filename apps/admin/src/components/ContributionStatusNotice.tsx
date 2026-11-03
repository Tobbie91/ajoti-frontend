import { Link } from "react-router-dom";
import {
  IconCalendarTime,
  IconAlertCircle,
  IconCoins,
  IconInfoCircle,
} from "@tabler/icons-react";
import type {
  ContributionStatus,
  PersonalContribution,
} from "@/hooks/useContributionStatus";
import { formatKobo, kobo } from "@/utils/kobo";
import "./contribution-status.css";

const watDay = (time: number) =>
  new Date(time + 3_600_000).toISOString().slice(0, 10);
const deadlineLabel = (value: string) =>
  `${new Date(value).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} WAT`;
function titleFor(row: PersonalContribution, now: number) {
  const due = Date.parse(row.deadline);
  if (due <= now) return "Your contribution is overdue";
  if (watDay(due) === watDay(now)) return "Your contribution is due today";
  if (watDay(due) === watDay(now + 86_400_000))
    return "Your contribution is due tomorrow";
  const hours = Math.ceil((due - now) / 3_600_000);
  return `Your contribution is due in ${hours > 48 ? `${Math.ceil(hours / 24)} days` : `${hours} hours`}`;
}

export function ContributionStatusNotice({
  status,
  hidden,
}: {
  status: ContributionStatus;
  hidden: boolean;
}) {
  const { debts, debtError, payments, paymentError, now, refresh } = status;
  const money = (amount: unknown) => (hidden ? "••••••" : formatKobo(amount));
  if (debtError)
    return (
      <section
        className="contribution-notice contribution-notice--soon"
        aria-label="Your outstanding debt"
      >
        <IconInfoCircle aria-hidden="true" />
        <div>
          <h2>Debt balance unavailable</h2>
          <p>We could not confirm your outstanding balance.</p>
        </div>
        <button className="contribution-secondary" onClick={refresh}>
          Retry debt balance
        </button>
      </section>
    );
  if (debts?.length) {
    const debt = debts[0];
    const total = debts.reduce((sum, d) => sum + kobo(d.outstandingTotal)!, 0n);
    const principal = kobo(debt.outstandingPrincipal);
    const penalty = kobo(debt.outstandingPenalty);
    const hasBreakdown =
      principal !== null &&
      penalty !== null &&
      principal >= 0n &&
      penalty >= 0n &&
      principal + penalty === kobo(debt.outstandingTotal);
    return (
      <section
        className="contribution-notice contribution-notice--debt"
        aria-label="Your outstanding debt"
      >
        <IconCoins
          className="contribution-notice-icon"
          size={34}
          aria-hidden="true"
        />
        <div className="contribution-notice-copy">
          <h2>
            {debt.category === "LATE_PENALTY"
              ? "You have an unpaid penalty debt"
              : "You have an unpaid contribution debt"}
          </h2>
          <p>
            {debt.circleName || "Your circle"} · Cycle {debt.cycleNumber ?? "—"}
          </p>
          {debts.length > 1 && (
            <p>{debts.length} outstanding debts · oldest shown first</p>
          )}
        </div>
        <dl className="contribution-debt-amounts">
          {hasBreakdown && (
            <>
              <div>
                <dt>Principal</dt>
                <dd>{money(principal.toString())}</dd>
              </div>
              <div>
                <dt>Penalty / charges</dt>
                <dd>{money(penalty.toString())}</dd>
              </div>
            </>
          )}
          <div className="contribution-debt-total">
            <dt>
              {debts.length > 1
                ? "Total across all debts"
                : "Total outstanding"}
            </dt>
            <dd>{money(total.toString())}</dd>
          </div>
        </dl>
        <div className="contribution-notice-actions">
          <Link className="contribution-primary" to="/debts">
            View and repay debt
          </Link>
        </div>
        <p className="contribution-notice-explanation">
          <IconInfoCircle size={16} aria-hidden="true" />
          Available incoming money clears outstanding debts across your circles,
          oldest first. Only money left afterward can pay a new cycle. Repaying
          an earlier cycle does not pay your current cycle.
        </p>
      </section>
    );
  }
  if (debts === null)
    return (
      <section
        className="contribution-notice contribution-notice--soon"
        aria-label="Your outstanding debt"
      >
        <IconInfoCircle aria-hidden="true" />
        <p>Checking your debt balance…</p>
      </section>
    );
  if (paymentError)
    return (
      <section
        className="contribution-notice contribution-notice--soon"
        aria-label="Your contribution status"
      >
        <IconInfoCircle aria-hidden="true" />
        <div>
          <h2>Contribution status unavailable</h2>
          <p>We could not confirm your payment status. Try again.</p>
        </div>
        <button className="contribution-secondary" onClick={refresh}>
          Retry contribution status
        </button>
      </section>
    );
  const unpaid =
    payments?.filter(
      (p) => p.remaining > 0n && Date.parse(p.deadline) - now <= 48 * 3_600_000,
    ) ?? [];
  const row = unpaid[0];
  if (!row) return null;
  const overdue = Date.parse(row.deadline) <= now;
  return (
    <section
      className={`contribution-notice contribution-notice--${overdue ? "overdue" : "soon"}`}
      aria-label="Your contribution status"
    >
      {overdue ? (
        <IconAlertCircle
          className="contribution-notice-icon"
          size={34}
          aria-hidden="true"
        />
      ) : (
        <IconCalendarTime
          className="contribution-notice-icon"
          size={34}
          aria-hidden="true"
        />
      )}
      <div className="contribution-notice-copy">
        <h2>{titleFor(row, now)}</h2>
        <p>
          {row.name} · Cycle {row.cycle} of {row.cycles}
        </p>
        {unpaid.length > 1 && (
          <p>
            {unpaid.length} contributions need attention · check your circles
          </p>
        )}
      </div>
      <div className="contribution-notice-amount">
        <strong>
          {money(row.remaining.toString())} {overdue ? "unpaid" : "remaining"}
        </strong>
        <p>
          {overdue ? "Deadline was" : "Due"} {deadlineLabel(row.deadline)}
        </p>
        {overdue && <p>Applicable penalty is calculated at payment.</p>}
      </div>
      <div className="contribution-notice-actions">
        <Link className="contribution-primary" to={`/rosca/${row.circleId}`}>
          {overdue ? "Pay overdue contribution" : "Pay contribution"}
        </Link>
        <Link className="contribution-secondary" to={`/rosca/${row.circleId}`}>
          View circle
        </Link>
      </div>
      {!overdue && (
        <p className="contribution-notice-explanation">
          <IconInfoCircle size={16} aria-hidden="true" />
          Missing the deadline may create debt and affect the circle’s payout.
        </p>
      )}
    </section>
  );
}

export function PersonalContributionCard({
  status,
  hidden,
  heading,
}: {
  status: ContributionStatus;
  hidden: boolean;
  heading: string;
}) {
  const row =
    status.payments?.find((p) => p.remaining > 0n) ?? status.payments?.[0];
  const error = status.paymentError;
  return (
    <section
      className="growth-next-contribution contribution-personal-card"
      aria-label={heading}
    >
      <span className="growth-calendar" aria-hidden="true">
        <IconCalendarTime size={30} />
      </span>
      <p className="growth-eyebrow">{heading}</p>
      <h2>
        {error
          ? "Contribution status unavailable"
          : status.loading
            ? "Checking your contribution…"
            : !row
              ? "No scheduled contribution"
              : row.remaining === 0n
                ? "Paid for this cycle"
                : Date.parse(row.deadline) <= status.now
                  ? "Contribution overdue"
                  : titleFor(row, status.now).replace(
                      "Your contribution is due ",
                      "Due ",
                    )}
      </h2>
      {row && !error && (
        <>
          <p>
            {row.name} · Cycle {row.cycle} of {row.cycles}
          </p>
          {row.remaining > 0n && (
            <>
              <strong className="growth-contribution-amount">
                {hidden ? "••••••" : formatKobo(row.remaining.toString())}{" "}
                remaining
              </strong>
              <p>{deadlineLabel(row.deadline)}</p>
            </>
          )}
          <Link className="growth-pay-link" to={`/rosca/${row.circleId}`}>
            {row.remaining === 0n ? "View circle" : "View contribution"}
          </Link>
        </>
      )}
      {error && (
        <button className="contribution-secondary" onClick={status.refresh}>
          Retry contribution status
        </button>
      )}
      {!row && !error && !status.loading && (
        <p>Your next circle deadline will appear here.</p>
      )}
    </section>
  );
}
