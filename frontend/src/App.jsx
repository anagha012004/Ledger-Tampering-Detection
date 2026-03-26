import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar             from './components/Navbar'
import NotificationToast from './components/NotificationToast'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import AuditLog  from './pages/AuditLog'
import Alerts    from './pages/Alerts'
import Integrity from './pages/Integrity'
import Snapshots from './pages/Snapshots'
import Forensics from './pages/Forensics'
import Users     from './pages/Users'

function PrivateRoute({ children }) {
  const { auth } = useAuth()
  return auth ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/" replace />
  if (auth.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <NotificationToast />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/audit"     element={<PrivateRoute><Layout><AuditLog  /></Layout></PrivateRoute>} />
          <Route path="/alerts"    element={<PrivateRoute><Layout><Alerts    /></Layout></PrivateRoute>} />
          <Route path="/integrity" element={<PrivateRoute><Layout><Integrity /></Layout></PrivateRoute>} />
          <Route path="/snapshots" element={<PrivateRoute><Layout><Snapshots /></Layout></PrivateRoute>} />
          <Route path="/forensics" element={<PrivateRoute><Layout><Forensics /></Layout></PrivateRoute>} />
          <Route path="/users"     element={<AdminRoute><Layout><Users /></Layout></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
