// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const CLAVE_TEMA = 'tema'

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try { return localStorage.getItem(CLAVE_TEMA) || 'claro' } catch { return 'claro' }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro')
    try { localStorage.setItem(CLAVE_TEMA, tema) } catch {}
  }, [tema])

  const alternarTema = () => setTema(t => (t === 'claro' ? 'oscuro' : 'claro'))

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
