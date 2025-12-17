import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/layouts'
import { Home } from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
