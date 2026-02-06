import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import {
  Dashboard,
  ManageUsers,
  ManageRosca,
  SavingsInvestment,
  SavingsInsurance,
  Transactions,
  SettingsLogs,
} from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/manage-rosca" element={<ManageRosca />} />
          <Route path="/savings/investment" element={<SavingsInvestment />} />
          <Route path="/savings/insurance" element={<SavingsInsurance />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings-logs" element={<SettingsLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
