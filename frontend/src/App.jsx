import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar    from './components/Navbar'
import Login     from './pages/Login'
import Blockchain from './pages/Blockchain'
import Users     from './pages/Users'

function PrivateRoute({ children }) {
  const { auth } = useAuth()
  return auth ? children : <Navigate to="/" replace />
}

function RoleRoute({ children, roles }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/" replace />
  if (!roles.includes(auth.role)) return <Navigate to="/dashboard" replace />
  return children
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Blockchain /></Layout></PrivateRoute>} />
          <Route path="/users"     element={<RoleRoute roles={['ADMIN']}><Layout><Users /></Layout></RoleRoute>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
