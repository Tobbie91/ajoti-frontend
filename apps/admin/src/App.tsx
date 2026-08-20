import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { KycGate } from '@/components/KycGate'
import { TransactionPinGate } from '@/components/TransactionPinGate'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CircleAdminRoute } from '@/components/CircleAdminRoute'
import { defaultAuthenticatedPath, getTokenRole } from '@/utils/auth-role'
import {
  Dashboard, CreateGroup, ManageJoinRequest, RoscaGroups, GroupDetail, EditGroup,
  Loans, MyDebts, MyWallet, FundWallet, WithdrawFunds, Transactions, Login, VerifyOtp,
  Kyc, MyProfile, FundWalletCallback, SetPin, Messages, Support, SupportTicket, Maintenance,
  TargetSavings,
  Signup,
} from '@/pages'
import {
  Home, Rosca, GroupDetails, GrowthActivities, RequestToJoin, JoinSummary,
  MyGroupRequests, MyInvites, InviteAccept, BecomeAdmin, HowItWorks,
  ArticleDetail, CreateNewWallet, CreateNewWallet2, Investments,
} from '@/pages/customer'

function KycPageGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  const role = getTokenRole(token)
  if (!token || !role || !['MEMBER', 'CIRCLE_ADMIN'].includes(role)) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function HomeRedirect() {
  const token = localStorage.getItem('access_token')
  return <Navigate to={token ? defaultAuthenticatedPath() : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/kyc" element={<KycPageGuard><Kyc /></KycPageGuard>} />
        <Route path="/rosca/invite/:token" element={<InviteAccept />} />

        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<CircleAdminRoute><Dashboard /></CircleAdminRoute>} />
          <Route path="/create-group" element={<CircleAdminRoute><CreateGroup /></CircleAdminRoute>} />
          <Route path="/manage-join-request" element={<CircleAdminRoute><ManageJoinRequest /></CircleAdminRoute>} />
          <Route path="/rosca/groups" element={<CircleAdminRoute><RoscaGroups /></CircleAdminRoute>} />
          <Route path="/rosca/groups/:id" element={<CircleAdminRoute><GroupDetail /></CircleAdminRoute>} />
          <Route path="/rosca/groups/:id/edit" element={<CircleAdminRoute><EditGroup /></CircleAdminRoute>} />
          <Route path="/rosca" element={<Rosca />} />
          <Route path="/rosca/how-it-works" element={<HowItWorks />} />
          <Route path="/rosca/how-it-works/:articleId" element={<ArticleDetail />} />
          <Route path="/rosca/become-admin" element={<BecomeAdmin />} />
          <Route path="/rosca/requests" element={<MyGroupRequests />} />
          <Route path="/rosca/invites" element={<MyInvites />} />
          <Route path="/rosca/:id/join" element={<RequestToJoin />} />
          <Route path="/rosca/:id/summary" element={<JoinSummary />} />
          <Route path="/rosca/:id/activities" element={<GrowthActivities />} />
          <Route path="/rosca/:id" element={<GroupDetails />} />
          <Route path="/create-wallet" element={<CreateNewWallet />} />
          <Route path="/createNewWallet2" element={<CreateNewWallet2 />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/target-savings" element={<TargetSavings />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/debts" element={<MyDebts />} />
          <Route path="/my-wallet" element={<MyWallet />} />
          <Route path="/fund-wallet" element={<KycGate action="fund your wallet"><FundWallet /></KycGate>} />
          <Route path="/withdraw" element={<KycGate action="withdraw funds"><TransactionPinGate><WithdrawFunds /></TransactionPinGate></KycGate>} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/profile" element={<Navigate to="/my-profile" replace />} />
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
