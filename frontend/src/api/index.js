import axios from 'axios'

// In dev, Vite proxy forwards /api → localhost:8080
// In production (Render), set VITE_API_URL=https://your-backend.onrender.com
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export const login          = (username, password) => api.post('/auth/login', { username, password })
export const signup         = (username, password) => api.post('/auth/signup', { username, password })
export const getNodes       = ()                   => api.get('/nodes')
export const detectTamper   = ()                   => api.get('/detect')
export const addTx          = (payload)            => api.post('/transaction', payload)
export const tamperNode     = (nodeId, txId, amt)  => api.post(`/tamper?nodeId=${nodeId}&transactionId=${txId}&newAmount=${amt}`)
export const resetSystem    = ()                   => api.post('/reset')
export const getAuditLogs   = ()                   => api.get('/audit')
export const getAlerts      = ()                   => api.get('/alerts')
export const resolveAlert   = (id)                 => api.post(`/alerts/${id}/resolve`)
export const getIntegrity   = ()                   => api.get('/integrity')
export const getForensics   = (nodeId)             => api.get(`/forensics/${nodeId}`)
export const getSnapshots   = ()                   => api.get('/snapshots')
export const createSnapshot = (label, createdBy)   => api.post(`/snapshots/create?label=${encodeURIComponent(label)}&createdBy=${encodeURIComponent(createdBy)}`)
export const compareSnapshot = (id)                => id ? api.get(`/snapshots/compare/${id}`) : api.get('/snapshots/compare')
export const getUsers        = ()                  => api.get('/users')
export const createUser      = (body)              => api.post('/users', body)
export const updateUserRole  = (id, role)          => api.put(`/users/${id}/role`, { role })
export const deleteUser      = (id)                => api.delete(`/users/${id}`)

export default api
