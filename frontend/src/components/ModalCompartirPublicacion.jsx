// src/components/ModalCompartirPublicacion.jsx
import { useState, useEffect } from "react"
import { C, FONT } from "../theme"
import Avatar from "./Avatar"
import Spinner from "./Spinner"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"

export default function ModalCompartirPublicacion({ abierto, publicacion, onClose }) {
  const { usuario } = useAuth()
  const { t } = useI18n()
  const [seguidos, setSeguidos] = useState([])
  const [cargandoLista, setCargandoLista] = useState(false)
  const [query, setQuery] = useState("")
  const [enviandoId, setEnviandoId] = useState("")
  const [enviadoId, setEnviadoId] = useState("")
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setQuery("")
    setEnviandoId("")
    setEnviadoId("")
    setCopiado(false)
    if (!usuario?.idUsuario) return
    setCargandoLista(true)
    api
      .get(`/auth/${usuario.idUsuario}/siguiendo/`)
      .then(r => setSeguidos(r.data.siguiendo || []))
      .catch(() => setSeguidos([]))
      .finally(() => setCargandoLista(false))
  }, [abierto, usuario?.idUsuario])

  if (!abierto || !publicacion) return null

  const url = `${window.location.origin}/publicaciones/${publicacion.idPublicacion}`

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      alert(t("common.error"))
    }
  }

  const compartirWhatsApp = () => {
    const texto = `${publicacion.titulo || ""} ${url}`.trim()
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank")
  }

  const enviarMensaje = async (u) => {
    if (enviandoId) return
    setEnviandoId(u.idUsuario)
    try {
      await api.post("/mensajes/compartir/", {
        idPublicacion: publicacion.idPublicacion,
        idDestinatario: u.idUsuario,
      })
      setEnviadoId(u.idUsuario)
      setTimeout(onClose, 1200)
    } catch (err) {
      alert(err.response?.data?.error || t("common.error"))
      setEnviandoId("")
    }
  }

  const q = query.trim().toLowerCase()
  const resultados = q
    ? seguidos.filter(u => u.username.toLowerCase().includes(q) || (u.nombre || "").toLowerCase().includes(q))
    : seguidos

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 200, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: 20,
        fontFamily: FONT.body,
      }}
    >
      <div style={{
        background: C.white, borderRadius: 24,
        width: "100%", maxWidth: 420,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        animation: "popIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{
            fontSize: 18, fontWeight: 700, color: C.text, margin: 0,
            fontFamily: FONT.display,
          }}>
            {t("share.title")}
          </h3>
          <button
            onClick={onClose}
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

        {/* Vista previa del post */}
        <div style={{
          margin: "16px 24px 0", display: "flex", alignItems: "center", gap: 12,
          padding: 10, borderRadius: 14, background: C.pinkLight,
        }}>
          {publicacion.fotos?.length > 0 && (
            <img
              src={publicacion.fotos[0]}
              alt={publicacion.titulo}
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {publicacion.titulo}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>@{publicacion.username}</div>
          </div>
        </div>

        {/* Enlace / WhatsApp */}
        <div style={{ padding: "16px 24px 0", display: "flex", gap: 10 }}>
          <button
            onClick={copiarEnlace}
            style={{
              flex: 1, padding: "12px", borderRadius: 14,
              border: `1.5px solid ${C.pink}`, background: C.white,
              color: copiado ? "#16A34A" : C.pink, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT.body, transition: "all 0.2s",
            }}
          >
            {copiado ? `✅ ${t("share.linkCopied")}` : `🔗 ${t("share.copyLink")}`}
          </button>
          <button
            onClick={compartirWhatsApp}
            style={{
              flex: 1, padding: "12px", borderRadius: 14, border: "none",
              background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT.body,
              boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
            }}
          >
            💬 {t("share.whatsapp")}
          </button>
        </div>

        {/* Divider */}
        <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t("share.sendTo")}
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Buscador */}
        <div style={{ padding: "14px 24px 0" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("share.searchPh")}
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1.5px solid ${C.border}`, borderRadius: 12,
              padding: "10px 14px", fontSize: 13, outline: "none",
              fontFamily: FONT.body, color: C.text, background: C.pinkLight,
            }}
          />
        </div>

        {/* Lista de usuarios */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 24px 20px" }}>
          {cargandoLista ? (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: 20 }}>
              <Spinner size={22} />
            </div>
          ) : resultados.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 13, padding: 20 }}>
              {q ? t("share.noResults") : t("share.emptyFollowing")}
            </div>
          ) : (
            resultados.map(u => {
              const esEnviado = enviadoId === u.idUsuario
              return (
                <button
                  key={u.idUsuario}
                  onClick={() => enviarMensaje(u)}
                  disabled={!!enviandoId}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 8px", borderRadius: 12,
                    border: "none", background: "none", cursor: "pointer",
                    fontFamily: FONT.body, textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.pinkLight}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Avatar username={u.username} fotoPerfil={u.fotoPerfil} size={36} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text }}>
                      @{u.username}
                    </span>
                    {u.nombre && (
                      <span style={{ display: "block", fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.nombre}
                      </span>
                    )}
                  </span>
                  {enviandoId === u.idUsuario ? (
                    <Spinner size={14} />
                  ) : esEnviado ? (
                    <span style={{ fontSize: 20 }}>✅</span>
                  ) : (
                    <span style={{ fontSize: 13, color: C.pink, fontWeight: 600 }}>{t("share.sharePost")}</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px) }
          to   { opacity: 1; transform: scale(1)    translateY(0)    }
        }
      `}</style>
    </div>
  )
}
