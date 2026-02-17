import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminLayout } from '@/layouts'
import { Dashboard, CreateGroup } from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-group" element={<CreateGroup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
