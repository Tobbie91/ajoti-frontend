import { useCallback, useEffect, useState } from "react";
import {
  getMyDebts,
  getRoscaSchedules,
  getCircleContributions,
  type Debt,
  type RoscaCircle,
} from "@/utils/api";
import { kobo } from "@/utils/kobo";

export interface PersonalContribution {
  circleId: string;
  name: string;
  cycle: number;
  cycles: number;
  deadline: string;
  remaining: bigint;
}

/** Only own memberships, own contribution receipts and own debts. No roster/name matching. */
export function useContributionStatus(
  circles: RoscaCircle[],
  ready: boolean,
  membershipError: boolean,
) {
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [debtState, setDebts] = useState<{
    rows: Debt[] | null;
    error: boolean;
  }>({ rows: null, error: false });
  const [paymentState, setPayments] = useState<{
    rows: PersonalContribution[] | null;
    error: boolean;
  }>({ rows: null, error: false });
  const refresh = useCallback(() => {
    setNow(Date.now());
    setVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;
    getMyDebts()
      .then((rows) => {
        if (
          !Array.isArray(rows) ||
          rows.some(
            (row) =>
              kobo(row.outstandingTotal) === null ||
              kobo(row.outstandingTotal)! < 0n,
          )
        )
          throw new Error("Invalid debt balance");
        if (active)
          setDebts({
            rows: rows
              .filter((row) => kobo(row.outstandingTotal)! > 0n)
              .sort(
                (a, b) =>
                  (Date.parse(a.createdAt) || 0) -
                    (Date.parse(b.createdAt) || 0) || a.id.localeCompare(b.id),
              ),
            error: false,
          });
      })
      .catch(() => {
        if (active) setDebts({ rows: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [version]);
  useEffect(() => {
    if (!ready || membershipError) return;
    let active = true;
    const unique = [
      ...new Map(
        circles
          .filter((c) => ["ACTIVE", "STARTED"].includes(c.status.toUpperCase()))
          .map((c) => [c.id, c]),
      ).values(),
    ];
    Promise.all(
      unique.map(async (circle) => {
        const [schedules, receipts] = await Promise.all([
          getRoscaSchedules(circle.id),
          getCircleContributions(circle.id),
        ]);
        if (!Array.isArray(schedules)) throw new Error("Schedule unavailable");
        const pending = schedules.filter((s) =>
          ["UPCOMING", "IN_PROGRESS"].includes(s.status.toUpperCase()),
        );
        let cycle =
          Number.isSafeInteger(circle.currentCycle) && circle.currentCycle! > 0
            ? circle.currentCycle!
            : Math.min(...pending.map((s) => s.cycleNumber ?? Infinity));
        let schedule = pending.find((s) => s.cycleNumber === cycle);
        if (!schedule) {
          if (
            !schedules.some(
              (s) => s.cycleNumber === cycle && s.status === "COMPLETED",
            )
          )
            throw new Error("Current contribution deadline unavailable");
          // Membership data can predate a payout. Fresh completed schedules prove
          // rollover; follow the next active schedule without a full page reload.
          schedule = pending
            .filter((s) => (s.cycleNumber ?? 0) > cycle)
            .sort((a, b) => a.cycleNumber! - b.cycleNumber!)[0];
          if (!schedule) return null;
          cycle = schedule.cycleNumber!;
        }
        if (
          !schedule.contributionDeadline ||
          !Number.isFinite(Date.parse(schedule.contributionDeadline))
        )
          throw new Error("Invalid deadline");
        const expected = kobo(circle.contributionAmount);
        if (expected === null || expected <= 0n)
          throw new Error("Contribution amount unavailable");
        const paid = receipts
          .filter((r) => r.cycleNumber === cycle)
          .reduce((total, r) => total + BigInt(r.amount), 0n);
        return {
          circleId: circle.id,
          name: circle.name,
          cycle,
          cycles: circle.durationCycles,
          deadline: schedule.contributionDeadline,
          remaining: paid >= expected ? 0n : expected - paid,
        };
      }),
    )
      .then((rows) => {
        if (active)
          setPayments({
            rows: rows
              .filter((r): r is PersonalContribution => r !== null)
              .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline)),
            error: false,
          });
      })
      .catch(() => {
        if (active) setPayments({ rows: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [circles, ready, membershipError, version]);
  const retry = useCallback(() => {
    // Memberships belong to the page's initial load; repeat that load when it
    // failed rather than retrying receipts against an unavailable circle list.
    if (membershipError) window.location.reload();
    else refresh();
  }, [membershipError, refresh]);
  return {
    debts: debtState.rows,
    debtError: debtState.error,
    payments: paymentState.rows,
    paymentError: membershipError || paymentState.error,
    loading: !ready || paymentState.rows === null,
    now,
    refresh: retry,
  };
}
export type ContributionStatus = ReturnType<typeof useContributionStatus>;
