import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/components/AuthProvider'
import { Home, Login, Signup, CreateNewWallet2 } from '@/pages'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const hasGoogleClientId = Boolean(googleClientId)

function App() {
  const app = (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/createNewWallet2" element={<CreateNewWallet2 />} />
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
