import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import {
  Dashboard,
  CreateGroup,
  ManageJoinRequest,
  RoscaGroups,
  GroupDetail,
  EditGroup,
  Loans,
  MyWallet,
  FundWallet,
  WithdrawFunds,
  Transactions,
  Login,
  Signup,
  VerifyOtp,
  Kyc,
  MyProfile,
} from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/kyc" element={<Kyc />} />

        {/* Protected routes — with admin layout */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/manage-join-request" element={<ManageJoinRequest />} />
          <Route path="/rosca/groups" element={<RoscaGroups />} />
          <Route path="/rosca/groups/:id" element={<GroupDetail />} />
          <Route path="/rosca/groups/:id/edit" element={<EditGroup />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/my-wallet" element={<MyWallet />} />
          <Route path="/fund-wallet" element={<FundWallet />} />
          <Route path="/withdraw" element={<WithdrawFunds />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/my-profile" element={<MyProfile />} />
        </Route>

        {/* Default: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
