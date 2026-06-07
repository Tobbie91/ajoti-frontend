# Contributing to Ajoti Frontend

Thank you for contributing. These guidelines apply to this repository and all other Ajoti repos.

---

## Branching Strategy

We use **trunk-based development** with short-lived feature branches.

```
main       — production-ready code; protected, requires PR + review
staging    — pre-production integration branch
dev        — active development integration
feat/*     — short-lived feature branches (branch from dev)
fix/*      — bug fix branches
hotfix/*   — urgent production fixes (branch from main)
```

Branch naming examples:
- `feat/withdraw-saved-accounts-flow`
- `fix/transaction-release-direction`
- `hotfix/kyc-widget-crash`

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer: issue/ticket ref]
```

**Types:** `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `perf` · `ci`

**Ajoti scopes:**
`auth` · `wallet` · `payments` · `kyc` · `rosca` · `notifications` · `profile` · `admin` · `superadmin` · `ui` · `infra`

Examples:
```
feat(rosca): add Leave Circle button on GroupDetails page
fix(wallet): show RELEASE entries as positive credit
chore(deps): bump mantine to 7.14
docs(readme): update app URLs table
```

---

## Pull Requests

- PRs must target `dev` (or `staging` for release candidates). **Never directly to `main`.**
- Fill out the PR template completely — incomplete PRs will not be reviewed.
- All CI checks must pass before merge.
- Minimum **1 approval** required.
- **2 approvals required** for anything touching: auth flows, payment/wallet UI, PIN entry, KYC widget, or admin/superadmin access controls.
- Keep PRs small and focused — one concern per PR.

### Review Expectations

**For reviewers:**
- Review within 24 hours (business days).
- Be specific and constructive.
- Approve only what you'd be comfortable owning.

**For authors:**
- Respond to all comments before merging.
- Don't force-push after review has started.

---

## Issue Reporting

Use the appropriate issue template:
- 🐛 **Bug Report** — something is broken or behaving unexpectedly
- ✨ **Feature Request** — new capability or enhancement
- 🔒 **Security Issue** — email **security@ajoti.com** directly; do not open a public issue

---

## Security & Sensitive Data

- **Never commit** API keys, secrets, tokens, or PII.
- Use `.env.example` files (per app) to document required environment variables.
- Accidental secret commit → **rotate the credential immediately** and notify the team.

---

## Questions?

Open a Discussion in the relevant repo, or reach out on the team's communication channel.
