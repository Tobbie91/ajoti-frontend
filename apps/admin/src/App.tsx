import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { KycGate } from '@/components/KycGate'
import { TransactionPinGate } from '@/components/TransactionPinGate'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CircleAdminRoute } from '@/components/CircleAdminRoute'
import { defaultAuthenticatedPath } from '@/utils/auth-role'
import {
  Dashboard, CreateGroup, ManageJoinRequest, RoscaGroups, GroupDetail, EditGroup,
  Loans, MyDebts, MyWallet, FundWallet, WithdrawFunds, Transactions, Login, VerifyOtp,
  Kyc, MyProfile, FundWalletCallback, SetPin, Messages, Support, SupportTicket, Maintenance,
  TargetSavings,
} from '@/pages'

function KycPageGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function HomeRedirect() {
  const token = localStorage.getItem('admin_access_token')
  return <Navigate to={token ? defaultAuthenticatedPath() : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/kyc" element={<KycPageGuard><Kyc /></KycPageGuard>} />

        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<CircleAdminRoute><Dashboard /></CircleAdminRoute>} />
          <Route path="/create-group" element={<CircleAdminRoute><CreateGroup /></CircleAdminRoute>} />
          <Route path="/manage-join-request" element={<CircleAdminRoute><ManageJoinRequest /></CircleAdminRoute>} />
          <Route path="/rosca/groups" element={<CircleAdminRoute><RoscaGroups /></CircleAdminRoute>} />
          <Route path="/rosca/groups/:id" element={<CircleAdminRoute><GroupDetail /></CircleAdminRoute>} />
          <Route path="/rosca/groups/:id/edit" element={<CircleAdminRoute><EditGroup /></CircleAdminRoute>} />
          <Route path="/target-savings" element={<TargetSavings />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/debts" element={<MyDebts />} />
          <Route path="/my-wallet" element={<MyWallet />} />
          <Route path="/fund-wallet" element={<KycGate action="fund your wallet"><FundWallet /></KycGate>} />
          <Route path="/withdraw" element={<KycGate action="withdraw funds"><TransactionPinGate><WithdrawFunds /></TransactionPinGate></KycGate>} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/set-pin" element={<SetPin />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/support" element={<Support />} />
          <Route path="/support/:ticketId" element={<SupportTicket />} />
        </Route>

        <Route path="/fund-wallet/callback" element={<FundWalletCallback />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
