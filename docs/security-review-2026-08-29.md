# Local security check report — 2026-08-29

## Execution

- `pnpm audit --audit-level=low`: executed against the npm advisory service.
- Semgrep and Gitleaks: not executed because neither CLI is installed locally. Their local configurations and repeatable commands were added.
- Manual source search found no `eval`, `Function`, `document.write`, or `dangerouslySetInnerHTML` sink. Dynamic navigation matches resolve to fixed `/login`, `/maintenance`, reloads, or encoded internal KYC paths and are not confirmed open redirects.
- Both frontend production builds passed before this tooling-only change. No dependency or runtime source was changed.

## Dependency findings

Audit totals: 0 Critical, 35 High, 21 Medium, 2 Low. Counts are advisory/path counts, not 58 distinct exploitable application vulnerabilities.

| Severity | Package group | Ownership and reachability | Assessment |
| --- | --- | --- | --- |
| High and Medium | `axios@0.21.4` | Runtime transitive dependency of direct `flutterwave-react-v3@1.3.3` in the customer/admin app. Multiple SSRF, credential-leakage, prototype-pollution, DoS, and redirect/proxy advisories; fixed releases require a substantially newer Axios chain. | Production blocker pending review of replacing/upgrading the Flutterwave wrapper or proving the vulnerable Axios paths are not bundled/reachable. Do not force an Axios override without payment-flow testing. |
| High | `vite@7.3.0`, `rollup@4.53.5`, `postcss@8.5.6` | Direct or transitive build/dev-server tooling. Several file-read/write, path traversal, WebSocket, and source-map advisories. | Primarily developer/build exposure; upgrade the direct Vite toolchain in a tested maintenance change. Do not expose the dev server to untrusted networks. |
| High and Medium | `minimatch`, `brace-expansion`, `flatted`, `js-yaml`, `picomatch`, `nanoid`, `ajv` | Transitive lint/build tooling paths. Mostly ReDoS, resource exhaustion, parsing, or glob behavior. | Review lockfile refresh/compatible direct-tool upgrades; lower deployed-browser reachability than the Flutterwave/Axios chain. |
| Medium and Low | `postcss`, `@babel/core`, additional Axios advisories | Build tooling or the same Flutterwave runtime chain. | Track with the parent package remediation rather than independent blind overrides. |

No advisory was automatically upgraded, suppressed, or accepted. Machine-readable results can be regenerated with `pnpm security:cve:json > security-audit.json`.

## Secrets, false positives, and production blockers

No secret-scan result is claimed while Gitleaks is unavailable. No specific credential is allowlisted. The fixed internal navigation matches are expected Semgrep review items, not confirmed vulnerabilities.

The Flutterwave/Axios High findings should block production until the payment integration is reviewed. Tooling-only High findings require prompt remediation but can be risk-ranked separately when build/dev servers are isolated. Install Semgrep and Gitleaks, run `pnpm security:all`, then add pinned, read-only GitHub Actions jobs with JSON/SARIF artifacts.
