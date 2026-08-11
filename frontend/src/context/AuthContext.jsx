// src/context/AuthContext.jsx
import { createContext, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useI18n } from './I18nContext'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem('usuario')) || null
  )
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { t } = useI18n()

  const registrar = async (datos) => {
    setCargando(true)
    setError('')
    try {
      const res = await api.post('/auth/registro/', datos)
      navigate('/login', {
        state: { mensaje: '¡Cuenta creada! Ahora inicia sesión.' }
      })
      return res.data
    } catch (err) {
      const mensaje = err.response?.data?.error || 'Error al registrarse'
      setError(mensaje)
      throw err
    } finally {
      setCargando(false)
    }
  }

  const iniciarSesion = async (email, password) => {
    setCargando(true)
    setError('')
    try {
      const res = await api.post('/auth/login/', { email, password })
      const { token, usuario } = res.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('usuario', JSON.stringify(usuario))
      setUsuario(usuario)
      
      navigate('/feed')
    } catch (err) {
      const mensaje = err.response?.status === 401
        ? t('login.wrongCredentials')
        : (err.response?.data?.error || 'Error al iniciar sesión')
      setError(mensaje)
      throw err
    } finally {
      setCargando(false)
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{
      usuario,
      cargando,
      error,
      setError,
      registrar,
      iniciarSesion,
      cerrarSesion
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)