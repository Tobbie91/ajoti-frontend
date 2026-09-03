import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { theme } from '@/styles/theme'
import '@/styles/index.css'
import App from './App'

// Remove credentials left by versions that stored bearer tokens in JavaScript-readable storage.
localStorage.removeItem('superadmin_access_token')
localStorage.removeItem('superadmin_refresh_token')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)
