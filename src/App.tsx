import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { Home } from '@/pages'
import { CreateNewWallet2 } from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/createNewWallet2" element={<CreateNewWallet2 />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
