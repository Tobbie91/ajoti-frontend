import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { RequireAuth, RequirePermission } from '@/components/RequireAuth/RequireAuth'
import {
  Dashboard, ManageUsers, ManageRosca, Transactions, SettingsLogs, Login, ForgotPassword,
  ResetPassword, ChangePasswordRequired, KycApprovals, TrustScores, Wallets,
  SystemAccounts, LoansList, DebtsList, PayoutFeeSettings, LoanSettings, CircleRulesSettings,
  SupportInbox, SupportTicketDetail, ContactDetailsCorrection, StaffManagement, StaffSetup, Maintenance,
} from '@/pages'
import { FixedSavings } from '@/pages/savings/FixedSavings'
import { TargetSavings } from '@/pages/savings/TargetSavings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password-required" element={<ChangePasswordRequired />} />
        <Route path="/staff/setup" element={<StaffSetup />} />

        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/trust-scores" element={<TrustScores />} />

            <Route element={<RequirePermission permission="MANAGE_TICKETS" />}>
              <Route path="/support" element={<SupportInbox />} />
              <Route path="/support/:ticketId" element={<SupportTicketDetail />} />
            </Route>

            <Route element={<RequirePermission permission="EDIT_USER_CONTACT_DETAILS" />}>
              <Route path="/support/contact-details" element={<ContactDetailsCorrection />} />
            </Route>

            <Route element={<RequirePermission permission="MANAGE_KYC" />}>
              <Route path="/kyc-approvals" element={<KycApprovals />} />
            </Route>
            <Route element={<RequirePermission permission="VIEW_AUDIT_LOGS" />}>
              <Route path="/settings-logs" element={<SettingsLogs />} />
            </Route>
            <Route element={<RequirePermission permission="MANAGE_CIRCLES" />}>
              <Route path="/manage-rosca" element={<ManageRosca />} />
            </Route>
            <Route element={<RequirePermission permission="VIEW_LEDGER" />}>
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/transactions" element={<Transactions />} />
            </Route>
            <Route element={<RequirePermission permission="VIEW_SYSTEM_ACCOUNTS" />}>
              <Route path="/system-accounts" element={<SystemAccounts />} />
              <Route path="/loans" element={<LoansList />} />
              <Route path="/debts" element={<DebtsList />} />
            </Route>
            <Route element={<RequirePermission permission="MANAGE_ADMIN_ACCOUNTS" />}>
              <Route path="/staff" element={<StaffManagement />} />
            </Route>
            <Route element={<RequirePermission permission="SYSTEM_CONFIG" />}>
              <Route path="/settings/payout-fee" element={<PayoutFeeSettings />} />
              <Route path="/settings/loan" element={<LoanSettings />} />
              <Route path="/settings/circle-rules" element={<CircleRulesSettings />} />
            </Route>
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
