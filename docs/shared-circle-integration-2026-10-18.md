# Shared circle frontend integration — 18 October 2026

## Contract review update — 19 October 2026

Reviewed the client calls in PRs #55–#57 against backend PR #123. PR #123 confirms the independent deadline endpoint contract below. Its backend behavior is source-verified, but it is not a live integration result: the backend PR is still open, and frontend tests use mocked responses.

Branch: `feat/shared-circle-experience`, based on remote staging `691598c`.

## Implemented

- `/rosca/:id` is the customer group entry point. Legacy activity URLs preserve query/payment shortcuts; legacy organiser detail URLs redirect to the canonical route with `view=manage`.
- ACTIVE and COMPLETED memberships use the existing activity overview, cycle schedules, roster, progress, and completed peer-review submission components. Circle owners see the same shared page plus a management link. Owners who are approved members retain personal contribution and early-payment flows.
- Unapproved/unknown memberships get a preview without protected schedule, roster, or review requests. The backend detail response remains authoritative; previews cannot be promoted by query strings. All backend authorization remains unchanged.
- The contribution-history component is reused in shared and management views. Failed roster/history loads show errors instead of empty results or invented unpaid statuses. Currency presentation preserves two decimal places.
- Completed memberships from join-request history are included in Joined, deduplicated with participation IDs. Existing administered-group navigation remains available.
- Chat sending requires a fresh detail response confirming ACTIVE membership and ACTIVE circle. Completed history remains readable where the backend permits it; failed permission reads leave sending disabled.
- Customer payout retry/reversal controls and their handlers are removed. Existing authorised manual due-payout action is retained.
- Deadline form previews one selected cycle's new contribution date and next-day 00:00 WAT payout, states future cycles stay unchanged, and warns about compression. Submission is disabled: no calls to the legacy cascading extension API.
- Admin wallet API failures no longer display zero balances. Group dashboard/deadline errors are explicit. Peer-review submission failures no longer show success.

## Verified frontend contracts and limitations

These are existing client contracts and fixture-backed browser behavior, not confirmation of live backend implementation. The environment does not provide verified readiness for `VITE_API_BASE_URL`; no backend source was available or modified.

| Existing API | Use and limits |
| --- | --- |
| `GET /api/rosca/:id` | Circle/preview, `isRequestingUserAdmin`, `userMembershipStatus` or own roster membership. Unknown status fails closed. Stage 4 must authorize each circle read in backend services/controllers and return only member-safe fields. |
| `GET /api/rosca/:id/schedules` | Client uses cycle number/status, contribution deadline, payout date and recipient display information. No invented dates. Stage 4 must allow owners and ACTIVE/COMPLETED members to read current and completed history; completed history coverage must be confirmed. |
| `GET /api/rosca/:id/contributions/roster` | Client uses member reference/name, cycle, amount, paid timestamp and late status. Stage 4 must return a safe projection and omit per-member penalty/debt, collateral, wallet/bank, provider and ledger data. Full history and pagination behavior must be explicit. |
| `GET /api/rosca/:id/contributions?limit=100` | Existing personal payment flow retained. Coverage beyond 100 rows requires a verified pagination contract. |
| `GET /api/chat/circles`, `GET /api/chat/circles/:id/messages` | Existing history. Completed-circle inclusion and historical access still require backend verification. |
| `GET /api/rosca/my-join-requests`, `/my-participations` | Joined/completed lists deduplicated by circle ID. Completed metadata retention must be guaranteed by backend. |
| `GET /api/admin/rosca/:id/financial-health` | Remains management-only; never called from shared member views. Stage 4 needs a confirmed member-safe read contract before any shared view uses it. |
| `GET /api/rosca/:id/payouts` | Current payout-history client is used in management. Its `Payout` type includes recipient contact fields; do not reuse this raw shape in member views. Stage 4 must provide a safe projection and documented pagination. |
| `GET /api/rosca/:id/reviews/mine` and `GET /api/rosca/:id/reviews` | The former is used for the current user's review history; the latter feeds management review rows. Neither is an aggregate peer-review DTO. Do not expose individual reviewer identities/comments as aggregate data. |
| `PATCH /api/admin/rosca/:id/schedules/:cycle/extend` | PR #123 confirms the independent contract below. The form is owner-management-only and deployed submission remains disabled until the backend is available and integration-tested. |

### Verified independent deadline contract from backend PR #123

The frontend call matches the controller and validated DTO in PR #123:

```http
PATCH /api/admin/rosca/{circleId}/schedules/{cycleNumber}/extend
Content-Type: application/json

{"newContributionDeadline":"2030-10-16T18:00:00+01:00"}
```

