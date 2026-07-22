import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { RequireAuth, RequirePermission } from '@/components/RequireAuth/RequireAuth'
import {
  Dashboard,
  ManageUsers,
  ManageRosca,
  Transactions,
  SettingsLogs,
  Login,
  ForgotPassword,
  ResetPassword,
  ChangePasswordRequired,
  KycApprovals,
  TrustScores,
  Simulations,
  Wallets,
  SystemAccounts,
  PayoutFeeSettings,
  LoanSettings,
  SupportInbox,
  SupportTicketDetail,
  StaffManagement,
  StaffSetup,
  Maintenance,
} from '@/pages'

import { FixedSavings } from '@/pages/savings/FixedSavings'
import { TargetSavings } from '@/pages/savings/TargetSavings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password-required" element={<ChangePasswordRequired />} />
        <Route path="/staff/setup" element={<StaffSetup />} />

        {/* Protected — require SUPERADMIN token */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            {/* Always accessible to all SUPERADMIN users */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/trust-scores" element={<TrustScores />} />

            {/* MANAGE_TICKETS — SUPPORT, COMPLIANCE, OPERATIONS, SUPERADMIN */}
            <Route element={<RequirePermission permission="MANAGE_TICKETS" />}>
              <Route path="/support" element={<SupportInbox />} />
              <Route path="/support/:ticketId" element={<SupportTicketDetail />} />
            </Route>

            {/* MANAGE_KYC — COMPLIANCE, OPERATIONS, SUPERADMIN */}
            <Route element={<RequirePermission permission="MANAGE_KYC" />}>
              <Route path="/kyc-approvals" element={<KycApprovals />} />
            </Route>

            {/* VIEW_AUDIT_LOGS — COMPLIANCE, OPERATIONS, SUPERADMIN */}
            <Route element={<RequirePermission permission="VIEW_AUDIT_LOGS" />}>
              <Route path="/settings-logs" element={<SettingsLogs />} />
            </Route>

            {/* MANAGE_CIRCLES — OPERATIONS, SUPERADMIN */}
            <Route element={<RequirePermission permission="MANAGE_CIRCLES" />}>
              <Route path="/manage-rosca" element={<ManageRosca />} />
              <Route path="/simulations" element={<Simulations />} />
            </Route>

            {/* VIEW_LEDGER — OPERATIONS, SUPERADMIN */}
            <Route element={<RequirePermission permission="VIEW_LEDGER" />}>
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/transactions" element={<Transactions />} />
            </Route>

            {/* VIEW_SYSTEM_ACCOUNTS — COMPLIANCE (read-only), OPERATIONS, MANAGER, SUPERADMIN */}
            <Route element={<RequirePermission permission="VIEW_SYSTEM_ACCOUNTS" />}>
              <Route path="/system-accounts" element={<SystemAccounts />} />
            </Route>

            {/* MANAGE_ADMIN_ACCOUNTS — SUPERADMIN only */}
            <Route element={<RequirePermission permission="MANAGE_ADMIN_ACCOUNTS" />}>
              <Route path="/staff" element={<StaffManagement />} />
            </Route>

            {/* SYSTEM_CONFIG — SUPERADMIN only */}
            <Route element={<RequirePermission permission="SYSTEM_CONFIG" />}>
              <Route path="/settings/payout-fee" element={<PayoutFeeSettings />} />
              <Route path="/settings/loan" element={<LoanSettings />} />
            </Route>

            {/* Savings (coming soon) — no permission gate yet */}
            <Route path="/savings/FixedSavings" element={<FixedSavings />} />
            <Route path="/savings/TargetSavings" element={<TargetSavings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
