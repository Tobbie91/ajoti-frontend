import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { RequireAuth } from '@/components/RequireAuth/RequireAuth'
import {
  Dashboard,
  ManageUsers,
  ManageRosca,
  Transactions,
  SettingsLogs,
  Login,
  KycApprovals,
  TrustScores,
  Simulations,
  Wallets,
} from '@/pages'

import { FixedSavings } from '@/pages/savings/FixedSavings'
import { TargetSavings } from '@/pages/savings/TargetSavings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — require SUPERADMIN token */}
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/manage-users" element={<ManageUsers />} />
            <Route path="/kyc-approvals" element={<KycApprovals />} />
            <Route path="/manage-rosca" element={<ManageRosca />} />
            <Route path="/savings/FixedSavings" element={<FixedSavings />} />
            <Route path="/savings/TargetSavings" element={<TargetSavings />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/trust-scores" element={<TrustScores />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/settings-logs" element={<SettingsLogs />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
