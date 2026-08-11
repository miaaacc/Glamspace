// src/pages/Notificaciones.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, FONT } from '../theme'
import api from '../api/axios'
import { useI18n } from '../context/I18nContext'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'

const ICONOS = {
  like: '❤️',
  comentario: '💬',
  seguidor: '➕',
  mencion: '✏️',
  favorito: '🔖',
  mensaje: '💌',
  compartido: '🔗',
}

export default function Notificaciones() {
  const navigate = useNavigate()
  const { idioma, t } = useI18n()
  const [notifs, setNotifs] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones/')
      setNotifs(res.data.notificaciones || [])
    } catch {
      setNotifs([])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
    api.put('/notificaciones/leer/').catch(() => {})
  }, [cargar])

  const marcarLeidas = async () => {
    try {
      await api.put('/notificaciones/leer/')
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    } catch {}
  }

  const abrir = (n) => {
    switch (n.tipo) {
      case 'seguidor':
        navigate(`/perfil/${n.idEmisor}`)
        break
      case 'mensaje':
        navigate(`/mensajes?con=${n.idEmisor}&username=${n.usernameEmisor}`)
        break
      default:
        navigate(`/publicaciones/${n.idReferencia}`)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.beige, fontFamily: FONT.body }}>
      {/* Encabezado */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px", background: C.white,
        borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 5,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: FONT.display }}>
          🔔 {t('notif.title')}
        </h1>
        {notifs.some(n => !n.leida) && (
          <button
            onClick={marcarLeidas}
            style={{
              fontSize: 12, color: C.pink, background: C.pinkLight,
              border: "none", borderRadius: 20, padding: "6px 12px",
              cursor: "pointer", fontWeight: 600, fontFamily: FONT.body,
            }}
          >
            {t('notif.markRead')}
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ padding: "8px 16px" }}>
        {cargando ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Spinner size={28} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔕</div>
            <div style={{ fontSize: 14 }}>{t('notif.empty')}</div>
          </div>
        ) : (
          notifs.map(n => (
            <div
              key={n.idNotificacion}
              onClick={() => abrir(n)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 10px", borderRadius: 14, cursor: "pointer",
                background: n.leida ? C.white : C.pinkLight,
                marginBottom: 8, border: `1px solid ${C.border}`,
                transition: "background 0.15s",
              }}
            >
              <Avatar username={n.usernameEmisor} fotoPerfil={n.fotoEmisor} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                  <TextoNotificacion n={n} t={t} />
                </div>
                {n.textoReferencia && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.textoReferencia}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {tiempoRelativo(n.fecha, idioma, t)}
                </div>
              </div>
              <div style={{ fontSize: 22 }}>{ICONOS[n.tipo] || '🔔'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TextoNotificacion({ n, t }) {
  const completo = t(`notif.${n.tipo}`, { username: `@${n.usernameEmisor}` })
  const marca = `@${n.usernameEmisor}`
  const idx = completo.indexOf(marca)
  if (idx === -1) return completo
  return (
    <>
      {completo.slice(0, idx)}
      <span style={{ fontWeight: 700 }}>{marca}</span>
      {completo.slice(idx + marca.length)}
    </>
  )
}

function tiempoRelativo(fecha, idioma, t) {
  if (!fecha) return ''
  const diff = Date.now() - new Date(fecha).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return t('notif.justNow')
  if (minutos < 60) return idioma === 'es' ? `hace ${minutos} min` : `${minutos} min ago`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return idioma === 'es' ? `hace ${horas} h` : `${horas} h ago`
  const dias = Math.floor(horas / 24)
  return idioma === 'es' ? `hace ${dias} d` : `${dias} d ago`
}
