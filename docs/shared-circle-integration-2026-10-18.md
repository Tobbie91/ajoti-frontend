# Shared circle frontend integration — 19 October 2026

This record describes the consolidated frontend branch `feat/shared-circle-integration`, based on preserved frontend PRs #55–#57. The branch is merged through PR #58 into `staging`; no production deployment was performed.

## Implementation status

| Area | Frontend state | Verification boundary |
|---|---|---|
| Canonical circle view | `/rosca/:id` is shared by authorized members and actual owners; unapproved viewers stay on a preview. Owners retain management controls. | Frontend guards and mocked authorization cases; backend remains authoritative. |
| Member-safe financial views | Circle health, cycle progress, contribution summaries/history, payout schedule/history, and aggregate reviews use the Stage 4 DTOs. Amounts are integer kobo and formatted with `BigInt`; missing or malformed values remain unavailable. | Contract fixtures only; no live staging request. |
| Dashboard and navigation | Joined, administered and completed circles are deduplicated; Next Deadline comes from a circle-scoped schedule and includes its cycle. Upcoming, overdue, completed, planned, unavailable and failed states are represented. | Desktop/mobile mocked browser cases. |
| Independent deadline extension | The actual owner can submit through the cycle-specific PATCH contract. The UI preserves the selected schedule's configured WAT cutoff, validates dates, displays backend errors and refreshes schedules after success. Backend authorization and financial-state checks remain authoritative. | Mocked requests and production-preview tests; no live staging PATCH. |
| Completed history | Completed members can read cycle/contribution/payout history, see aggregate reviews, submit a permitted review once, and use read-only group chat UI. | Mocked frontend behavior; backend staging now permits ACTIVE/COMPLETED group reads and restricts sending to ACTIVE memberships in ACTIVE circles. Not live-tested from this environment. |
| Sensitive data | Shared screens do not render private wallets, bank details, debts, collateral, provider IDs, ledger details, or individual review comments/identities. | Sentinel-field UI tests; this does not prove backend response redaction. |

## Stage 4 member-safe contracts used by the frontend

Source reviewed: [backend Stage 4 shared-circle contract](https://github.com/ajoti-fintech/ajoti-backend/blob/codex/stage4-shared-circle-access/docs/specs/2026-10-19-action-stage4-shared-circle-access.md). Read responses use `{ success, data }`; money fields are integer-kobo strings and dates are ISO instants.

| Endpoint | Frontend use |
|---|---|
| `GET /api/rosca/:id` | Circle details or a safe discoverable preview. Protected members, dates and progress are not inferred from a preview. |
| `GET /api/rosca/:id/schedules` | Cycle context, contribution cutoffs, payout dates and recipient display names. |
| `GET /api/rosca/:id/progress` | Per-member completed cycles, payout position and payout state. The page does not join members to contribution rows by display name. |
| `GET /api/rosca/:id/contribution-summary?cycleNumber=N` | Selected-cycle aggregate and recorded contribution rows. |
| `GET /api/rosca/:id/contributions/roster?cycleNumber=N` | Selected-cycle member-safe contribution history; no user IDs, penalties or late-state are assumed. |
| `GET /api/rosca/:id/financial-health` | Collected, expected and outstanding totals and per-cycle counts. The member DTO has no remaining/reconciliation balance; the UI labels it unavailable and never derives it from scheduled payouts. |
| `GET /api/rosca/:id/disbursements` and `GET /api/rosca/:id/payouts` | Safe payout schedule, recipients, settlement states and history. |
| `GET /api/rosca/:id/reviews/summary` | Aggregate 1–5 ratings and review counts only. |
| `GET /api/rosca/:id/reviews/mine` | The authenticated member's own review history, used only to prevent a duplicate submission. Private comments and reviewer identities are not rendered. |
| `GET /api/rosca/:id/contributions?limit=100&offset=N` | Authenticated member's personal receipts, paged until the complete history is loaded; malformed or repeated pages fail closed. |

Protected circle reads require actual ownership or ACTIVE/COMPLETED membership. A global `CIRCLE_ADMIN` role does not grant access to unrelated circles. Pending, rejected, removed, exited, defaulted and unrelated users remain outside protected views. These frontend states do not replace service/controller authorization.

## Independent deadline extension

The frontend sends:

```http
PATCH /api/admin/rosca/:id/schedules/:cycleNumber/extend
Content-Type: application/json

{"newContributionDeadline":"2030-10-16T18:00:00+01:00"}
```

The selected deadline must include `Z` or an explicit numeric offset. HTTP 400 validation errors remain in the form; HTTP 409 reports a concurrent schedule conflict. After success the frontend reloads schedule data. The existing control remains owner-only, ACTIVE-circle-only, UPCOMING-cycle-only and unavailable after the existing cutoff or after payout processing begins.

The current schedule's WAT cutoff is preserved when the organiser changes only the date. An explicit time change changes that cutoff visibly. The backend schedules payout at 00:00 WAT on the following calendar day: a 23:59:59 WAT cutoff is one second before that payout, while a 00:00 WAT cutoff leaves the payout on the next calendar day. The UI shows this preview and sends an ISO timestamp with `+01:00`; it does not add an early penalty or alter payout timing. The actual circle owner can submit in all builds. The backend remains authoritative for ownership and financial-state validation.

## Remaining integration blockers

1. **Live staging:** backend PRs #122–#125 are merged into backend `staging`, including completed-member group-history reads and ACTIVE-only sending. This environment's sanitized `VITE_API_BASE_URL` is `http://localhost:3001`, not a shared staging host, and no authorized staging test identities/circles are available. No live authorization, server-side redaction, real deadline extension or provider behavior has been verified.
2. **Member remaining balance:** Stage 4 intentionally omits group remaining/reconciliation balance from the member-safe DTO. The frontend shows it as unavailable. If product acceptance requires this value, backend must add an approved authoritative safe aggregate; the frontend must not derive it.

Before live staging acceptance, provide a reachable staging API base URL and authorized accounts/circles for member, owner, owner-member, completed and denied cases. Then run the contract/Playwright matrix against the deployed backend. Recheck server authorization/redaction and the real extension's 400/403/404/409 behavior plus schedule refresh. Do not run money-moving provider operations as part of these read/contract checks.

## Verification

Verification completed on the consolidated branch:

- Focused Playwright regression set: **57/57 desktop Chromium and 57/57 mobile Chromium**. This covers Stage 4 access roles, financial states, deadline validation/conflicts, dashboard navigation, completed history, and responsive layouts. API responses are mocked.
- Production-preview submission: **4/4 desktop/mobile tests passed**; the owner PATCH works on the production build without a feature flag and the non-owner control remains hidden. Mocked backend 403 responses remain visible in the full focused suite.
- `pnpm --filter ajoti-admin exec tsc -b --force`: passed.
- `pnpm lint`: passed with 0 errors and 5 existing warnings in unrelated files.
- Contract regression tests: **7/7 passed** (`tests/circle-access.test.mjs` and `tests/circle-financial-contract.test.mjs`).
- `pnpm build:admin` and `pnpm build:super-admin`: passed. Vite reports existing large JavaScript chunks above 500 kB.
- `git diff --check`: passed.

Live staging authorization, response redaction, API-envelope compatibility and provider behavior remain unverified because the available API host is `http://localhost:3001`, not a shared staging deployment, and no authorized staging identities were available. The deadline action is enabled for the actual owner; backend authorization and financial-state validation must be confirmed in staging.
