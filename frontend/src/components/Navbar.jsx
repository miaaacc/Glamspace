// src/components/Navbar.jsx
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { C, FONT } from "../theme"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import { useI18n } from "../context/I18nContext"
import { useLayout } from "../context/LayoutContext"
import ModalCrearPublicacion from "./ModalCrearPublicacion"
import api from "../api/axios"

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario } = useAuth()
  const { tema, alternarTema } = useTheme()
  const { idioma, cambiarIdioma, t } = useI18n()
  const { chatAbierto } = useLayout()
  const [showModal, setShowModal] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/notificaciones/count/")
        setNoLeidas(res.data.noLeidas || 0)
      } catch {}
    }
    cargar()
    const intervalo = setInterval(cargar, 20000)
    return () => clearInterval(intervalo)
  }, [location.pathname])

  const esAdmin = ["admin", "moderador"].includes(usuario?.rol)

  const items = [
    { id: "feed",      icon: "🏠", label: t("nav.home"),   path: "/feed" },
    { id: "explorar",  icon: "🔍", label: t("nav.explore"), path: "/explorar" },
    { id: "crear",     icon: "+",  label: "",          path: null },
    { id: "mensajes",  icon: "💬", label: t("nav.messages"), path: "/mensajes" },
    { id: "perfil",    icon: "👤", label: t("nav.profile"),   path: `/perfil/${usuario?.idUsuario}` },
  ]

  const activo = (path) => path && location.pathname.startsWith(path)

  return (
    <>
      {/* Header superior */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: "12px 20px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div
          onClick={() => navigate("/feed")}
          style={{ fontSize: 20, fontWeight: 700, color: C.pink, cursor: "pointer", fontFamily: FONT.display }}
        >
          ✨ GlamSpace
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {esAdmin && (
            <button
              onClick={() => navigate("/admin")}
              style={{
                fontSize: 11, background: "#EDE9FE", color: "#6D28D9",
                border: "none", borderRadius: 20, padding: "4px 10px",
                cursor: "pointer", fontWeight: 700, fontFamily: FONT.body,
              }}
            >
              {t("nav.admin")}
            </button>
          )}

          {/* Selector de idioma */}
          <div style={{
            display: "flex", background: C.pinkLight, borderRadius: 20,
            padding: 2, fontFamily: FONT.body,
          }}>
            {["es", "en"].map(idi => (
              <button
                key={idi}
                onClick={() => cambiarIdioma(idi)}
                style={{
                  background: idioma === idi ? C.pink : "transparent",
                  color: idioma === idi ? "#fff" : C.muted,
                  border: "none", borderRadius: 18, padding: "3px 9px",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT.body,
                }}
              >
                {idi.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Toggle de tema */}
          <button
            onClick={alternarTema}
            title={tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
          >
            {tema === "oscuro" ? "☀️" : "🌙"}
          </button>

          {/* Campana de notificaciones */}
          <button
            onClick={() => navigate("/notificaciones")}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
          >
            🔔
            {noLeidas > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -6,
                background: C.pink, color: "#fff",
                fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
              }}>
                {noLeidas > 99 ? "99+" : noLeidas}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navbar inferior */}
      {!chatAbierto && (
        <nav className="nav-inferior">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "crear") { setShowModal(true); return }
                navigate(item.path)
              }}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "4px 0",
              }}
            >
              {item.id === "crear" ? (
                <div className="btn-crear" style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: C.pink, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 28, color: "#fff",
                  fontWeight: 300,
                  boxShadow: `0 4px 16px rgba(232,84,122,0.4)`,
                }}>
                  +
                </div>
              ) : (
                <>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, fontFamily: FONT.body,
                    color: activo(item.path) ? C.pink : C.muted,
                  }}>
                    {item.label}
                  </span>
                  {activo(item.path) && (
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.pink }} />
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      )}

      {showModal && <ModalCrearPublicacion onClose={() => setShowModal(false)} />}
    </>
  )
}
