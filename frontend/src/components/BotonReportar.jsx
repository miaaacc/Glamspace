// src/components/BotonReportar.jsx
import { useState } from "react"
import api from "../api/axios"
import { C } from "../theme"
import { useI18n } from "../context/I18nContext"
import Spinner from "../components/Spinner"

const MOTIVOS = [
  { clave: "inapropiado", icon: "🚫" },
  { clave: "spam",        icon: "📢" },
  { clave: "acoso",       icon: "😔" },
  { clave: "falso",       icon: "❌" },
  { clave: "otro",        icon: "💬" },
]

export default function BotonReportar({ idPublicacion }) {
  const { t } = useI18n()
  const [abierto,     setAbierto]     = useState(false)
  const [motivo,      setMotivo]      = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [enviando,    setEnviando]    = useState(false)
  const [exito,       setExito]       = useState(false)

  const abrir  = () => { setAbierto(true); setMotivo(""); setDescripcion(""); setExito(false) }
  const cerrar = () => { setAbierto(false) }

  const enviar = async () => {
    if (!motivo || enviando) return
    setEnviando(true)
    try {
      await api.post(`/reportes/publicacion/${idPublicacion}/`, { motivo, descripcion })
      setExito(true)
      setTimeout(() => cerrar(), 2500)
    } catch (err) {
      alert(err.response?.data?.error || t('report.error'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={abrir}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: C.muted, display: "flex",
          alignItems: "center", gap: 4, padding: "4px 0",
          fontFamily: "'DM Sans', sans-serif",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
        onMouseLeave={e => e.currentTarget.style.color = C.muted}
      >
        {t('report.reportPost')}
      </button>

      {/* Overlay */}
      {abierto && (
        <div
          onClick={e => e.target === e.currentTarget && cerrar()}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 200, display: "flex",
            alignItems: "center", justifyContent: "center",
            padding: 20,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{
            background: C.white, borderRadius: 24,
            width: "100%", maxWidth: 400,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            animation: "popIn 0.2s ease",
          }}>

            {exito ? (
              /* ── Estado de éxito ── */
              <div style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "#F0FDF4", border: "2px solid #BBF7D0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 20px",
                }}>
                  ✅
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px", fontFamily: "'Playfair Display', serif" }}>
                  {t('report.sent')}
                </h3>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  {t('report.thanks')}
                </p>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div style={{
                  padding: "24px 24px 0",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div>
                    <h3 style={{
                      fontSize: 18, fontWeight: 700, color: C.text,
                      margin: "0 0 4px", fontFamily: "'Playfair Display', serif",
                    }}>
                      {t('report.title')}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                      {t('report.why')}
                    </p>
                  </div>
                  <button
                    onClick={cerrar}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: C.pinkLight, border: "none",
                      cursor: "pointer", fontSize: 14, color: C.muted,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* ── Motivos ── */}
                <div style={{ padding: "20px 24px 0" }}>
                  {MOTIVOS.map(m => (
                    <label
                      key={m.clave}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                        cursor: "pointer", border: `1.5px solid`,
                        borderColor: motivo === m.clave ? C.pink : C.border,
                        background: motivo === m.clave ? C.pinkLight : C.white,
                        transition: "all 0.15s",
                      }}
                    >
                      {/* Radio custom */}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${motivo === m.clave ? C.pink : C.border}`,
                        background: motivo === m.clave ? C.pink : C.white,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        {motivo === m.clave && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.white }} />
                        )}
                      </div>
                      <input
                        type="radio" name="motivo" value={m.clave}
                        checked={motivo === m.clave}
                        onChange={() => setMotivo(m.clave)}
                        style={{ display: "none" }}
                      />
                      <span style={{ fontSize: 18 }}>{m.icon}</span>
                      <span style={{
                        fontSize: 13, fontWeight: motivo === m.clave ? 600 : 400,
                        color: motivo === m.clave ? C.pinkDark : C.text,
                      }}>
                        {t(`report.motivo.${m.clave}`)}
                      </span>
                    </label>
                  ))}

                  {/* Descripción adicional */}
                  <textarea
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder={t('report.detailsPh')}
                    rows={3}
                    style={{
                      width: "100%", border: `1.5px solid ${C.border}`,
                      borderRadius: 12, padding: "12px 14px",
                      fontSize: 13, resize: "none", outline: "none",
                      fontFamily: "'DM Sans', sans-serif", color: C.text,
                      background: C.pinkLight, boxSizing: "border-box",
                      marginTop: 4,
                    }}
                  />
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10 }}>
                  <button
                    onClick={cerrar}
                    style={{
                      flex: 1, padding: "13px", borderRadius: 14,
                      border: `1.5px solid ${C.border}`, background: C.white,
                      color: C.muted, fontSize: 14, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={enviar}
                    disabled={!motivo || enviando}
                    style={{
                      flex: 1, padding: "13px", borderRadius: 14, border: "none",
                      background: !motivo
                        ? C.pinkMid
                        : "linear-gradient(135deg, #EF4444, #B91C1C)",
                      color: C.white, fontSize: 14, fontWeight: 700,
                      cursor: !motivo ? "default" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: motivo ? "0 4px 12px rgba(239,68,68,0.3)" : "none",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {enviando && <Spinner size={14} color="#fff" track="rgba(255,255,255,0.4)" />}
                    {enviando ? t('report.sending') : t('report.submit')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px) }
          to   { opacity: 1; transform: scale(1)    translateY(0)    }
        }
      `}</style>
    </>
  )
}
