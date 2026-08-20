# Customer app consolidation inventory

Canonical customer application: `apps/admin`.

## Verified overlap

- Authentication by Ajoti email/password, email verification, KYC gates, wallet funding,
  transactions, loans, debts, messages, support tickets, notifications, profile editing,
  saved bank accounts, transaction PIN, and Target Savings existed in both applications.
- `TransactionPinGate` and `useChat` were identical.
- Both API clients used the shared refresh/error infrastructure; their meaningful difference
  was the persisted-key prefix.

## Previously user-only

- Customer home dashboard and quick actions.
- Public Ajo discovery plus join, leave, invite acceptance, personal requests/invites,
  member group detail, contribution history/payment, growth activity, and peer reviews.
- Ajo education articles and organiser-access request.
- Wallet-detail endpoints, pending-withdrawal state, wallet buckets/statistics/status,
  funding-method discovery, and invite/member/review API helpers.
- The old Google button was not retained: it decoded a credential entirely in the browser
  without exchanging it for Ajoti access and refresh tokens. It was not a valid authenticated
  customer session.

## Previously admin-only

- Circle-organiser dashboard, group creation/editing, join-request decisions, member and
  payout management, disbursement/contribution administration, invitations, reminders,
  financial-health views, payout retry/reversal, and scheduler controls.
- Route-level `CircleAdminRoute` protection and capability-aware navigation.
- The more complete profile/security screen, including bank-account management, verified
  email change, account freeze/delete, and transaction-PIN recovery.

## Meaningful differences resolved

- KYC: retained the customer wording and current level/prove-pending behavior instead of
  the old admin-account approval wording.
- Withdrawal: retained the member implementation's pending-withdrawal lockout and refresh
  behavior, together with minimum, KYC, PIN, and saved-account protections.
- Target Savings: retained variable contributions, group invite token, member progress,
  descriptions, validation, and public-plan discovery.
- Ajo API: the authenticated member contribution endpoint is separate from the organiser
  all-members contribution endpoint.
- Notifications: action URLs and legacy invite notifications now navigate into customer
  Ajo routes.
- Storage: neutral customer keys are now canonical. Existing `admin_*` sessions migrate
  once at startup before legacy keys are removed.

## Access matrix

| Capability | MEMBER | CIRCLE_ADMIN |
| --- | --- | --- |
| Customer home, wallet, transactions, KYC, profile, savings, loans, support | Yes | Yes |
| Browse/join/participate in Ajos | Yes | Yes |
| Target Savings | Yes | Yes |
| Organiser dashboard and group management URLs | No (route redirect) | Yes |

Super-admin is unchanged and remains in `apps/super-admin`.
