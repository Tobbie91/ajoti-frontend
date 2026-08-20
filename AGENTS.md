# ajoti-frontend

See `../AGENTS.md` for cross-cutting workflow rules (propose-before-implementing, commit cadence, push approval, logging to the completed-changes doc). This file is frontend-specific technical detail only.

## Two active apps, three access levels

- **`apps/admin`** — canonical customer app. Gate: `role === 'MEMBER' || role === 'CIRCLE_ADMIN'`. Shared customer routes are available to both roles; organiser URLs additionally require `CircleAdminRoute`.
- **`apps/super-admin`** — internal staff panel. Coarse gate: `role === 'STAFF'` (`pages/Login.tsx`). Fine-grained gate: `staffRole`-based permission checks via `utils/permissions.ts`.

`apps/user` was consolidated into `apps/admin` and retired. Do not recreate a separate MEMBER implementation; add shared customer behavior to `apps/admin` and guard only the capabilities that differ.

## `StaffAdminRole` naming (intentional inconsistency, don't "fix" it)

`apps/super-admin/src/utils/api.ts` exports `StaffAdminRole` (`'SUPPORT' | 'COMPLIANCE' | 'OPERATIONS' | 'MANAGER' | 'SUPERADMIN'`) — this mirrors the backend's `StaffRole` Prisma enum but keeps its own name. Left as-is deliberately: it's already staff-labeled and not misleading, and renaming it isn't worth the churn across every file that imports it. Don't rename to `StaffRole` to "match" the backend without a reason beyond consistency.

## Files touched by the Role/AdminRole rename (for context if something looks half-migrated)

Backend renamed `Role.ADMIN → CIRCLE_ADMIN`, `Role.SUPERADMIN → STAFF`, added `Role.SYSTEM`, and separately renamed `AdminRole → StaffRole` / `adminRole → staffRole`. Frontend files touched, in case any related bug traces back here:

- `apps/admin/src/pages/Login/Login.tsx`, `apps/admin/src/components/ProtectedRoute.tsx` — Role gate rename (`CIRCLE_ADMIN` only)
- `apps/super-admin/src/pages/Login.tsx`, `apps/super-admin/src/pages/ManageUsers.tsx` — Role gate rename + display labels
- `apps/super-admin/src/components/RequireAuth/RequireAuth.tsx`, `apps/super-admin/src/components/Sidebar/Sidebar.tsx` — `getAdminRoleFromStorage → getStaffRoleFromStorage`
- `apps/super-admin/src/pages/StaffManagement.tsx`, `apps/super-admin/src/pages/StaffSetup.tsx`, `apps/super-admin/src/utils/api.ts` — field rename throughout + `MANAGER` added to assignable roles (SUPERADMIN never assignable via UI — rejected at the API layer regardless of actor)
- `apps/super-admin/src/utils/permissions.ts` — permission table mirror; `MANAGE_ADMIN_ACCOUNTS` is MANAGER+SUPERADMIN-exclusive here too, matching the backend

## Staff dropdown UX rule

Any UI that assigns a `staffRole` (invite modal, change-role modal in `StaffManagement.tsx`) must never offer `SUPERADMIN` as a selectable option — it's rejected server-side unconditionally anyway, but the UI shouldn't offer something that always fails. The staff *list* view still displays existing SUPERADMIN rows (read-only, no action menu — shows "Root account" instead).

## `tsc --noEmit` passing is not sufficient verification — use a real `pnpm build`

Each app's `build` script is `tsc -b && vite build`, but `tsc --noEmit` and `tsc -b` don't always agree — a warm incremental `.tsbuildinfo` cache can make `tsc --noEmit` report clean on files that would actually fail a real build check. Concretely: `ApiError`'s constructor in all three apps' `api.ts` used TS parameter-property shorthand (`constructor(message: string, public readonly code?: number)`), which is incompatible with `erasableSyntaxOnly: true` (set in every `tsconfig.app.json`) — this silently broke `pnpm build` for weeks before it was caught, because every local check happened to run against a cache from before the incompatibility existed.

**Rule:** for any change touching a shared utility (`api.ts`, error classes, anything imported broadly across a codebase) or before marking frontend work done, run a real `pnpm build` from a cleared cache — not just `tsc --noEmit`, and not just `vite dev` (esbuild strips types without checking them, so it won't catch this class of bug at all). To force a truly clean check: delete `.tsbuildinfo` files first (`find apps -name "*.tsbuildinfo" -delete`), since `tsc -b`'s incremental mode can otherwise skip re-validating files whose cached state predates the actual bug.
