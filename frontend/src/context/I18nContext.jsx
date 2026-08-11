// src/context/I18nContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { traducciones } from '../i18n/translations'

const I18nContext = createContext()

const CLAVE_IDIOMA = 'idioma'

export function I18nProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    try { return localStorage.getItem(CLAVE_IDIOMA) || 'es' } catch { return 'es' }
  })

  useEffect(() => {
    document.documentElement.lang = idioma
    try { localStorage.setItem(CLAVE_IDIOMA, idioma) } catch {}
  }, [idioma])

  const t = (clave, params = {}) => {
    let texto = traducciones[idioma]?.[clave] ?? traducciones.es[clave] ?? clave
    for (const [k, v] of Object.entries(params)) {
      texto = texto.replaceAll(`{${k}}`, v)
    }
    return texto
  }

  const cambiarIdioma = (nuevo) => setIdioma(nuevo)

  return (
    <I18nContext.Provider value={{ idioma, cambiarIdioma, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)

// Helper de fechas según idioma
export function formatoFecha(fecha, idioma) {
  const locale = idioma === 'en' ? 'en-US' : 'es-CR'
  return new Date(fecha).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}
