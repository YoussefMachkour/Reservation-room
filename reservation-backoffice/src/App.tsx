import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Dashboard } from './pages/Dashboard'
import { Spaces } from './pages/Spaces'
import { Reservations } from './pages/Reservations'
import { Members } from './pages/Members'
import { AdminMessages } from './pages/Messages'
import { Analytics } from './pages/Analytics'
import { Payments } from './pages/Payments'
import { Settings } from './pages/Settings'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="spaces" element={<Spaces />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="members" element={<Members />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App;