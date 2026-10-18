---
name: ajoti-financial-safety
description: Use when planning, reviewing, testing, or changing Ajoti flows that move, reserve, lend, repay, or account for money, including contributions, payouts, fees, debt, collateral, and settlement.
---

# Ajoti Financial Safety

Use this workflow in the Ajoti workspace. For scenario inventory or scenario-derived tests, also load ajoti-scenario-testing.

## Establish the rule

- Find the Ajoti workspace root containing Scenerios.md and TODO.md.
- Read the applicable TODO item, blocker, decision, and recent action record, then inspect the current backend/frontend implementation and its tests.
- Treat recommendations in Scenerios.md as proposals. Use explicit owner decisions and current implementation records as authority. If they conflict, record the conflict and follow the approved rule; do not silently convert a scenario answer into product policy.
- Separate implemented, locally tested, staging verified, externally verified, approved, blocked, and deferred states.

## Trace the money

For the affected path, identify:

- Who owns each balance and who is obligated to pay whom.
- Every debit, credit, fee, reserve, release, debt, provider transfer, and reversal.
- What happens on partial funds, insufficient funds, retries, duplicate callbacks, concurrency, timeouts, and provider uncertainty.
- Which permission authorizes each action, which records prove it, and who can correct an erroneous result.
- The accounting invariant for each complete and partial outcome. Do not treat a notification as settlement, a group balance as a member's balance, or a proposed credit as available funds.

Check that one obligation is not counted twice, retries cannot duplicate value, and the ledger reflects the actual owner and destination of funds. Preserve existing historical entries unless an approved migration explicitly changes them.

## Implement and verify

- Make the smallest change that satisfies an approved rule. If a required fee, obligation, authority, or loss allocation is unresolved, stop that behavior change and document the decision needed.
- Add or change tests for meaningful approved invariants when current coverage is missing. Avoid duplicate tests that only restate implementation details.
- Prefer focused unit tests. Run database integration tests only after confirming they use an isolated, disposable database; never point them at a shared, staging, or production database. Do not make live provider or money-movement calls unless separately authorized.
- Report the code paths changed, the tested ledger outcomes, exact test command/result, and remaining migration, configuration, staging, provider, or approval gaps. A passing unit test is not staging or production evidence.
