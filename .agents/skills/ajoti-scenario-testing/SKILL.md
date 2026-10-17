---
name: ajoti-scenario-testing
description: Use when auditing Ajoti's real-world scenarios, mapping them to current decisions and code, or deriving focused financial regression tests. Scenario recommendations alone do not authorize implementation.
---

# Ajoti Scenario Testing

Use this workflow in the Ajoti workspace. For a financial code change, also load ajoti-financial-safety.

## Reconcile scenarios with the product

- Locate Scenerios.md at the Ajoti workspace root. It is the scenario source, and its recommendations are proposals rather than proof of current behavior or approval.
- Read TODO.md, docs/blockers.md, relevant docs/decisions and dated docs/specs action records, plus current code and tests on the active branch.
- For each scenario, record the rule authority and classify it as one of:
  - Implemented, with code/test evidence.
  - Approved implementation gap.
  - Proposed or unresolved business rule.
  - External, legal, provider, or environment blocker.
  - Explicitly deferred.
  - User education or operations.
  - Conflicts with a later approved rule.
- Separate what source text proposes from what owner-approved records authorize. Preserve the scenario wording and identifiers; don't copy all scenarios into TODO.md.

## Build useful scenario coverage

- Map each reviewed scenario to relevant code paths, existing tests, missing coverage, and a next action. Mark code inspection and executed test evidence separately.
- Derive tests from approved outcomes and financial invariants: correct owner and destination, no duplicate debit/credit, principal and fee allocation, partial recovery, authorization, and safe failure/retry behavior where applicable.
- Do not encode example amounts, provider assumptions, legal interpretations, fee rates, or a scenario's recommended answer as requirements unless an approved source establishes them.
- Add tests only for a meaningful uncovered behavior or reproduced defect. If existing tests cover the approved outcome, link and run them instead of adding a duplicate.
- Keep proposed, deferred, external, and education-only scenarios out of implementation tests until the rule is approved. A scenario can be useful for risk review without implying a new feature.

## Run and report

- Prefer focused tests for the mapped modules. Inspect test setup before running integration tests; use only isolated disposable databases. Skip tests that would require ambiguous database credentials, provider access, staging, or live financial actions.
- Keep an audit table in docs/scenarios/financial-scenario-audit.md when an audit is requested. Include scenario ID, classification, approved rule/source, code and test evidence, test result, and next action. Do not claim full coverage when only a focused pilot ran.
- Finish with a short summary of tested scenarios, deferred/unverifiable cases, and any approved coding gaps. Do not change business rules or deployment state as part of an audit.
