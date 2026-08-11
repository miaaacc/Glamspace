// src/components/Reacciones.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useI18n } from '../context/I18nContext'

const TIPOS = ['❤️', '😍', '👏', '✨', '😮']

export default function Reacciones({ idPublicacion }) {
  const { t } = useI18n()
  const [totales, setTotales] = useState({})
  const [misReacciones, setMisReacciones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [pop, setPop] = useState({ tipo: null, key: 0 })

  const cargarReacciones = useCallback(async () => {
    try {
      const res = await api.get(`/reacciones/${idPublicacion}/info/`)
      setTotales(res.data.totales)
      setMisReacciones(res.data.misReacciones)
    } catch (err) {
      console.error('Error cargando reacciones:', err)
    }
  }, [idPublicacion])

  useEffect(() => {
    cargarReacciones()
  }, [cargarReacciones])

  const toggleReaccion = async (tipo) => {
    if (cargando) return
    setCargando(true)
    setPop(p => ({ tipo, key: p.key + 1 }))

    // Actualización optimista: refleja el cambio antes de esperar al servidor
    const yaReaccioné = misReacciones.includes(tipo)
    setMisReacciones(prev =>
      yaReaccioné ? prev.filter(r => r !== tipo) : [...prev, tipo]
    )
    setTotales(prev => ({
      ...prev,
      [tipo]: (prev[tipo] || 0) + (yaReaccioné ? -1 : 1)
    }))

    try {
      await api.post(`/reacciones/${idPublicacion}/`, { tipoReaccion: tipo })
    } catch {
      // Si falla, revertir
      cargarReacciones()
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pt-16 pb-12">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] mb-6">
        {t('detail.reactions')}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {TIPOS.map((tipo, i) => {
          const activo = misReacciones.includes(tipo)
          const total = totales[tipo] || 0

          return (
            <button
              key={tipo}
              onClick={() => toggleReaccion(tipo)}
              className="flex items-center justify-center gap-1.5 h-10 min-w-[64px] px-2 rounded-full transition-all duration-200 active:scale-90"
              style={{
                background: activo
                  ? 'linear-gradient(135deg, var(--pink) 0%, var(--pink-dark) 100%)'
                  : 'var(--pink-light)',
                border: `1.5px solid ${activo ? 'transparent' : 'var(--border)'}`,
                color: activo ? '#fff' : 'var(--muted)',
                boxShadow: activo ? '0 4px 14px rgba(232, 84, 122, 0.35)' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!activo) e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { if (!activo) e.currentTarget.style.transform = 'scale(1)' }}
            >
              <span
                key={pop.tipo === tipo ? `${tipo}-${pop.key}` : tipo}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0"
                style={{
                  background: activo ? '#fff' : 'transparent',
                  animation: pop.tipo === tipo ? `popIn 0.35s ease ${i * 0.02}s` : undefined,
                }}
              >
                {tipo}
              </span>
              {total > 0 && <span className="text-xs font-bold">{total}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
