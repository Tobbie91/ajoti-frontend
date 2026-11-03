# Future-cycle contribution cap removal

Owner approved allowing members to continue paying future Ajo cycles. The joined-group card now selects the earliest unpaid active schedule without limiting it to currentCycle + 1. After all scheduled contributions are paid, its message no longer promises a later unlock. Existing single-cycle payment confirmation, refresh and pending/debt behavior remain unchanged. No bulk-payment UI is added.

Backend counterpart: 4b444a8. It preserves sequential full-principal payment of earlier cycles and all existing payment protections.

Verification: the new browser regression failed against the old frontend because Pay Cycle 4 Early was unavailable. After the change, desktop and mobile both paid cycles 4 and 5 with currentCycle still 2, verified the submitted cycle numbers and confirmed no further future payment was offered. Installed Edge was used through a temporary local Playwright configuration. Initial first-load timeout was resolved by waiting for DOM content rather than page load. Backend contribution/scheduler/payout tests: 80 passed. Customer TypeScript/Vite production build passed with the existing large-chunk warning. Actual staging acceptance remains open. No push or deployment.