The request must contain `newContributionDeadline` as a strict ISO timestamp with `Z` or an explicit numeric offset. The UI currently sends the selected WAT calendar date at `23:59:59+01:00`. Success is HTTP 200 with `{"message":"Deadline extended successfully"}`; the response does not include a schedule. The backend derives payout for 00:00 WAT on the following calendar day and changes only the selected cycle. HTTP 400 covers invalid/expired dates and payout, late-fee or cycle-ordering conflicts; 403 is not the circle owner; 404 is a missing circle/cycle; HTTP 409 is a concurrent schedule change. The client handles validation and 409, then refetches financial health and admin disbursement schedules after success. The old `newPayoutDate` body is rejected.

The admin route/service remains the authorization boundary. The frontend control is shown only in the management view, and submission requires both a development build and an explicit `VITE_ENABLE_CIRCLE_DEADLINE_EXTENSION=true` opt-in. Production builds cannot enable submission with that flag. Mocked browser tests cover the payload, WAT offset, validation, 409, post-success refresh, member visibility and production gate; staging integration remains blocked while PR #123 is open.

## Required backend contracts before remaining integration

No new Stage 4 endpoint paths have been assumed or added. Backend owners must confirm routes and implement the following exact consumer contracts and access rules before the shared views integrate them:

1. **Authorization for every circle-scoped read**: the actual circle owner and members with `ACTIVE` or `COMPLETED` membership may read the permitted circle data. A global `CIRCLE_ADMIN` role alone grants no access to an unrelated circle. Pending, rejected, removed and unrelated users are denied protected reads. Completed membership keeps authorized historical reads and remains read-only. Enforce this in backend services/controllers, not only route guards or frontend capabilities. Management stays owner-only; financial recovery actions stay staff-only.
2. **Group progress**: circle ID/name/status and per-cycle number/status, completion state, contribution deadline and payout timestamp, plus counts and totals required by the existing progress views. Totals must come from authoritative backend data; amounts are integer kobo strings, and unavailable values must be explicit (`null`/unavailable), never synthesized as zero or calculated from payout schedules.
3. **Member-safe contributions**: the roster view needs a circle-member reference/display name, cycle number, amount, payment timestamp and late/on-time state. Amounts are integer kobo strings. Exclude personal debt/penalty amounts, collateral, private wallet/bank details, provider IDs and internal ledger data. Specify completeness and pagination for historical cycles.
4. **Member-safe financial health**: circle ID/status/currency; authoritative `totalCollectedKobo` and `remainingBalanceKobo`; and per-cycle number/status, expected/collected/outstanding amounts, expected/collected counts, contribution deadline, payout timestamp, recipient display name/reference and settlement status. Amounts are integer kobo strings; nullable/unknown must be distinguishable from zero. Do not infer group balances by subtracting scheduled payouts. Exclude wallets, debts, bank accounts, individual collateral, ledger/provider references and diagnostics.
5. **Payout schedules and history**: cycle number/status, contribution deadline, scheduled payout timestamp, recipient display name, actual settled amount/currency, settlement status and processed timestamp, with documented history pagination. Do not reuse the management `Payout` payload, which includes recipient contact data; exclude wallet/bank details, provider IDs, internal ledger details and individual collateral.
6. **Aggregate peer-review data**: reviewed member reference/display name, average rating, rating scale and review count, with visibility/aggregation policy. Individual submissions are not a reliable aggregate. Never include reviewer identities or comments in the aggregate response.
7. **Navigation and deadlines**: preserve circle ID/name/status and membership state for completed records in the joined-history source so PR #56 can deduplicate without losing completed history. The current admin dashboard supplies `nextDeadline.groupName` and `deadline` only; it has no cycle number. PR #56 does not fabricate one. Any unified member/admin deadline API must identify circle and cycle and distinguish upcoming, overdue, completed, unavailable and error states.

## Remaining work

Integrate and browser-test the Stage 4 member-safe contracts once implemented and available in a shared backend environment. Full shared financial totals, settlement history and aggregate ratings remain incomplete. PR #57's deadline request is source-matched to PR #123 but has only mocked frontend verification; leave deployed submission disabled until staging integration verifies the real request, owner authorization, 400/409 behavior and refreshed schedules. No backend code, deployment or merge is part of this frontend work.

## Verification

- `pnpm lint`: pass, zero errors and five existing hook/refresh warnings.
- `pnpm --filter ajoti-admin exec tsc -b --force`: pass.
- Clean customer production build and staff production build: pass; existing bundle-size warnings remain.
- `node --experimental-strip-types --test tests/circle-access.test.mjs`: 4 pass.
- Shared-circle Playwright coverage: 22 desktop/mobile cases pass across the shared-page, management, and completed-list checks. All 12 existing duration/deadline/navigation cases pass after updating canonical routes, current labels, authoritative schedule fixtures, and navigation readiness assertions.
- Browser checks use system `/usr/bin/chromium` through an untracked local config, with video disabled because the bundled Chromium/ffmpeg were unavailable. Tests use API fixtures; no live backend or database integration is claimed.
