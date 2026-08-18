import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { KycGate } from '@/components/KycGate'
import { TransactionPinGate } from '@/components/TransactionPinGate'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  Dashboard,
  CreateGroup,
  ManageJoinRequest,
  RoscaGroups,
  GroupDetail,
  EditGroup,
  Loans,
  MyDebts,
  MyWallet,
  FundWallet,
  WithdrawFunds,
  Transactions,
  Login,
  VerifyOtp,
  Kyc,
  MyProfile,
  FundWalletCallback,
  SetPin,
  Messages,
  Support,
  SupportTicket,
  Maintenance,
} from '@/pages'

function KycPageGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/kyc" element={<KycPageGuard><Kyc /></KycPageGuard>} />

        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/manage-join-request" element={<ManageJoinRequest />} />
          <Route path="/rosca/groups" element={<RoscaGroups />} />
          <Route path="/rosca/groups/:id" element={<GroupDetail />} />
          <Route path="/rosca/groups/:id/edit" element={<EditGroup />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/debts" element={<MyDebts />} />
          <Route path="/my-wallet" element={<MyWallet />} />
          <Route path="/fund-wallet" element={<KycGate action="fund your wallet"><FundWallet /></KycGate>} />
          <Route
            path="/withdraw"
            element={
              <KycGate action="withdraw funds">
                <TransactionPinGate>
                  <WithdrawFunds />
                </TransactionPinGate>
              </KycGate>
            }
          />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/set-pin" element={<SetPin />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/support" element={<Support />} />
          <Route path="/support/:ticketId" element={<SupportTicket />} />
        </Route>

        <Route path="/fund-wallet/callback" element={<FundWalletCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
