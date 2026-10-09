# ajoti-frontend

See `../AGENTS.md` and `../CLAUDE.md` for cross-cutting workflow rules (propose-before-implementing, commit cadence, push approval, and dated action records). This file is frontend-specific technical detail only.

## Highest-priority coding preference: minimal scope

Treat minimal scope and efficient use of time and usage as the highest-priority coding preference within existing correctness and approval requirements. Most requests should produce a small, direct change. Do not infer permission for a broad audit, redesign, cleanup or extended implementation from a minor request.

When scope is unclear, ask the user early and give concrete examples of the alternatives: for example, "change this label only" versus "update wording throughout the app," or "fix this failing case" versus "review the whole module." Recommend the smallest option that satisfies the request. Do not ask for routine implementation details that are already clear.

Extended work is appropriate when the user explicitly asks for unattended work while going to bed, or requests many changes supported by an implementation Markdown document. Follow the authorized scope; a document alone does not authorize unrelated work. The 10-minute clarification checkpoint remains the default. Waive or adapt it only when the user explicitly authorizes longer or unattended work; do not interrupt authorized overnight work merely to repeat the checkpoint.

## Two active apps, three access levels

- **`apps/admin`** - canonical customer app. Gate: `role === 'MEMBER' || role === 'CIRCLE_ADMIN'`. Shared customer routes are available to both roles; organiser URLs additionally require `CircleAdminRoute`.
- **`apps/super-admin`** - internal staff panel. Coarse gate: `role === 'STAFF'` (`pages/Login.tsx`). Fine-grained gate: `staffRole`-based permission checks via `utils/permissions.ts`.

`apps/user` was consolidated into `apps/admin` and retired. Do not recreate a separate MEMBER implementation; add shared customer behavior to `apps/admin` and guard only the capabilities that differ.

## `StaffAdminRole` naming (intentional inconsistency, don't "fix" it)

`apps/super-admin/src/utils/api.ts` exports `StaffAdminRole` (`'SUPPORT' | 'COMPLIANCE' | 'OPERATIONS' | 'MANAGER' | 'SUPERADMIN'`) - this mirrors the backend's `StaffRole` Prisma enum but keeps its own name. Left as-is deliberately: it's already staff-labeled and not misleading, and renaming it isn't worth the churn across every file that imports it. Don't rename to `StaffRole` to "match" the backend without a reason beyond consistency.

## Files touched by the Role/AdminRole rename (for context if something looks half-migrated)

Backend renamed `Role.ADMIN → CIRCLE_ADMIN`, `Role.SUPERADMIN → STAFF`, added `Role.SYSTEM`, and separately renamed `AdminRole → StaffRole` / `adminRole → staffRole`. Frontend files touched, in case any related bug traces back here:

- `apps/admin/src/pages/Login/Login.tsx`, `apps/admin/src/components/ProtectedRoute.tsx` - Role gate rename (`CIRCLE_ADMIN` only)
- `apps/super-admin/src/pages/Login.tsx`, `apps/super-admin/src/pages/ManageUsers.tsx` - Role gate rename + display labels
- `apps/super-admin/src/components/RequireAuth/RequireAuth.tsx`, `apps/super-admin/src/components/Sidebar/Sidebar.tsx` - `getAdminRoleFromStorage → getStaffRoleFromStorage`
- `apps/super-admin/src/pages/StaffManagement.tsx`, `apps/super-admin/src/pages/StaffSetup.tsx`, `apps/super-admin/src/utils/api.ts` - field rename throughout + `MANAGER` added to assignable roles (SUPERADMIN never assignable via UI - rejected at the API layer regardless of actor)
- `apps/super-admin/src/utils/permissions.ts` - permission table mirror; `MANAGE_ADMIN_ACCOUNTS` is MANAGER+SUPERADMIN-exclusive here too, matching the backend

## Staff dropdown UX rule

Any UI that assigns a `staffRole` (invite modal, change-role modal in `StaffManagement.tsx`) must never offer `SUPERADMIN` as a selectable option - it's rejected server-side unconditionally anyway, but the UI shouldn't offer something that always fails. The staff *list* view still displays existing SUPERADMIN rows (read-only, no action menu - shows "Root account" instead).

## `tsc --noEmit` passing is not sufficient verification - use a real `pnpm build`

Each app's `build` script is `tsc -b && vite build`, but `tsc --noEmit` and `tsc -b` don't always agree - a warm incremental `.tsbuildinfo` cache can make `tsc --noEmit` report clean on files that would actually fail a real build check. Concretely: `ApiError`'s constructor in all three apps' `api.ts` used TS parameter-property shorthand (`constructor(message: string, public readonly code?: number)`), which is incompatible with `erasableSyntaxOnly: true` (set in every `tsconfig.app.json`) - this silently broke `pnpm build` for weeks before it was caught, because every local check happened to run against a cache from before the incompatibility existed.

**Rule:** for any change touching a shared utility (`api.ts`, error classes, anything imported broadly across a codebase) or before marking a frontend code unit complete, run a real `pnpm build` from a cleared cache - not just `tsc --noEmit`, and not just `vite dev` (esbuild strips types without checking them, so it won't catch this class of bug at all). To force a truly clean check: delete `.tsbuildinfo` files first (`find apps -name "*.tsbuildinfo" -delete`), since `tsc -b`'s incremental mode can otherwise skip re-validating files whose cached state predates the actual bug.

## Work cadence

Follow the root AGENTS.md cadence: group related edits, verify once per completed unit with proportionate checks, and commit that unit locally. Repeat checks only for new changes, failures or unresolved risks. Keep progress updates to meaningful findings and blockers; summarize verification briefly at completion.

## Minimalism and the 10-minute checkpoint

Use the smallest correct solution that satisfies the request. Keep simple edits simple: avoid unrelated cleanup, speculative abstractions, extra documentation, new tests that merely mirror the implementation, and repeated checks. Reuse existing code and conventions. Spend effort in proportion to the task and its actual risks; run required checks once per completed unit.

Track elapsed time from starting the task, including investigation, tool runs and verification. If the task is still incomplete after 10 minutes, ask the user to clarify the remaining scope or priorities before expanding the work. Briefly state what is done, what remains and why it is taking longer. Offer a concrete minimal next step. Do not silently turn a simple edit into hours of work or treat silence as approval for broader scope. While awaiting clarification, finish already-running checks and useful work within the agreed scope; pause work that depends on the answer.

Ask earlier when ambiguity materially affects the solution. The time checkpoint does not authorize skipping necessary correctness checks or existing approval rules. Keep communication brief.
