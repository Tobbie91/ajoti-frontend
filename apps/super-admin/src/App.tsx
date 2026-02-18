import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import {
  Dashboard,
  ManageUsers,
  ManageRosca,
  Transactions,
  SettingsLogs,
} from '@/pages'

import { FixedSavings } from '@/pages/savings/FixedSavings'
import { TargetSavings } from '@/pages/savings/TargetSavings'
import { UserDetails } from './pages/UserDetails'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/manage-rosca" element={<ManageRosca />} />
          <Route path="/savings/FixedSavings" element={<FixedSavings />} />
          <Route path="/savings/TargetSavings" element={<TargetSavings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings-logs" element={<SettingsLogs />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
