import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/components/AuthProvider'
import { RequireKyc } from '@/components/RequireKyc'
import { AppLayout, BlogLayout } from '@/layouts'
import { Home, Login, Signup, CreateNewWallet2, Rosca, GroupDetails, RequestToJoin, JoinSummary, MyGroupRequests, Investments, CreateNewWallet, VerifyOtp, GrowthActivities, BecomeAdmin, HowItWorks, ArticleDetail, Kyc, FundWallet, WithdrawFunds, Transactions, Loans, Profile } from '@/pages'

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
          <Route path="/kyc" element={<Kyc />} />

          <Route
            path="/create-wallet"
            element={
              <RequireKyc>
                <AppLayout>
                  <CreateNewWallet />
                </AppLayout>
              </RequireKyc>
            }
          />

          <Route
            path="/createNewWallet2"
            element={
              <RequireKyc>
                <AppLayout>
                  <CreateNewWallet2 />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca"
            element={
              <RequireKyc>
                <AppLayout>
                  <Rosca />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca/:id"
            element={
              <RequireKyc>
                <AppLayout>
                  <GroupDetails />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca/:id/join"
            element={
              <RequireKyc>
                <AppLayout>
                  <RequestToJoin />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca/:id/summary"
            element={
              <RequireKyc>
                <AppLayout>
                  <JoinSummary />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca/:id/activities"
            element={
              <RequireKyc>
                <AppLayout>
                  <GrowthActivities />
                </AppLayout>
              </RequireKyc>
            }
          />
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
              <RequireKyc>
                <AppLayout>
                  <BecomeAdmin />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/rosca/requests"
            element={
              <RequireKyc>
                <AppLayout>
                  <MyGroupRequests />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/investments"
            element={
              <RequireKyc>
                <AppLayout>
                  <Investments />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/fund-wallet"
            element={
              <RequireKyc>
                <AppLayout>
                  <FundWallet />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/withdraw"
            element={
              <RequireKyc>
                <AppLayout>
                  <WithdrawFunds />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/transactions"
            element={
              <RequireKyc>
                <AppLayout>
                  <Transactions />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/loans"
            element={
              <RequireKyc>
                <AppLayout>
                  <Loans />
                </AppLayout>
              </RequireKyc>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireKyc>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </RequireKyc>
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

