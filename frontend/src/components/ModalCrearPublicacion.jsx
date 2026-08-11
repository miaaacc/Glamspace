// src/components/ModalCrearPublicacion.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { C, FONT } from "../theme"
import { useI18n } from "../context/I18nContext"
import api from "../api/axios"
import { traducirCategoria } from "../i18n/translations"
import Spinner from "../components/Spinner"

export default function ModalCrearPublicacion({ onClose }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [tipo, setTipo] = useState("")
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({ titulo: "", descripcion: "", idCategoria: "", fotos: [] })
  const [preview, setPreview] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")

  const TIPOS = [
    { id: "foto",     icon: "🖼️", label: t("modal.type.foto") },
    { id: "video",    icon: "🎬", label: t("modal.type.video") },
    { id: "tutorial", icon: "✏️", label: t("modal.type.tutorial") },
    { id: "resena",   icon: "⭐", label: t("modal.type.resena") },
    { id: "antes",    icon: "↔️", label: t("modal.type.antes") },
  ]

  useEffect(() => {
    api.get("/categorias/").then(r => setCategorias(r.data.categorias)).catch(() => {})
  }, [])

  const manejarImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError(t("modal.imgTooBig")); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      setForm(prev => ({ ...prev, fotos: [reader.result] }))
    }
    reader.readAsDataURL(file)
  }

  const publicar = async () => {
    setError("")
    if (!form.titulo.trim()) { setError(t("modal.titleRequired")); return }
    if (!form.idCategoria) { setError(t("modal.catRequired")); return }
    setEnviando(true)
    try {
      const res = await api.post("/publicaciones/", form)
      onClose()
      navigate(`/publicaciones/${res.data.publicacion.idPublicacion}`)
    } catch (err) {
      setError(err.response?.data?.error || t("modal.errorPublish"))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: C.white, borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 480, padding: 24, paddingBottom: 48,
        animation: "slideUp 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: FONT.display }}>
            {step === 1 ? t("modal.whatPost") : t("modal.details")}
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.muted }}
          >✕</button>
        </div>

        {error && (
          <div style={{
            background: "#FEE2E2", border: "1px solid #FECACA",
            color: "#B91C1C", borderRadius: 10, padding: "10px 14px",
            fontSize: 12, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {TIPOS.map(tp => (
                <button key={tp.id} onClick={() => setTipo(tp.id)} style={{
                  padding: "16px 8px", borderRadius: 14,
                  border: `2px solid ${tipo === tp.id ? C.pink : C.border}`,
                  background: tipo === tp.id ? C.pinkLight : C.white,
                  cursor: "pointer", textAlign: "center",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{tp.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: tipo === tp.id ? C.pinkDark : C.muted, fontFamily: FONT.body }}>
                    {tp.label}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => tipo && setStep(2)}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: tipo ? C.pink : C.pinkMid,
                color: tipo ? "#fff" : C.muted,
                fontSize: 14, fontWeight: 700, cursor: tipo ? "pointer" : "default",
                fontFamily: FONT.body,
              }}
            >
              {t("modal.continue")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder={t("modal.titlePlaceholder")}
              style={inputStyle}
            />

            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder={t("modal.descPlaceholder")}
              rows={4}
              style={{ ...inputStyle, resize: "none", height: 90 }}
            />

            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              {categorias.map(c => (
                <button key={c.idCategoria}
                  onClick={() => setForm({ ...form, idCategoria: c.idCategoria })}
                  style={{
                    flexShrink: 0, padding: "6px 12px", borderRadius: 50, border: "none",
                    cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FONT.body,
                    background: form.idCategoria === c.idCategoria ? C.pink : C.pinkMid,
                    color: form.idCategoria === c.idCategoria ? "#fff" : C.pinkDark,
                  }}
                >
                  {traducirCategoria(t, c.nombreCategoria)}
                </button>
              ))}
            </div>

            <label style={{
              display: "block", border: `1.5px dashed ${C.pinkMid}`,
              borderRadius: 14, padding: "14px", textAlign: "center",
              cursor: "pointer", marginBottom: 16, background: C.pinkLight,
            }}>
              {preview ? (
                <img src={preview} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }} />
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t("modal.upload")}</div>
                </>
              )}
              <input type="file" accept="image/*" onChange={manejarImagen} style={{ display: "none" }} />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={btnSecundario}>{t("modal.back")}</button>
              <button
                onClick={publicar}
                disabled={enviando}
                style={{
                  flex: 2, padding: "13px", borderRadius: 14, border: "none",
                  background: enviando ? C.pinkMid : C.pink,
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: enviando ? "default" : "pointer", fontFamily: FONT.body,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {enviando && <Spinner size={14} color="#fff" track="rgba(255,255,255,0.4)" />}
                {enviando ? t("modal.publishing") : t("modal.publish")}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}

const inputStyle = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 12,
  padding: "12px 14px", fontSize: 13, outline: "none",
  fontFamily: "'DM Sans', sans-serif", color: "var(--text)",
  boxSizing: "border-box", marginBottom: 12, background: "var(--pink-light)",
}
const btnSecundario = {
  flex: 1, padding: "13px", borderRadius: 14,
  border: "1px solid var(--border)", background: "var(--white)",
  cursor: "pointer", fontSize: 13, fontWeight: 600,
  color: "var(--muted)", fontFamily: "'DM Sans', sans-serif",
}
