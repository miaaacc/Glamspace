// src/components/PostCard.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { C, FONT } from "../theme"
import Avatar from "./Avatar"
import ModalCompartirPublicacion from "./ModalCompartirPublicacion"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"
import { useI18n, formatoFecha } from "../context/I18nContext"

export default function PostCard({ pub, onDelete }) {
  const { usuario } = useAuth()
  const { idioma, t } = useI18n()
  const navigate = useNavigate()
  const [likes, setLikes] = useState(pub.totalReacciones || 0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(!!pub.esFavorito)
  const [menuOpen, setMenuOpen] = useState(false)
  const [compartirAbierto, setCompartirAbierto] = useState(false)

  useEffect(() => {
    setSaved(!!pub.esFavorito)
    cargarInfo()
  }, [pub.idPublicacion])

  const cargarInfo = async () => {
    try {
      const res = await api.get(`/reacciones/${pub.idPublicacion}/info/`)
      setLikes(res.data.totales?.["❤️"] || 0)
      setLiked((res.data.misReacciones || []).includes("❤️"))
    } catch {}
  }

  const esDueno = usuario?.idUsuario === pub.idUsuario
  const esAdmin = ["admin", "moderador"].includes(usuario?.rol)

  const toggleLike = async (e) => {
    e.stopPropagation()
    const anteriorLiked = liked
    const anteriorLikes = likes
    setLiked(!anteriorLiked)
    setLikes(anteriorLiked ? anteriorLikes - 1 : anteriorLikes + 1)
    try {
      await api.post(`/reacciones/${pub.idPublicacion}/`, { tipoReaccion: "❤️" })
      cargarInfo()
    } catch {
      setLiked(anteriorLiked)
      setLikes(anteriorLikes)
    }
  }

  const toggleFavorito = async (e) => {
    e.stopPropagation()
    const anterior = saved
    setSaved(!anterior)
    try {
      const res = await api.post(`/favoritos/${pub.idPublicacion}/toggle/`)
      setSaved(res.data.guardado)
    } catch {
      setSaved(anterior)
    }
  }

  const eliminar = async (e) => {
    e.stopPropagation()
    if (!confirm(t("post.confirmDelete"))) return
    try {
      await api.delete(`/publicaciones/${pub.idPublicacion}/`)
      onDelete?.(pub.idPublicacion)
    } catch (err) {
      alert(err.response?.data?.error || t("common.error"))
    }
  }

  const fecha = formatoFecha(pub.fechaPublicacion, idioma)

  return (
    <div style={{
      background: C.white, borderRadius: 20,
      border: `1px solid ${C.border}`, overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => navigate(`/perfil/${pub.idUsuario}`)}
        >
          <Avatar username={pub.username} fotoPerfil={pub.fotoPerfil} size={38} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>@{pub.username}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{fecha} · {t("feed.general")}</div>
          </div>
        </div>

        {/* Menú opciones */}
        <div style={{ position: "relative" }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: "4px 8px" }}
          >
            •••
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: 28, background: C.white,
              border: `1px solid ${C.border}`, borderRadius: 12, minWidth: 140,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)", zIndex: 10,
              overflow: "hidden",
            }}>
              <button
                onClick={() => { setMenuOpen(false); navigate(`/publicaciones/${pub.idPublicacion}`) }}
                style={menuItemStyle}
              >
                {t("post.see")}
              </button>
              {(esDueno || esAdmin) && (
                <button onClick={eliminar} style={{ ...menuItemStyle, color: "#e53e3e" }}>
                  {t("post.delete")}
                </button>
              )}
              {!esDueno && (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
                  style={menuItemStyle}
                >
                  {t("post.report")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      <div style={{ padding: "0 14px 10px", fontSize: 13, color: C.text, lineHeight: 1.5 }}>
        {pub.titulo && <span style={{ fontWeight: 600 }}>{pub.titulo} — </span>}
        {pub.descripcion}
      </div>

      {/* Imagen responsive */}
      {pub.fotos?.length > 0 && (
        <img
          src={pub.fotos[0]}
          alt={pub.titulo}
          onClick={() => navigate(`/publicaciones/${pub.idPublicacion}`)}
          style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", cursor: "pointer" }}
        />
      )}

      {/* Acciones */}
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={toggleLike} style={actionBtn(liked ? C.pink : C.muted)}>
            <span style={{ fontSize: 18 }}>{liked ? "❤️" : "🤍"}</span>
            <span style={{ fontSize: 13, fontWeight: liked ? 600 : 400 }}>{likes}</span>
          </button>
          <button
            onClick={() => navigate(`/publicaciones/${pub.idPublicacion}`)}
            style={actionBtn(C.muted)}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontSize: 13 }}>{pub.totalComentarios || 0}</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCompartirAbierto(true) }}
            style={actionBtn(C.muted)}
          >
            <span style={{ fontSize: 18 }}>🔗</span>
          </button>
        </div>
        <button onClick={toggleFavorito} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }} title={saved ? t("detail.saved") : t("detail.save")}>
          {saved ? "🔖" : "🏷️"}
        </button>
      </div>

      <ModalCompartirPublicacion
        abierto={compartirAbierto}
        publicacion={pub}
        onClose={() => setCompartirAbierto(false)}
      />
    </div>
  )
}

const menuItemStyle = {
  display: "block", width: "100%", padding: "10px 14px",
  background: "none", border: "none", cursor: "pointer",
  textAlign: "left", fontSize: 13, color: "var(--text)",
  fontFamily: "'DM Sans', sans-serif",
}

const actionBtn = (color) => ({
  background: "none", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 5,
  color, padding: 0,
})
