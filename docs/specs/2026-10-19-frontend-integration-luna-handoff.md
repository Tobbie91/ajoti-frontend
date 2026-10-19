# Luna handoff: finish Ajoti frontend integration

## Start here

This handoff records the earlier checkpoint at `c8c49bd`. The user has since authorized completion, removal of the deadline submission restriction, merging PR #58 into `staging`, and closing PRs #55–#57 as superseded. The current result is recorded in `docs/shared-circle-integration-2026-10-18.md`.

Repository: `ajoti-fintech/ajoti-frontend`, local directory `/workspace/ajoti-frontend`.
Current integration branch: **`feat/shared-circle-integration`**.
The checkpoint commit preserved the original work. PR #58 is the only frontend PR to merge; do not merge #55–#57 separately.

## User-authorized objective and limits

Finish ALL remaining independently implementable frontend work from the approved Ajoti shared-circle plan, not merely the Stage 4 API calls. Continue the existing implementation, reuse components, consolidate compatible changes into this one branch, preserve previous PRs and commits, and stop for review before merging or deploying.

Required outcomes:

1. Canonical `/rosca/:id` for approved members and owners; overview, membership, cycles, deadlines, payout order and group progress; owner-only management; preserve personal and early contributions and payment preferences.
2. Actual member-safe contributions, financial health, expected/collected/outstanding amounts, cycle progress, payout schedules/history and aggregate reviews. Integer-kobo arithmetic, correct envelopes, loading/error/unavailable states. Never invent balances or show private data.
3. Joined/administered/completed navigation and deduplicated counts; Next Deadline with circle AND cycle; upcoming/overdue/planned/completed/unavailable/error states on desktop/mobile.
4. Independent deadline PATCH using `newContributionDeadline`, explicit offset, validation/409 and refresh; make submission available normally to the actual owner and rely on backend authorization and financial-state checks.
5. Completed members retain history and permitted peer-review submission/aggregates; group chat read-only; protect private conversations and deny unauthorized historical reads.
6. Contract and Playwright tests for member, owner, owner-member, completed and unauthorized actors, partial contributions, failed payouts, conflicts, unavailable data, loading, errors and redaction; run typecheck/lint/both real app builds and relevant regressions.
7. Report exact implementation/PR/test/backend dependency/incomplete work and staging acceptance actions. Do not claim live integration without it.

The original seven-stage architecture plan is maintained outside Git and was not available as a complete stage-title document. The current user requirements above are authoritative. Do not invent unrelated Stage 5–7 backend features to fill that gap. The original frontend request is also in `/workspace/attachments/f120d8de-e3fa-4544-b200-4649e58e538e/Pasted text.txt` if that attachment persists.

## Instructions and existing branch history

Read `AGENTS.md`, `.agents/skills/ajoti-financial-safety/SKILL.md`, and `.agents/skills/ajoti-scenario-testing/SKILL.md`. `/workspace/AGENTS.md` and `/workspace/CLAUDE.md` were absent. No workspace Scenerios.md/TODO.md/blockers.md was found. The current user explicitly authorizes a sustained complete implementation, so do not interrupt merely for the default ten-minute scope checkpoint. No sub-agents were used or needed.

Preserved frontend PRs:

- #55, `feat/shared-circle-experience` -> `staging`, shared routes/access/capabilities/history/chat baseline; base head `ab9c3c7`.
- #56, `feat/circle-dashboard-navigation` -> #55 branch, head `f11e9c7`; dashboard/navigation improvements.
- #57, `feat/circle-deadline-extension` -> #55 branch, head `95b582d`; extension contract and updated integration documentation.
- Integration branch was created from #57 and merged `origin/pr-56` with a normal merge commit **`5400544`**. Neither implementation was squashed, duplicated or rewritten. Existing #56/#57 changed-file sets did not conflict.
- Prior review found all three draft PRs mergeable. Recheck remote heads before final integration PR.

## Verified backend contracts

Backend Stages 1–4 are draft PRs #122–#125. Stage 4 source branch is `codex/stage4-shared-circle-access`, stacked on Stage 3. Source contract:

https://github.com/ajoti-fintech/ajoti-backend/blob/codex/stage4-shared-circle-access/docs/specs/2026-10-19-action-stage4-shared-circle-access.md

Read that document and relevant actual DTO/service files again if needed. API paths below include the frontend's global `/api` prefix. Read responses use `{ success, data }`. Amount strings are **integer kobo**; dates are ISO instants.

