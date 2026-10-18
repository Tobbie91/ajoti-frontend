# Shared circle frontend integration — 18 October 2026

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
| `GET /api/rosca/:id` | Circle/preview, `isRequestingUserAdmin`, `userMembershipStatus` or own roster membership. Unknown status fails closed. Backend must independently enforce ACTIVE/COMPLETED access and safe previews. |
| `GET /api/rosca/:id/schedules` | Cycle number, contribution deadline, payout date, recipient, status. No invented dates. Completed-member access requires backend confirmation. |
| `GET /api/rosca/:id/contributions/roster` | Existing documented member/admin roster: member ID/name, cycle, amount, paid timestamp, late status. Shared views render only these fields. Full historical coverage/pagination must be confirmed. |
| `GET /api/rosca/:id/contributions?limit=100` | Existing personal payment flow retained. Coverage beyond 100 rows requires a verified pagination contract. |
| `GET /api/chat/circles`, `GET /api/chat/circles/:id/messages` | Existing history. Completed-circle inclusion and historical access still require backend verification. |
| `GET /api/rosca/my-join-requests`, `/my-participations` | Joined/completed lists deduplicated by circle ID. Completed metadata retention must be guaranteed by backend. |
| `GET /api/admin/rosca/:id/financial-health` | Remains management-only; never called from shared member views. |
| `PATCH /api/admin/rosca/:id/schedules/:cycle/extend` | Existing client sends `newPayoutDate` for old behavior. New form does not call it. |

## Required backend contracts before remaining integration

No new endpoint names have been assumed or added. Backend owners must confirm final paths, response shapes, and access rules for:

1. **Member-safe financial health**: circle ID/status, currency, authoritative `totalCollectedKobo`, `remainingBalanceKobo`, and per-cycle cycle number/status, expected/collected/outstanding amounts, counts, contribution deadline, payout timestamp, recipient ID/display name, and settlement status. Amounts must be integer kobo strings; absent values must be distinguishable from zero. Do not infer group balance by subtracting scheduled payouts. Exclude wallets, debts, bank accounts, collateral, ledger/provider references and diagnostics.
2. **Member-safe payout history**: cycle number, recipient display name/ID, actual settled amount, currency, settlement status, processed timestamp and documented pagination. Existing `/api/rosca/:id/payouts` is used by management, but its member authorization and complete safe projection cannot be verified here. Final shared payout-history integration is deferred rather than exposing the raw management payload.
3. **Aggregate peer ratings**: member display ID/name, average rating, rating scale, count, and visibility policy. Individual review submissions are not a reliable aggregate. Do not expose reviewer identities/comments as aggregates.
4. **Independent-cycle extension**: final path/method, cycle selector, exact contribution-deadline request field and WAT cutoff/time handling, response containing the selected updated schedule with next-day 00:00 WAT payout, and proof other cycles are unchanged. Specify validation errors and conflict codes/messages for settled cycles, non-extension dates, overlapping cycles and concurrent edits. On integration, refresh detail, schedules, roster/payment progress, financial summary and dashboard deadlines. Do not reuse `newPayoutDate` without verification.
5. **Next Deadline**: group ID/name, cycle number, deadline timestamp and planned/upcoming/overdue/completed/unavailable states for both membership and administered groups, deduplicated by circle ID. Existing admin dashboard supplies group name and timestamp only; cycle association and the combined dashboard remain deferred.
6. **Access retention**: ACTIVE and COMPLETED members allowed safe reads, completed chat read-only server-side, pending/rejected/removed denied protected reads, own receipts/account history retained. Confirm historical rosters, schedule pagination and chat list inclusion. Frontend capability checks are presentation gates, not security enforcement.

## Remaining work

Integrate and browser-test the above contracts once implemented. Full shared financial totals, settlement history, aggregate ratings, combined dashboard counts/cycle-aware deadline states, and independent deadline submission are intentionally incomplete. Existing safe UI and contribution controls remain in use. No backend code, deployment, or merge is part of this branch.

## Verification

- `pnpm lint`: pass, zero errors and five existing hook/refresh warnings.
- `pnpm --filter ajoti-admin exec tsc -b --force`: pass.
- Clean customer production build and staff production build: pass; existing bundle-size warnings remain.
- `node --experimental-strip-types --test tests/circle-access.test.mjs`: 4 pass.
- Shared-circle Playwright coverage: 22 desktop/mobile cases pass across the shared-page, management, and completed-list checks. All 12 existing duration/deadline/navigation cases pass after updating canonical routes, current labels, authoritative schedule fixtures, and navigation readiness assertions.
- Browser checks use system `/usr/bin/chromium` through an untracked local config, with video disabled because the bundled Chromium/ffmpeg were unavailable. Tests use API fixtures; no live backend or database integration is claimed.
