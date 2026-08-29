# Local security checks

These automated checks support an OWASP-oriented review; they do not establish OWASP compliance.

## Commands

- `pnpm security:cve`: npm advisory scan, blocking on High or Critical findings.
- `pnpm security:cve:json > security-audit.json`: machine-readable dependency results.
- `pnpm security:sast`: local Semgrep checks for dynamic execution, DOM HTML injection, unsafe navigation, and weak hashes.
- `pnpm security:sast:json`: writes `security-semgrep.json`.
- `pnpm security:secrets`: redacted Git-history scan using Gitleaks.
- `pnpm security:secrets:json`: writes `security-gitleaks.json`.
- `pnpm security:all`: runs all blocking checks.

Install the Semgrep and Gitleaks CLIs separately and ensure they are on `PATH`. The backend repository exposes the same command names with server-specific rules. Build output, dependencies, example configuration, and test fixtures are excluded to reduce noise.

## Release policy

- Critical findings block release unless a security owner records a time-limited exception.
- High findings normally block release.
- Medium findings require review and a remediation plan or documented acceptance.
- Low findings are tracked for maintenance unless application context increases impact.
- Any credible secret finding blocks release until revocation and incident review.

Review direct versus transitive ownership, runtime reachability, and fix availability. Do not blindly upgrade payment packages or framework dependencies. Accepted risks and false positives belong in `security/accepted-risks.yml` with an owner, justification, compensating controls, and expiry date.

OWASP ZAP is excluded from the default workflow because it requires a safe running target. A future baseline scan may target a disposable localhost environment or explicitly approved staging environment, never production.

`.github/workflows/security.yml` provides separate dependency, Semgrep, and Gitleaks jobs for pull requests and pushes to `dev`, `staging`, and `main`. Actions are pinned to commit SHAs and workflow permissions are read-only.
