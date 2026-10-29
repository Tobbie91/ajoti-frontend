import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconCheck,
  IconPlant2,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { RoscaCircle } from "@/utils/api";
import "./dashboard-theme.css";

type Props = {
  circles: RoscaCircle[];
  loading: boolean;
  error: boolean;
  children: ReactNode;
  detailed?: boolean;
  orbitSummary?: ReactNode;
};

export function CirclesOverview({
  circles,
  loading,
  error,
  children,
  detailed = false,
  orbitSummary,
}: Props) {
  const visible = [
    ...new Map(
      circles
        .filter((circle) => circle.status !== "CANCELLED")
        .map((circle) => [circle.id, circle]),
    ).values(),
  ];
  const active = visible.filter((circle) =>
    ["ACTIVE", "STARTED"].includes(circle.status),
  ).length;
  const completed = visible.filter(
    (circle) => circle.status === "COMPLETED",
  ).length;
  const value = (count: number) => (loading ? "…" : error ? "—" : count);
  return (
    <section
      className={`growth-overview${detailed ? " growth-reference" : ""}`}
      aria-label="Your savings overview"
    >
      <div className="growth-community">
        <div className="growth-community-copy">
          <p className="growth-eyebrow">Your savings community</p>
          <h2>Your circles are in motion</h2>
          <p className="growth-muted">
            Small steps. Shared goals. A brighter tomorrow.
          </p>
          <div className="growth-metrics">
            <div>
              <span className="growth-metric-icon">
                <IconUsersGroup size={21} />
              </span>
              <span>
                <strong>{value(visible.length)}</strong>
                <small>Your circles</small>
              </span>
            </div>
            <div>
              <span className="growth-metric-icon">
                <IconPlant2 size={21} />
              </span>
              <span>
                <strong>{value(active)}</strong>
                <small>Active circles</small>
              </span>
            </div>
            <div>
              <span className="growth-metric-icon">
                <IconCheck size={21} />
              </span>
              <span>
                <strong>{value(completed)}</strong>
                <small>Completed circles</small>
              </span>
            </div>
          </div>
          <Link className="growth-view-link" to="/rosca">
            View your circles <IconArrowRight size={17} />
          </Link>
        </div>
        <div className="growth-orbit">
          <div className="growth-orbit-inner">
            {orbitSummary ?? (
              <>
                <IconPlant2 size={35} stroke={1.3} />
                <strong>
                  Growing
                  <br />
                  together.
                </strong>
                <span>One circle at a time</span>
              </>
            )}
          </div>
          {visible.slice(0, 6).map((circle, index) => (
            <span
              className={`growth-orbit-dot growth-dot-${index}`}
              key={circle.id}
            >
              {circle.name?.slice(0, 2).toUpperCase() || "AJ"}
            </span>
          ))}
        </div>
      </div>
      <div className="growth-wallets">{children}</div>
      {!loading && !error && visible.length > 0 && (
        <div className="growth-circles-strip">
          <div className="growth-strip-heading">
            <h2>Your circles</h2>
            <Link to="/rosca">
              See all circles <IconArrowRight size={15} />
            </Link>
          </div>
          <div className="growth-circle-list">
            {visible.slice(0, 3).map((circle, index) => (
              <Link
                className={`growth-circle growth-circle-${index}`}
                to={`/rosca/${circle.id}`}
                key={circle.id}
              >
                <span className="growth-circle-avatar">
                  {circle.name?.slice(0, 1).toUpperCase() || "A"}
                </span>
                <span>
                  <strong>{circle.name}</strong>
                  <small>
                    {circle.status.replaceAll("_", " ").toLowerCase()}
                  </small>
                  {detailed && (
                    <>
                      <small>
                        {circle.filledSlots ?? 0} filled slots · Cycle{" "}
                        {circle.currentCycle ?? 0} of {circle.durationCycles}
                      </small>
                      {circle.durationCycles > 0 && (
                        <span className="growth-progress" aria-hidden="true">
                          <span
                            style={{
                              width: `${circle.status === "COMPLETED" ? 100 : Math.max(0, Math.min(100, ((circle.currentCycle ?? 0) / circle.durationCycles) * 100))}%`,
                            }}
                          />
                        </span>
                      )}
                    </>
                  )}
                </span>
                <IconArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
