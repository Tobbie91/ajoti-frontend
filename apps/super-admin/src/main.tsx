import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { theme } from '@/styles/theme'
import '@/styles/index.css'
import App from './App'
import { sanitizeCachedStaffUser } from './utils/staff-storage'

// Remove credentials left by versions that stored bearer tokens in JavaScript-readable storage.
localStorage.removeItem('superadmin_access_token')
localStorage.removeItem('superadmin_refresh_token')
const resetEmail = localStorage.getItem('superadmin_reset_email')
if (resetEmail && !sessionStorage.getItem('superadmin_reset_email')) {
  sessionStorage.setItem('superadmin_reset_email', resetEmail)
}
localStorage.removeItem('superadmin_reset_email')
sanitizeCachedStaffUser()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)
