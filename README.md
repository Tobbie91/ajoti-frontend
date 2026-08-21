# Ajoti Frontend

Ajoti frontend is a pnpm workspace with two active applications:

- `apps/admin`: the canonical Ajoti customer application for both `MEMBER` and `CIRCLE_ADMIN` accounts. Circle organisers receive additional guarded capabilities inside the same app.
- `apps/super-admin`: the internal staff application.

`apps/user` has been consolidated into `apps/admin` and retired. Do not recreate a separate MEMBER application.

## Tech stack

| Technology | Purpose |
| --- | --- |
| React 19 | UI |
| TypeScript | Type safety |
| Vite | Build/dev server |
| Mantine UI | Components/forms/layout |
| Tailwind CSS | Layout utilities/custom styling |
| React Router | Client-side routing |
| pnpm | Workspace/package manager |

## Current customer app shape

`apps/admin` is the shared customer app for both normal members and circle organisers.

Shared areas include:

- authentication and email verification
- dashboard and quick actions
- wallet and funding
- transactions
- KYC
- profile/security
- bank accounts and transaction PIN flows
- Ajo/ROSCA browsing and participation
- loans/debts
- support/messages/notifications
- Target Savings

Organiser-only circle management routes and actions remain capability/role gated.

## Target Savings

Target Savings is now a live customer feature.

### My Savings

Users can see their individual and group plans, personal progress, remaining target, maturity date and planned contribution cadence.

Contribution rules:

- contributions are manual; there is no auto-debit
- users may contribute more or less than the planned/suggested amount
- multiple contributions are allowed
- contributions stop when the personal target or maturity date is reached
- funds stay locked until maturity even if the target is reached early
- no early withdrawal is currently available

### Group plans

- Public groups appear in **Discover Groups**.
- Users review plan rules before joining.
- Private groups use a shareable Ajoti invite link; users do not handle raw invite tokens.
- Group members share the same per-member target and maturity rules.
- Membership may grow over time, so the displayed group target grows with membership.
- Group creators are labelled **Organiser**, not platform admin.

### Super-admin oversight

The old Target Savings placeholder in `apps/super-admin` has been replaced by a read-only oversight screen with summary metrics, search/filtering and plan/member information. No super-admin money-moving actions are exposed.

## App access model

| Capability | MEMBER | CIRCLE_ADMIN | STAFF app |
| --- | --- | --- | --- |
| Customer dashboard/wallet/profile | Yes | Yes | No |
| Browse/join Ajos | Yes | Yes | No |
| Target Savings | Yes | Yes | Oversight only |
| Circle organiser management | No | Yes | Staff-specific tools only |
| Super-admin/staff operations | No | No | Permission-gated |

## Getting started

### Prerequisites

- Node.js 20+ (use repository `.nvmrc` where applicable)
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

Run the customer app:

```bash
pnpm --filter ajoti-admin dev
```

Build the active apps:

```bash
pnpm build:admin
pnpm build:super-admin
```

Before marking frontend work complete, run a real clean build. See [`AGENTS.md`](AGENTS.md) for the cache/`tsc -b` caveat.

## Environment

Both apps require the backend base URL at build time:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

Use the environment-specific API URL for staging/production. Vite bakes this value into the build.

See [`SERVICES.md`](SERVICES.md) for deployment/service details.

## Project structure

```text
ajoti-frontend/
├── apps/
│   ├── admin/                 # Customer app: MEMBER + CIRCLE_ADMIN
│   └── super-admin/           # Internal staff app
├── packages/                  # Shared workspace code
├── docs/
│   └── user-admin-consolidation.md
├── AGENTS.md                  # Frontend engineering guidance
├── SERVICES.md                # External services/deployment config
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── package.json
```

## API organisation

The frontend API layer has been split into domain modules rather than keeping all requests in one oversized file. Compatibility barrels remain where needed.

When adding a request:

- use the existing shared API client/auth-refresh behaviour
- place the request in the appropriate domain module
- do not call staff/admin-only endpoints from member-safe customer screens
- keep super-admin APIs inside the super-admin app

## Auth/session notes

- `MEMBER` and `CIRCLE_ADMIN` both authenticate through the customer app.
- Staff accounts authenticate through the super-admin app.
- Customer role boundaries must be enforced both in UI routing and backend guards.
- The retired insecure Google-login behaviour was not carried forward; reintroducing Google auth requires a proper backend token exchange.

## Branch / promotion flow

- Development work lands on `dev`.
- Locally tested changes are promoted to `staging` for deployment/testing.
- Production promotion happens only after staging validation and explicit approval.

## Current infrastructure notes

Sentry is not active in the frontend yet. The backend repository contains the current observability/storage handoff. When Sentry is enabled, the customer app and super-admin app should use separate frontend Sentry projects/DSNs rather than sharing the backend project.

## Documentation

- [`docs/user-admin-consolidation.md`](docs/user-admin-consolidation.md): current customer-app consolidation state and capability boundaries.
- [`SERVICES.md`](SERVICES.md): frontend environment/deployment dependencies.
- [`AGENTS.md`](AGENTS.md): frontend-specific engineering rules.

## License

Private
