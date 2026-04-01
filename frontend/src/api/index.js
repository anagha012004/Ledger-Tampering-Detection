import axios from 'axios'

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
    if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/' }
    return Promise.reject(err)
  }
)

// Auth
export const login  = (username, password) => api.post('/auth/login',  { username, password })
export const signup = (username, password) => api.post('/auth/signup', { username, password })

// Users
export const getUsers      = ()           => api.get('/users')
export const createUser    = (body)       => api.post('/users', body)
export const updateUserRole = (id, role)  => api.put(`/users/${id}/role`, { role })
export const deleteUser    = (id)         => api.delete(`/users/${id}`)

// Blockchain (Hardhat contract via bridge)
export const bcHealth    = ()             => api.get('/blockchain/health')
export const bcStatus    = ()             => api.get('/blockchain/status')
export const bcGetNodes  = ()             => api.get('/blockchain/nodes')
export const bcGetEntries = (nodeIndex)   => api.get(`/blockchain/entries/${nodeIndex}`)
export const bcConsensus = ()             => api.get('/blockchain/consensus')
export const bcAddTx     = (tx)           => api.post('/blockchain/transaction', tx)
export const bcDetect    = ()             => api.post('/blockchain/detect')
export const bcTamper    = (body)         => api.post('/blockchain/tamper', body)
export const bcReset     = ()             => api.post('/blockchain/reset')

export default api