| GET path | `data` |
|---|---|
| `/api/rosca/:id` | Existing full circle DTO for owner/ACTIVE/COMPLETED member; otherwise safe discoverable preview (`previewOnly`, no protected members/dates). |
| `/api/rosca/:id/schedules` | `[{cycleNumber, contributionDeadline, payoutDate, recipientName, status}]`. No recipient/user IDs. |
| `/api/rosca/:id/progress` | `{circleId,durationCycles,members:[{userId,name,completedCycles,durationCycles,payoutStatus,payoutPosition}]}`. `payoutStatus` PAID/UPCOMING; position nullable. |
| `/api/rosca/:id/contribution-summary?cycleNumber=N` | `{circleId,cycleNumber,totalCollected,contributions:[{memberName,amount,paidAt}]}`. Default current cycle. |
| `/api/rosca/:id/contributions/roster?cycleNumber=N` | `[{memberName,cycleNumber,amount,paidAt}]`. Default current cycle. **No user ID, penalty or late-state fields. Names are not unique IDs.** |
| `/api/rosca/:id/financial-health` | `{circleId,totalCollected,contributionAmount,filledSlots,cycles:[{cycleNumber,contributionDeadline,scheduleStatus,expectedPot,collected,outstanding,expectedCount,collectedCount}]}`. |
| `/api/rosca/:id/disbursements` | `{circleId,schedules:[{cycleNumber,recipientName,payoutDate,contributionDeadline,scheduleStatus,payoutStatus,amountPaidOut,processedAt}]}`. Recipient and settlement fields can be null. |
| `/api/rosca/:id/payouts` | `[{cycleNumber,recipientName,amount,status,processedAt,payoutDate}]`. No IDs, raw recipient objects or contacts. |
| `/api/rosca/:id/reviews/summary` | `[{userId,name,averageRating,totalReviews}]`, 1–5 ratings; no reviewer identities/comments. |

Every protected read is authorized by actual circle ownership or ACTIVE/COMPLETED membership. Global CIRCLE_ADMIN status alone is insufficient. PENDING/REJECTED/EXITED/DEFAULTED/unrelated users are denied. Completed members retain reads. Backend must enforce; UI checks are presentation only.

The personal `/api/rosca/:id/contributions?limit=100&offset=N` endpoint returns only the authenticated user's receipts, including their own penalty. Actual backend controller/service confirms limit/offset pagination, default 20; no page envelope. Personal receipt retention after removal does not authorize shared roster reads.

Owner `/api/admin/rosca/:id/early-payouts` has changed to **aggregate object** `{circleId,totalLoans,activeCount,repaidCount,defaultedCount,cancelledCount}`. Old per-member loan amounts/fees must not be rendered.

Shared financial-health deliberately **omits group remaining/reconciliation balance**. Display unavailable; never derive it by subtracting scheduled payouts. Owner `/api/admin/rosca/:id/financial-health` retains its existing reconciliation balance.

Independent extension contract, source verified in #123:

```
PATCH /api/admin/rosca/:id/schedules/:cycleNumber/extend
{"newContributionDeadline":"2030-10-16T18:00:00+01:00"}
```

200 returns `{message:"Deadline extended successfully"}` only. Strict ISO timestamp with Z/numeric offset required. 400 covers invalid/non-extending/expired cutoff, payout or late-fee processing and cycle-order conflict; 403 non-owner, 404 missing circle/cycle, 409 concurrency conflict. Only actual owner, ACTIVE circle, UPCOMING selected schedule, **before existing cutoff**. Other cycles stay unchanged. Payout is 00:00 WAT on the following WAT calendar day. Stage 3 confirms cutoff times are admin-configured; **23:59:59 must not be silently hardcoded**. At 23:59:59, the next payout is one second later; at 00:00, it is the following calendar day (24 hours later).

## Changes already written in the checkpoint

Review these rather than restarting them:

