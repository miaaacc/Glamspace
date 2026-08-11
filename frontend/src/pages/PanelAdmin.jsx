// src/pages/PanelAdmin.jsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"
import { C, FONT } from "../theme"
import Spinner from "../components/Spinner"

export default function PanelAdmin() {
  const { t, idioma } = useI18n()
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [pestana,   setPestana]  = useState("estadisticas")
  const [stats,     setStats]    = useState(null)
  const [reportes,  setReportes] = useState([])
  const [usuarios,  setUsuarios] = useState([])
  const [cargando,  setCargando] = useState(true)
  const [busqueda,  setBusqueda] = useState("")
  const [procesando, setProcesando] = useState("")
  const [cambiandoRol, setCambiandoRol] = useState("")

  useEffect(() => {
    if (!["admin", "moderador"].includes(usuario?.rol)) navigate("/feed")
  }, [])

  useEffect(() => {
    setCargando(true)
    if (pestana === "estadisticas") cargarStats()
    if (pestana === "reportes")     cargarReportes()
    if (pestana === "usuarios")     cargarUsuarios()
  }, [pestana])

  const cargarStats    = async () => { try { const r = await api.get("/reportes/admin/estadisticas/"); setStats(r.data.estadisticas) } catch {} finally { setCargando(false) } }
  const cargarReportes = async () => { try { const r = await api.get("/reportes/admin/reportes/?estado=pendiente"); setReportes(r.data.reportes) } catch {} finally { setCargando(false) } }
  const cargarUsuarios = async () => { try { const r = await api.get("/reportes/admin/usuarios/"); setUsuarios(r.data.usuarios) } catch {} finally { setCargando(false) } }

  const resolverReporte = async (id, accion) => {
    if (procesando) return
    setProcesando(id)
    try {
      await api.put(`/reportes/admin/reportes/${id}/`, { accion })
      setReportes(prev => prev.filter(r => r.idReporte !== id))
    } catch (err) { alert(err.response?.data?.error || "Error") }
    finally { setProcesando("") }
  }

  const cambiarRol = async (id, rol) => {
    if (cambiandoRol) return
    setCambiandoRol(id)
    try {
      await api.put(`/reportes/admin/usuarios/${id}/rol/`, { rol })
      setUsuarios(prev => prev.map(u => u.idUsuario === id ? { ...u, rol } : u))
    } catch (err) { alert(err.response?.data?.error || "Error") }
    finally { setCambiandoRol("") }
  }

  const usuariosFiltrados = usuarios.filter(u =>
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const TABS = [
    { id: "estadisticas", icon: "📊", label: t('admin.stats') },
    { id: "reportes",     icon: "🚩", label: t('admin.reports'), badge: reportes.length || null },
    ...(usuario?.rol === "admin" ? [{ id: "usuarios", icon: "👥", label: t('admin.users') }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", background: C.beige, fontFamily: FONT.body, paddingBottom: 100 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "linear-gradient(135deg, #E8547A, #C23660)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          👑
        </div>
        <div>
          <h1 style={{
            fontSize: 20, fontWeight: 700, color: C.text, margin: 0,
            fontFamily: FONT.display,
          }}>
            {t('admin.panel')}
          </h1>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
            {usuario?.rol === "admin" ? "👑 Admin" : "🛡️ Mod"} · @{usuario?.username}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 24,
          background: C.white, borderRadius: 16, padding: 6,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 8px rgba(232,84,122,0.06)",
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setPestana(t.id)}
              style={{
                flex: 1, padding: "11px 8px", borderRadius: 12,
                border: "none", cursor: "pointer",
                background: pestana === t.id
                  ? "linear-gradient(135deg, #E8547A, #C23660)"
                  : "transparent",
                color: pestana === t.id ? C.white : C.muted,
                fontSize: 13, fontWeight: 600,
                fontFamily: FONT.body,
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge && (
                <span style={{
                  background: pestana === t.id ? "rgba(255,255,255,0.3)" : C.pink,
                  color: C.white, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", borderRadius: 20,
                  minWidth: 18, textAlign: "center",
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spinner size={40} />
            <p style={{ color: C.muted, fontSize: 14, marginTop: 16 }}>{t('admin.loading')}</p>
          </div>
        ) : (
          <>

            {/* ── Estadísticas ── */}
            {pestana === "estadisticas" && stats && (
              <div>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                  {t('admin.summary')}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { label: t('admin.stat.users'),    val: stats.totalUsuarios,            emoji: "👥", color: "#E0E7FF", text: "#3730A3" },
                    { label: t('admin.stat.posts'),    val: stats.totalPublicaciones,       emoji: "📝", color: "#FCE7F3", text: C.pinkDark },
                    { label: t('admin.stat.comments'), val: stats.totalComentarios,         emoji: "💬", color: "#D1FAE5", text: "#065F46" },
                    { label: t('admin.stat.reported'), val: stats.publicacionesReportadas,  emoji: "🚩", color: "#FEF3C7", text: "#92400E", alerta: true },
                    { label: t('admin.stat.deleted'),  val: stats.publicacionesEliminadas,  emoji: "🗑️", color: "#FEE2E2", text: "#991B1B" },
                    { label: t('admin.stat.pending'),  val: stats.reportesPendientes,       emoji: "⏳", color: "#FEF3C7", text: "#92400E", alerta: true },
                  ].map(card => (
                    <div
                      key={card.label}
                      style={{
                        background: C.white, borderRadius: 18, padding: "20px",
                        border: `1px solid ${card.alerta && card.val > 0 ? "#FCA5A5" : C.border}`,
                        boxShadow: card.alerta && card.val > 0
                          ? "0 4px 16px rgba(239,68,68,0.1)"
                          : "0 2px 8px rgba(232,84,122,0.05)",
                        transition: "transform 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: card.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, marginBottom: 12,
                      }}>
                        {card.emoji}
                      </div>
                      <div style={{
                        fontSize: 32, fontWeight: 700,
                        color: card.alerta && card.val > 0 ? "#EF4444" : C.text,
                        fontFamily: FONT.display, lineHeight: 1,
                      }}>
                        {card.val ?? 0}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Acceso rápido */}
                <div style={{
                  marginTop: 20, background: C.white, borderRadius: 18,
                  padding: "20px", border: `1px solid ${C.border}`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>
                    {t('admin.quickActions')}
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setPestana("reportes")} style={btnAccion("#FEF2F2", "#991B1B")}>
                      {t('admin.seeReports')}
                    </button>
                    {usuario?.rol === "admin" && (
                      <button onClick={() => setPestana("usuarios")} style={btnAccion("#EDE9FE", "#6D28D9")}>
                        {t('admin.manageUsers')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Reportes ── */}
            {pestana === "reportes" && (
              <div>
                {reportes.length === 0 ? (
                  <div style={{
                    background: C.white, borderRadius: 20, padding: "60px 24px",
                    textAlign: "center", border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontSize: 18, color: C.text, margin: "0 0 8px", fontFamily: FONT.display }}>
                      {t('admin.allClean')}
                    </h3>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                      {t('admin.noPending')}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reportes.map(rep => (
                      <div
                        key={rep.idReporte}
                        style={{
                          background: C.white, borderRadius: 18,
                          border: "1px solid #FCA5A5",
                          overflow: "hidden",
                          boxShadow: "0 2px 12px rgba(239,68,68,0.08)",
                        }}
                      >
                        {/* Franja de color */}
                        <div style={{ height: 4, background: "linear-gradient(90deg, #EF4444, #F97316)" }} />

                        <div style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{
                                  background: "#FEE2E2", color: "#991B1B",
                                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                                  borderRadius: 20,
                                }}>
                                  🚩 {rep.motivo.replace(/_/g, " ")}
                                </span>
                                <span style={{ fontSize: 11, color: C.muted }}>
                                  {new Date(rep.fechaReporte).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-CR', {
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {rep.descripcion && (
                                <p style={{
                                  fontSize: 13, color: C.text, margin: "0 0 8px",
                                  lineHeight: 1.5, fontStyle: "italic",
                                }}>
                                  "{rep.descripcion}"
                                </p>
                              )}

                              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                                Publicación ID: <code style={{
                                  background: C.pinkLight, padding: "1px 6px",
                                  borderRadius: 4, fontSize: 10,
                                }}>
                                  {rep.idPublicacion.slice(0, 12)}...
                                </code>
                              </p>
                            </div>

                            {/* Botones */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
                              <button
                                onClick={() => resolverReporte(rep.idReporte, "resuelto")}
                                disabled={!!procesando}
                                style={{
                                  padding: "10px 14px", borderRadius: 12, border: "none",
                                  background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                                  color: C.white, fontSize: 12, fontWeight: 700,
                                  cursor: procesando ? "default" : "pointer", fontFamily: FONT.body,
                                  boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
                                  opacity: procesando ? 0.6 : 1,
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                              >
                                {procesando === rep.idReporte && <Spinner size={12} color="#fff" track="rgba(255,255,255,0.4)" />}
                                {t('admin.deleteContent')}
                              </button>
                              <button
                                onClick={() => resolverReporte(rep.idReporte, "descartado")}
                                disabled={!!procesando}
                                style={{
                                  padding: "10px 14px", borderRadius: 12,
                                  border: `1px solid ${C.border}`,
                                  background: C.white, color: C.muted,
                                  fontSize: 12, fontWeight: 600,
                                  cursor: procesando ? "default" : "pointer", fontFamily: FONT.body,
                                  opacity: procesando ? 0.6 : 1,
                                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}
                              >
                                {procesando === rep.idReporte && <Spinner size={12} />}
                                {t('admin.dismissReport')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Usuarios ── */}
            {pestana === "usuarios" && (
              <div>
                {/* Buscador */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: C.white, borderRadius: 14, padding: "12px 16px",
                  border: `1px solid ${C.border}`, marginBottom: 16,
                }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <input
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder={t('admin.searchUsers')}
                    style={{
                      border: "none", outline: "none", flex: 1,
                      fontSize: 13, color: C.text, background: "none",
                      fontFamily: FONT.body,
                    }}
                  />
                  {busqueda && (
                    <button onClick={() => setBusqueda("")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                    >✕</button>
                  )}
                </div>

                <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
                  {busqueda
                    ? t('admin.usersFound', { n: usuariosFiltrados.length, q: busqueda })
                    : t('admin.usersTotal', { n: usuariosFiltrados.length })}
                </p>

                {/* Tabla de usuarios */}
                <div style={{
                  background: C.white, borderRadius: 20, overflow: "hidden",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 2px 12px rgba(232,84,122,0.06)",
                }}>
                  {/* Header tabla */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr 100px 120px",
                    padding: "14px 20px",
                    background: C.pinkLight,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    {[t('admin.userHeader'), t('admin.emailHeader'), t('admin.roleHeader'), t('admin.changeRoleHeader')].map(h => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {usuariosFiltrados.map((u, i) => (
                    <div
                      key={u.idUsuario}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1.5fr 100px 120px",
                        padding: "14px 20px",
                        alignItems: "center",
                        borderBottom: i < usuariosFiltrados.length - 1 ? `1px solid ${C.border}` : "none",
                        background: i % 2 === 0 ? C.white : C.beige,
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Usuario */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${C.pinkMid}, ${C.pinkLight})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: C.pinkDark,
                          flexShrink: 0,
                        }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                            @{u.username}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>{u.nombre}</div>
                        </div>
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                        {u.email}
                      </div>

                      {/* Rol badge */}
                      <div>
                        <span style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          ...(u.rol === "admin"
                            ? { background: "#EDE9FE", color: "#6D28D9" }
                            : u.rol === "moderador"
                            ? { background: "#DBEAFE", color: "#1D4ED8" }
                            : { background: C.pinkLight, color: C.pinkDark }),
                        }}>
                          {u.rol === "admin" ? t('admin.rol.admin')
                            : u.rol === "moderador" ? t('admin.rol.mod')
                            : t('admin.rol.user')}
                        </span>
                      </div>

                      {/* Select rol */}
                      <div>
                        {u.idUsuario !== usuario?.idUsuario ? (
                          cambiandoRol === u.idUsuario ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                              <Spinner size={14} />
                            </div>
                          ) : (
                            <select
                              value={u.rol}
                              onChange={e => cambiarRol(u.idUsuario, e.target.value)}
                              disabled={!!cambiandoRol}
                              style={{
                                border: `1.5px solid ${C.border}`, borderRadius: 10,
                                padding: "6px 10px", fontSize: 12, color: C.text,
                                background: C.white, cursor: "pointer",
                                fontFamily: FONT.body, outline: "none",
                                width: "100%", opacity: cambiandoRol ? 0.5 : 1,
                              }}
                            >
                              <option value="usuario">usuario</option>
                              <option value="moderador">moderador</option>
                              <option value="admin">admin</option>
                            </select>
                          )
                        ) : (
                          <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>
                            {t('admin.you')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const btnAccion = (bg, color) => ({
  padding: "10px 16px", borderRadius: 12, border: "none",
  background: bg, color, fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
})