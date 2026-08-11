// src/api/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: agrega el token automáticamente a cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: si el token expiró, cierra sesión automáticamente.
// No aplica al login: un 401 ahí significa credenciales incorrectas y no debe recargar.
api.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url || ''
    const esLogin = url.includes('/auth/login/')
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api