- `utils/api/shared-circle.ts`: Stage 4 readers/types for health/progress/summary/disbursements/ratings, data-envelope and required-array checks.
- `utils/api/rosca.ts`: safe roster and payout types, cycle-number roster query; schedules recipientName; early-payout aggregate; missing oversight/disbursement data throws instead of invented empty/zero.
- `utils/api/community.ts`: personal receipts fetch all verified limit/offset pages, detect duplicate IDs/incomplete repeated pages, no silent 100-row truncation.
- `utils/kobo.ts`: BigInt parsing/formatting/summing/percentages; malformed/unavailable values stay unavailable; preserves cents above safe Number range.
- `utils/deadline-extension.ts`, `utils/wat-date.ts`: WAT cutoff extraction/explicit timestamp/calendar-day payout and display.
- `growth/SharedCircleFinancials.tsx`: reusable independently loading/retryable health, cycle progress, per-cycle contribution summary, payout schedule/history and aggregate ratings views. Tables scroll on mobile; no invented group balance or name-based user joins.
- `growth/OverviewTab.tsx`: replaced old inferred paid/partial/defaulted roster with the safe shared financial component; preserved personal summary and cycle timeline. Removed synthetic member trust score from `MembersTab`.
- `GrowthActivities.tsx`: shared Payouts tab, aggregate ratings visible to owners, membership-only review submission, shared group+cycle deadline card, exact personal sums, personal-receipt failures do not hide shared health and disable guessed payments.
- `GroupContributionsTab.tsx`: reused safe per-cycle receipt/history table with cycle selector and real error/loading states. Does not invent on-time/late/unpaid labels absent from DTO.
- `GroupPayoutsTab.tsx`, `GroupOverviewTab.tsx`: safe payout recipients/dates/amounts and aggregate early-payout counts. History View Payouts button switches to the payout tab.
- `GroupDetail.tsx`, `GroupMembersTab.tsx`: member payout progress now comes from safe progress API rather than removed recipientId fields. Unknown/paid/completed payout status locks position controls; backend remains authoritative.
- `GroupPaymentsTab.tsx`: exact-kobo totals, dynamic cycle selector; extension controls shown for eligible UPCOMING schedules **before** cutoff, not only stuck/overdue payouts.
- `GroupDetail.tsx` deadline form: explicit TimeInput (WAT, seconds), default existing selected-cycle cutoff, owner may intentionally choose a new time; validates future/new/existing cutoff, handles backend errors, and refreshes schedules after success. Submission has no development-only or production-build restriction. Initial activation text corrected from “24 hours” to following-calendar-day 00:00 WAT.
- `hooks/useCircleDeadline.ts`: shared authorized schedule-based circle/cycle deadline selection, deduplicates IDs and reports failures.
- `Dashboard.tsx`: admin Next Deadline uses that hook, provides circle/cycle link.
- `customer/Home.tsx`: member counts merge/deduplicate participation and completed join history; uses same cycle-aware deadline hook, completed/active navigation, unavailable reads; exact wallet strings instead of error-to-zero.
- `customer/Rosca.tsx`: joined status filter incl completed-history deep link, BigInt personal payment progress; metadata defaults remain unavailable until schedule+receipt reads finish.
- `growth/GrowthTab.tsx`, `PayContributionModal.tsx`: exact personal sums, preserve early payments; wallet errors show unavailable and disable confirmation; no fake zero balance or hardcoded late-fee-rate label.
- `Messages.tsx`: authorize circle detail before mounting group chat; completed members cannot send; denied history does not initiate message reads.
- `packages/shared/src/hooks/useChat.ts`: message merge checks current circle ID so unrelated room/history messages are ignored. Only current admin app uses this shared hook, but staff build still needs completion.
- New unit `tests/circle-financial-contract.test.mjs`; new exact-contract Playwright `e2e/shared-circle-stage4.spec.ts`; existing shared/dashboard/deadline fixtures/tests adapted partly.

## Verification status at pause — do not overclaim

- **PASS:** `node --experimental-strip-types --test tests/circle-access.test.mjs tests/circle-financial-contract.test.mjs`: 7 tests. Covers access presentation, exact huge/negative kobo, unavailable vs zero, WAT 18:00 preservation, 23:59:59/00:00/leap/year boundary and invalid dates.
- **PASS:** forced admin typecheck. `/tmp/ajoti-typecheck.log` is empty on success.
- **PASS:** `pnpm lint`: zero errors, five pre-existing hook/fast-refresh warnings; no new warning.
- **PASS:** clean admin real production build, after deleting `.tsbuildinfo`; normal bundle-size warnings.
- **INTERRUPTED by user pause:** staff production build had passed TypeScript and was transforming Vite modules; no complete staff build result. SIGINT was intentional, not a code failure.
- **INCOMPLETE / FAILURES:** latest Playwright run planned 72 desktop/mobile tests with two workers; stopped after early desktop cases. Some extension and old shared cases passed; no full pass. See failures below.
- No final production-preview gate test has run for the latest edits. Prior #57 gate was tested successfully, but must reverify consolidated code.
- No live staging integration performed. No provider or money-moving calls were made.

