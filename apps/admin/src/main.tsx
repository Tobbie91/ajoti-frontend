import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import App from './App'
import { migrateLegacyCustomerStorage } from '@/utils/customer-storage'

migrateLegacyCustomerStorage()

const theme = createTheme({
  primaryColor: 'green',
  colors: {
    green: [
      '#e6f5f1',
      '#c2e3da',
      '#9dd1c2',
      '#78bfab',
      '#53ad93',
      '#0b6b55',
      '#09604d',
      '#075444',
      '#05493b',
      '#033d32',
    ],
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)
