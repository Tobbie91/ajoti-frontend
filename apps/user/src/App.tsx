import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/components/AuthProvider'
import { KycGate } from '@/components/KycGate'
import { AppLayout, BlogLayout } from '@/layouts'
import { Home, Login, Signup, CreateNewWallet2, Rosca, GroupDetails, RequestToJoin, JoinSummary, MyGroupRequests, InviteAccept, MyInvites, Investments, CreateNewWallet, VerifyOtp, GrowthActivities, BecomeAdmin, HowItWorks, ArticleDetail, Kyc, FundWallet, FundWalletCallback, WithdrawFunds, Transactions, Loans, Profile, ForgotPassword, ResetPassword, SetPin, Messages } from '@/pages'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const hasGoogleClientId = Boolean(googleClientId)

function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/home"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/kyc" element={<Kyc />} />

          <Route
            path="/create-wallet"
            element={
              <AppLayout>
                  <CreateNewWallet />
                </AppLayout>
            }
          />

          <Route
            path="/createNewWallet2"
            element={
              <AppLayout>
                  <CreateNewWallet2 />
                </AppLayout>
            }
          />
          <Route
            path="/rosca"
            element={
              <AppLayout>
                  <Rosca />
                </AppLayout>
            }
          />
          {/* Static /rosca/* routes must come before /rosca/:id */}
          <Route
            path="/rosca/how-it-works"
            element={
              <BlogLayout>
                <HowItWorks />
              </BlogLayout>
            }
          />
          <Route
            path="/rosca/how-it-works/:articleId"
            element={
              <BlogLayout>
                <ArticleDetail />
              </BlogLayout>
            }
          />
          <Route
            path="/rosca/become-admin"
            element={
              <AppLayout>
                  <BecomeAdmin />
                </AppLayout>
            }
          />
          <Route
            path="/rosca/requests"
            element={
              <AppLayout>
                  <MyGroupRequests />
                </AppLayout>
            }
          />
          <Route
            path="/rosca/invites"
            element={
              <AppLayout>
                <MyInvites />
              </AppLayout>
            }
          />
          <Route
            path="/rosca/invite/:token"
            element={
              <AppLayout>
                <InviteAccept />
              </AppLayout>
            }
          />
          {/* Dynamic routes after all static ones */}
          <Route
            path="/rosca/:id/join"
            element={
              <AppLayout>
                  <RequestToJoin />
                </AppLayout>
            }
          />
          <Route
            path="/rosca/:id/summary"
            element={
              <AppLayout>
                  <JoinSummary />
                </AppLayout>
            }
          />
          <Route
            path="/rosca/:id/activities"
            element={
              <AppLayout>
                  <GrowthActivities />
                </AppLayout>
            }
          />
          <Route
            path="/rosca/:id"
            element={
              <AppLayout>
                  <GroupDetails />
                </AppLayout>
            }
          />
          <Route
            path="/investments"
            element={
              <AppLayout>
                  <Investments />
                </AppLayout>
            }
          />
          <Route
            path="/fund-wallet"
            element={
              <AppLayout>
                <KycGate action="fund your wallet">
                  <FundWallet />
                </KycGate>
              </AppLayout>
            }
          />
          <Route path="/fund-wallet/callback" element={<FundWalletCallback />} />
          <Route
            path="/withdraw"
            element={
              <AppLayout>
                <KycGate action="withdraw funds">
                  <WithdrawFunds />
                </KycGate>
              </AppLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <AppLayout>
                  <Transactions />
                </AppLayout>
            }
          />
          <Route
            path="/loans"
            element={
              <AppLayout>
                  <Loans />
                </AppLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppLayout>
                  <Profile />
                </AppLayout>
            }
          />
          <Route
            path="/set-pin"
            element={
              <AppLayout>
                  <SetPin />
                </AppLayout>
            }
          />
          <Route
            path="/messages"
            element={
              <AppLayout>
                <Messages />
              </AppLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )

  // Avoid initializing Google OAuth when no client ID is configured.
  if (!hasGoogleClientId) {
    return app
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
}

export default App