Logs copied into `work/luna-handoff/`: `ajoti-typecheck.log`, `ajoti-lint.log`, `ajoti-build.log`, `ajoti-e2e.log`. Temporary Playwright artifacts/screenshots/traces: `/tmp/ajoti-integration-tests/` (may be ephemeral). `work/playwright.integration.config.ts` uses system `/usr/bin/chromium`, video off, two workers, and E2E_BASE_URL. This local config is not intended as a product change.

## Known test failures to fix first

1. `e2e/circle-dashboard-navigation.spec.ts` first two cases: locator `getByText('Next Deadline').locator('..')` is now ambiguous because the new link says “View next deadline · Cycle …”. Use an exact-label locator (`getByText('Next Deadline', {exact:true})`) or stable card semantics. The snapshot actually contained the expected schedule-derived date. Do not change product deadline behavior to satisfy this old locator.
2. New `e2e/shared-circle-stage4.spec.ts` actor cases: `Group financial health` never appears within five seconds for member/owner/owner-member. No useful page snapshot was emitted; root cause **not diagnosed**. Capture `pageerror`/console and inspect screenshots/trace and auth/fixture envelopes before changing product code. The exact fixtures or a runtime exception may be wrong. Completed actor case was interrupted and has “Channel closed”; that is not an independently established product defect.
3. The initial new test fixture parse error was already fixed: a broad edit accidentally changed progress.members array syntax. Current file parses; do not reapply that patch. Owner-only fixture now omits `me` from members so it does not accidentally grant membership.
4. Remaining new tests have not all executed; expect locator/fixture corrections (Mantine selectors, multiple early-payment buttons, completed statuses) before calling the suite green.

## Ordered execution plan for Luna

### A. Stabilize current integration first

1. Confirm this checkpoint branch contains #55/#56/#57 ancestry. Inspect diff and current code; do not recreate branch per stage or redo existing features.
2. Fix the known dashboard exact-label selectors.
3. Run ONLY one failing Stage 4 member case in desktop mode with browser console/page errors captured. Diagnose empty screen/fixture failure. Assert actual route, user and API envelopes. Add correct wallet/commitment fixture shape where applicable instead of arbitrary generic payloads. Distinguish fixture mistakes from production response-validation defects.
4. Re-run Stage 4 role matrix: member, owner not member, owner-member, completed; all non-approved statuses and unrelated global admin. Verify safe reads only, management only owner, no personal contribution request for owner-only, and no private/staff endpoints for members.
5. Review current new code for stale closures, hook dependencies/cancellation, null recipient/status/missing-array behavior, and remaining Number arithmetic on newly consumed financial DTOs. Use the React checklist; reuse current Mantine components (no UI framework migration).

### B. Finish identified frontend gaps (not yet implemented)

1. **Peer-review history/refresh:** `PeerReviewsTab.tsx` still only tracks submissions in local Set. Load existing `/reviews/mine` when completed to mark already-reviewed members; handle errors honestly. After successful POST, refresh `/reviews/summary` without losing the submission result (e.g. parent rating-version callback). Keep owner-only non-members on aggregate display only. Do not expose raw comments/reviewer identities as aggregates. Avoid invalid 0-star submissions.
2. **Payment preference loading:** existing preference selector shows default MANUAL before GET completes. Make loading/unavailable explicit; keep save disabled until verified, validate PATCH response before showing success. Preserve existing AUTOMATIC/MANUAL behavior.
3. **Dashboard/member Home regression tests:** add test covering duplicate participations plus completed join-request-only history, exact counts, cycle-context Next Deadline and completed filter navigation. Add errors for membership/schedules/wallet showing unavailable rather than zero. Use existing tile/component behavior.
4. **Pagination regression:** personal receipts now have verified limit/offset pagination. Add a 100+ receipt contract test to prove totals include page two and no unsafe early-payment target is inferred from truncated history.
5. **Loading/missing data:** add tests for delayed health read while other panels remain available, missing cycles/summary data, retriable failure and no invented zero/NaN/Infinity. New reader checks array presence but audit item/value handling.
6. **Deadline boundary/invalidation tests:** preserve default existing WAT cutoff (e.g.18:00), explicitly test 23:59:59 vs00:00 preview/payload, old-cutoff expiry, failed payout/initiated payout exclusion, 400/403/404/409 messages and successful schedule refetch. The actual owner submits in development and production; backend checks remain authoritative.
7. **Sensitive-data tests:** current new tests inject sentinel bank/wallet/collateral/provider/ledger/debt/review-comment fields and assert no UI exposure; this is frontend rendering evidence, NOT proof of server redaction. Test duplicate display names do not create member ID/debt joins. Add denied chat-history read and same-circle/direct-message isolation checks where actual transport contracts permit.
8. **Completed frontend:** verify completed status/final cycle progress, history selectors, payout status, aggregate reviews and permitted submission. Keep read-only chat behavior and direct-message separation. Explain backend blocker below; do not bypass it.
9. Audit actual remaining frontend calls for Stage 4 source compatibility, especially owner management views that previously relied on removed recipient IDs, loan arrays or trust fields. Already corrected major consumers; don't assume no remaining mismatch without search/build.

