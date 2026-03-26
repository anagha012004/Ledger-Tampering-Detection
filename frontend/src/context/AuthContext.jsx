import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token')
    const user  = localStorage.getItem('user')
    const role  = localStorage.getItem('role')
    return token ? { token, user, role } : null
  })

  const signIn = (token, user, role) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user',  user)
    localStorage.setItem('role',  role)
    setAuth({ token, user, role })
  }

  const signOut = () => {
    localStorage.clear()
    setAuth(null)
  }

  return <AuthContext.Provider value={{ auth, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
