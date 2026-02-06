import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/components/AuthProvider'
import { AppLayout } from '@/layouts'
import { Home, Login, Signup, CreateNewWallet2, Rosca, Investments } from '@/pages'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const hasGoogleClientId = Boolean(googleClientId)

function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
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
          <Route
            path="/investments"
            element={
              <AppLayout>
                <Investments />
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