### C. Required verification

Start the development server:

```
pnpm --filter ajoti-admin dev --host 127.0.0.1 --port 5190 --strictPort
```

Focused suite command (server must run):

```
E2E_BASE_URL=http://127.0.0.1:5190 pnpm exec playwright test --config work/playwright.integration.config.ts e2e/shared-circle-stage4.spec.ts e2e/shared-circle.spec.ts e2e/circle-dashboard-navigation.spec.ts e2e/circle-deadline-extension.spec.ts
```

Fix targeted failures first, then run relevant `rosca-duration.spec.ts` / `reported-group-flows.spec.ts` regressions. Avoid running the whole unrelated E2E suite blindly.

Run unit tests, forced typecheck, lint, then real clean admin AND staff builds after final edits:

```
node --experimental-strip-types --test tests/circle-access.test.mjs tests/circle-financial-contract.test.mjs
pnpm --filter ajoti-admin exec tsc -b --force
pnpm lint
find apps -name '*.tsbuildinfo' -delete
pnpm build:admin
pnpm build:super-admin
git diff --check
```

Production verification uses the normal admin build and preview, then runs the owner-submission and non-owner-denial tests against the built application. No feature flag is required.

### D. Reviewable final deliverable

1. Update stale `docs/shared-circle-integration-2026-10-18.md` or add a dated implementation record describing current Stage 4 integration, verified DTOs, WAT behavior, actor coverage and exact remaining blockers. That old guide still describes Stage 4 reads as unimplemented.
2. Record precise test counts/commands/results, actual failures and limitations; do not recycle previous #55/#57 evidence as current results.
3. Commit coherent completion units; preserve checkpoint/prior PR commits. Push **this one integration branch** and open ONE consolidated draft PR for review, normally targeting `staging`, explicitly noting it contains preserved #55–#57 work plus integration changes. Do not duplicate the old PRs or close/rewrite them. If reviewer prefers an incremental base, explain its dependency clearly rather than silently retarget existing PRs.
4. Final report: frontend requirement completion matrix, which PRs/branch contain each, tests/builds passed, backend dependencies, functionality incomplete and exact pre-staging/E2E acceptance steps. Stop for review. No merge/deploy.

## Exact external blockers

### Completed group chat backend gap — source-confirmed

At backend Stage 4 branch, `src/modules/chat/chat.service.ts`:

- `assertMemberOrAdmin` around lines47–58 checks `status: MembershipStatus.ACTIVE` only (actual owner bypasses).
- `getUserCircles` around lines97–105 includes ACTIVE memberships only.
- `getMessages` calls that assertion.

Thus a normal **COMPLETED** member cannot list/read previous group chat with current backend source. The Stage 4 financial authorization changes did not alter this chat service. Backend must allow ACTIVE/COMPLETED for LIST/READ and enforce ACTIVE membership + ACTIVE circle for SEND. Do not broaden send authorization while fixing read authorization. Direct-message methods already use ACTIVE/COMPLETED in a separate participant guard; preserve private conversation isolation. Frontend mocked completed-chat tests only demonstrate UI readiness for the needed read contract.

### Live staging is unavailable in this environment

Runtime inspection reports VITE_API_BASE_URL configured, but the actual configured host is **localhost**, and a read-only local health probe returned `URLError`. No confirmed shared staging backend target or authorized test identities were provided. PR #125 is still OPEN/DRAFT; do not assume #122–#125 are deployed. No live staging authorization, database redaction, provider behavior or real extension was verified. Before live acceptance: deploy reviewed backend stack to staging via the user's approved process, supply staging URL and authorized test accounts/circles, then execute role/history/error tests. Money-moving/provider actions require their separate authorization; do not run them opportunistically.

### Member group remaining balance

The member-safe financial-health contract intentionally omits reconciliation remainingBalance. UI must continue displaying unavailable. If a member-visible available/group remaining balance is required for acceptance, backend must provide a separately approved authoritative safe aggregate; frontend must not calculate one from payout schedules.
