# Customer app consolidation inventory

Canonical customer application: `apps/admin`.

`apps/user` has been retired. `apps/admin` is the single customer application for both `MEMBER` and `CIRCLE_ADMIN`; organiser capabilities are exposed only where the account has permission.

## Verified shared customer capability

The canonical app now covers:

- Ajoti email/password authentication and email verification
- KYC
- wallet/funding/withdrawal
- transactions
- loans and debts
- messages and support tickets
- notifications
- profile/security
- saved bank accounts
- transaction PIN and recovery
- Ajo/ROSCA discovery and participation
- Target Savings

The shared API client retains token refresh/error handling and neutral customer session keys.

## Member-safe vs organiser-only boundaries

Member-safe screens use member-safe endpoints. Organiser-only capabilities remain protected by role/capability checks and corresponding backend guards.

Organiser-only functionality includes circle creation/editing, join-request decisions, member/payout management, organiser contribution administration, invitations/reminders and other circle-management operations.

Do not use “admin” in customer-facing copy when the product concept is the circle/group organiser. Platform staff/super-admin is a separate role system.

## Target Savings current state

Target Savings is no longer a placeholder/partial flow.

### Individual

- User chooses target amount, frequency and maturity date.
- Planned/suggested contribution is calculated from the schedule.
- Contributions are manual; no auto-debit.
- Users may contribute more or less than the planned amount and may contribute multiple times.
- Contributions close when the personal target or maturity date is reached.
- Funds remain locked until maturity even if the target is reached early.
- No early withdrawal is currently available.

### Group

- Organiser chooses the per-member contribution amount, frequency and maturity date.
- All members receive the same full per-member target, including members who join later.
- Membership can grow, so the current group target is dynamic.
- Public groups are available through **Discover Groups**.
- Private groups are shared through an Ajoti invitation link. Raw invite tokens are an implementation detail and should not be shown as the user interaction.
- Users review the group rules before joining.
- The creator is labelled **Organiser** in customer UI.
- Maturity returns each member's savings to that member's own Ajoti wallet; there is no organiser/designated-recipient payout option.

Contribution/API errors are rendered visibly in the Target Savings UI rather than requiring browser-console inspection.

## Other consolidation decisions

- KYC retains customer wording and the current level/prove-pending behaviour rather than old admin-account wording.
- Withdrawal keeps pending-withdrawal lockout/refresh behaviour together with minimum, KYC, PIN and saved-account protections.
- Ajo member contribution endpoints remain separate from organiser all-member administration endpoints.
- Notification action URLs and legacy invite notifications navigate into canonical customer routes.
- Neutral customer storage keys are canonical; legacy `admin_*` session keys are migration/compatibility concerns only.
- The previous browser-only Google credential decode was not retained. Any future Google sign-in must exchange the provider credential with the Ajoti backend and receive a normal Ajoti session.

## Access matrix

| Capability | MEMBER | CIRCLE_ADMIN |
| --- | --- | --- |
| Customer home, wallet, transactions, KYC, profile, savings, loans, support | Yes | Yes |
| Browse/join/participate in Ajos | Yes | Yes |
| Target Savings individual/group participation | Yes | Yes |
| Public Target Savings discovery/private invite join | Yes | Yes |
| Organiser dashboard and circle-management URLs | No | Yes |

## Super-admin relationship

`apps/super-admin` remains a separate internal staff application.

It now includes **read-only Target Savings oversight** with summary metrics, filtering/search and plan/member data. This is deliberately oversight only: no undefined super-admin money-moving or maturity-recipient controls should be added without an explicit product requirement.

## Implementation rule going forward

When adding customer functionality:

1. default to `apps/admin`
2. make the shared member experience work for both customer roles
3. gate only the organiser capability that actually differs
4. keep staff/super-admin APIs and screens in `apps/super-admin`
5. do not recreate `apps/user`
