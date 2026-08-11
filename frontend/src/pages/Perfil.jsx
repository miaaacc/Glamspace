// src/pages/Perfil.jsx
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { C, FONT } from "../theme"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"
import Avatar from "../components/Avatar"
import Spinner from "../components/Spinner"

export default function Perfil() {
  const { id }                              = useParams()
  const { cerrarSesion } = useAuth()
  const { t } = useI18n()
  const navigate                            = useNavigate()

  const [perfil,         setPerfil]         = useState(null)
  const [esPropio,       setEsPropio]       = useState(false)
  const [loSigo,         setLoSigo]         = useState(false)
  const [publicaciones,  setPublicaciones]  = useState([])
  const [favoritos,      setFavoritos]      = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [cargandoContenido, setCargandoContenido] = useState(false)
  const [siguiendo,      setSiguiendo]      = useState(false)
  const [pestana,        setPestana]        = useState("publicaciones")
  const [siguiendoList,  setSiguiendoList]  = useState([])
  const [seguidoresList, setSeguidoresList] = useState([])
  const [modalCerrar,    setModalCerrar]    = useState(false)

  useEffect(() => {
    setCargando(true)
    setPerfil(null)
    setPublicaciones([])
    setFavoritos([])
    setPestana("publicaciones")
    cargarPerfil()
    cargarPublicaciones()
  }, [id])

  const cargarPerfil = async () => {
    try {
      const res = await api.get(`/auth/${id}/`)
      setPerfil(res.data.usuario)
      setEsPropio(res.data.esPropio)
      setLoSigo(res.data.loSigo)
    } catch { setPerfil(null) }
    finally  { setCargando(false) }
  }

  const cargarPublicaciones = async () => {
    setCargandoContenido(true)
    try {
      const res = await api.get(`/publicaciones/usuario/${id}/`)
      setPublicaciones(res.data.publicaciones)
    } catch { setPublicaciones([]) }
    finally { setCargandoContenido(false) }
  }

  const cargarFavoritos = async () => {
    setCargandoContenido(true)
    try {
      const res = await api.get(`/favoritos/`)
      setFavoritos(res.data.favoritos || [])
    } catch { setFavoritos([]) }
    finally { setCargandoContenido(false) }
  }

  const cargarSeguimiento = async (tipo) => {
    setCargandoContenido(true)
    try {
      const res = await api.get(`/auth/${id}/${tipo}/`)
      if (tipo === "seguidores") setSeguidoresList(res.data.seguidores)
      else                       setSiguiendoList(res.data.siguiendo)
    } catch {}
    finally { setCargandoContenido(false) }
  }

  const handlePestana = (p) => {
    setPestana(p)
    if (p === "seguidores" && seguidoresList.length === 0) cargarSeguimiento("seguidores")
    if (p === "siguiendo"  && siguiendoList.length  === 0) cargarSeguimiento("siguiendo")
    if (p === "favoritos"  && favoritos.length === 0 && esPropio) cargarFavoritos()
  }

  const toggleSeguir = async () => {
    if (siguiendo) return
    setSiguiendo(true)
    try {
      const res = await api.post(`/auth/${id}/seguir/`)
      setLoSigo(res.data.siguiendo)
      setPerfil(prev => ({
        ...prev,
        totalSeguidores: prev.totalSeguidores + (res.data.siguiendo ? 1 : -1),
      }))
    } catch (err) { alert(err.response?.data?.error || "Error") }
    finally { setSiguiendo(false) }
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (cargando) return (
    <div style={wrapStyle}>
      <div style={{ padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.pinkMid }} />
          <div style={{ flex: 1, display: "flex", justifyContent: "space-around" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 18, background: C.pinkMid, borderRadius: 6, margin: "0 auto 6px" }} />
                <div style={{ width: 60, height: 10, background: C.pinkLight, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: "50%", height: 14, background: C.pinkMid, borderRadius: 6, marginBottom: 8 }} />
        <div style={{ width: "75%", height: 10, background: C.pinkLight, borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 42, background: C.pinkLight, borderRadius: 14 }} />
      </div>
    </div>
  )

  // ── Not found ─────────────────────────────────────────────────
  if (!perfil) return (
    <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌸</div>
        <h3 style={{ fontSize: 18, color: C.text, margin: "0 0 8px", fontFamily: FONT.display }}>
          {t("profile.notFound")}
        </h3>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
          {t("profile.notFoundSub")}
        </p>
        <button onClick={() => navigate("/feed")} style={btnPink}>
          {t("profile.backToFeed")}
        </button>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={wrapStyle}>

      {/* Volver */}
      {!esPropio && (
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.pink, fontSize: 14, fontWeight: 600,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 4,
          fontFamily: FONT.body,
        }}>
          ← Volver
        </button>
      )}

      {/* ── Cabecera del perfil ────────────────────────────────── */}
      <div style={{ padding: "20px 16px 0" }}>

        {/* Foto + stats */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <Avatar username={perfil.username} fotoPerfil={perfil.fotoPerfil} size={80} />
            {esPropio && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: "50%",
                background: C.pink, border: `2px solid ${C.white}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, cursor: "pointer",
              }}
                onClick={() => navigate("/perfil/editar")}
              >
                ✏️
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "space-around" }}>
            {[
              { label: t("profile.posts"),      val: publicaciones.length,    tab: "publicaciones" },
              { label: t("profile.followers"), val: perfil.totalSeguidores ?? 0, tab: "seguidores"   },
              { label: t("profile.following"),  val: perfil.totalSiguiendo  ?? 0, tab: "siguiendo"    },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => handlePestana(s.tab)}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "0 4px" }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: FONT.display }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: FONT.display }}>
            {perfil.nombre}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>@{perfil.username}</div>

          {perfil.biografia ? (
            <div style={{ fontSize: 13, color: C.text, marginTop: 8, lineHeight: 1.6 }}>
              {perfil.biografia}
            </div>
          ) : esPropio ? (
            <div
              onClick={() => navigate("/perfil/editar")}
              style={{ fontSize: 12, color: C.pink, marginTop: 8, cursor: "pointer", fontStyle: "italic" }}
            >
              {t("profile.addBio")}
            </div>
          ) : null}
        </div>

        {/* ── Botones de acción ─────────────────────────────────── */}
        {esPropio ? (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => navigate("/perfil/editar")}
              style={{ ...btnOutline, flex: 1 }}
            >
              {t("profile.editProfile")}
            </button>

            {/* ← CERRAR SESIÓN */}
            <button
              onClick={() => setModalCerrar(true)}
              style={{
                width: 44, height: 44, borderRadius: 12,
                border: "1.5px solid #FEE2E2",
                background: "#FEF2F2", color: "#EF4444",
                cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
              title="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={toggleSeguir} disabled={siguiendo} style={{
              flex: 1, padding: "11px 0", borderRadius: 12, cursor: siguiendo ? "default" : "pointer",
              fontWeight: 700, fontSize: 13, fontFamily: FONT.body,
              border: loSigo ? `1.5px solid ${C.border}` : "none",
              background: loSigo
                ? C.white
                : "linear-gradient(135deg, #E8547A, #C23660)",
              color: loSigo ? C.text : C.white,
              boxShadow: loSigo ? "none" : "0 4px 12px rgba(232,84,122,0.35)",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: siguiendo ? 0.7 : 1,
            }}>
              {siguiendo ? (
                <>
                  <Spinner size={14} color={loSigo ? C.pink : C.white} track={loSigo ? C.pinkMid : "rgba(255,255,255,0.4)"} />
                  {t("profile.followingBtn")}
                </>
              ) : loSigo ? t("profile.followingBtn") : t("profile.follow")}
            </button>

            <button
              onClick={() => navigate(`/mensajes?con=${perfil.idUsuario}&username=${perfil.username}`)}
              style={{ ...btnOutline, flex: 1 }}
            >
              {t("profile.message")}
            </button>
          </div>
        )}
      </div>

      {/* ── Pestañas ──────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {[
          { id: "publicaciones", icon: "⊞", label: t("profile.posts") },
          { id: "seguidores",    icon: "👥", label: t("profile.followers") },
          { id: "siguiendo",     icon: "➕", label: t("profile.following") },
          ...(esPropio ? [{ id: "favoritos", icon: "🔖", label: t("profile.favorites") }] : []),
        ].map(p => (
          <button
            key={p.id}
            onClick={() => handlePestana(p.id)}
            style={{
              flex: 1, padding: "13px 0", background: "none", border: "none",
              cursor: "pointer", fontFamily: FONT.body, fontSize: 12,
              color: pestana === p.id ? C.pink : C.muted,
              fontWeight: pestana === p.id ? 700 : 500,
              borderBottom: `2px solid ${pestana === p.id ? C.pink : "transparent"}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Publicaciones (grid) ──────────────────────────────── */}
      {pestana === "publicaciones" && (
        cargandoContenido && publicaciones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Spinner size={28} />
          </div>
        ) : publicaciones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <p style={{ fontSize: 14, margin: "0 0 16px" }}>
              {esPropio ? t("profile.noPosts") : t("profile.noPostsOther")}
            </p>
            {esPropio && (
              <button
                onClick={() => navigate("/publicaciones/nueva")}
                style={btnPink}
              >
                {t("profile.createFirstPost")}
              </button>
            )}
          </div>
        ) : (
          <GridPublicaciones publicaciones={publicaciones} onVer={id => navigate(`/publicaciones/${id}`)} />
        )
      )}

      {/* ── Favoritos (solo propios, privados) ────────────────── */}
      {pestana === "favoritos" && esPropio && (
        cargandoContenido && favoritos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Spinner size={28} />
          </div>
        ) : favoritos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔖</div>
            <p style={{ fontSize: 14, margin: "0 0 16px" }}>
              {t("profile.noFavorites")}
            </p>
          </div>
        ) : (
          <GridPublicaciones publicaciones={favoritos} onVer={id => navigate(`/publicaciones/${id}`)} />
        )
      )}

      {/* ── Seguidores / Siguiendo ──────────────────────────────── */}
      {(pestana === "seguidores" || pestana === "siguiendo") && (
        cargandoContenido && (pestana === "seguidores" ? seguidoresList : siguiendoList).length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Spinner size={28} />
          </div>
        ) : (
          <ListaUsuarios
            lista={pestana === "seguidores" ? seguidoresList : siguiendoList}
            onUserClick={uid => navigate(`/perfil/${uid}`)}
          />
        )
      )}

      {/* ── Modal confirmar cerrar sesión ──────────────────────── */}
      {modalCerrar && (
        <div
          onClick={e => e.target === e.currentTarget && setModalCerrar(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(44,26,34,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 200, display: "flex",
            alignItems: "center", justifyContent: "center",
            padding: 20, fontFamily: FONT.body,
          }}
        >
          <div style={{
            background: C.white, borderRadius: 24,
            padding: "32px 28px", width: "100%", maxWidth: 340,
            textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#FEF2F2", border: "2px solid #FECACA",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 20px",
            }}>
              🚪
            </div>

            <h3 style={{
              fontSize: 18, fontWeight: 700, color: C.text,
              margin: "0 0 8px", fontFamily: FONT.display,
            }}>
              {t("profile.logoutTitle")}
            </h3>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
              {t("profile.logoutSub")}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setModalCerrar(false)}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  border: `1.5px solid ${C.border}`, background: C.white,
                  color: C.muted, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: FONT.body,
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => { setModalCerrar(false); cerrarSesion() }}
                style={{
                  flex: 1, padding: "13px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #EF4444, #B91C1C)",
                  color: C.white, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: FONT.body,
                  boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                }}
              >
                {t("profile.logoutBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ──────────────────────────────────────────

function ListaUsuarios({ lista, onUserClick }) {
  const { t } = useI18n()
  if (lista.length === 0) return (
    <div style={{ textAlign: "center", padding: "48px 0", color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
      <p style={{ fontSize: 13 }}>{t("profile.noOneHere")}</p>
    </div>
  )

  return (
    <div style={{ padding: "0 16px" }}>
      {lista.map(u => (
        <div
          key={u.idUsuario}
          onClick={() => onUserClick(u.idUsuario)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 0", borderBottom: `1px solid ${C.border}`,
            cursor: "pointer",
          }}
        >
          <Avatar username={u.username} fotoPerfil={u.fotoPerfil} size={46} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.nombre}</div>
            <div style={{ fontSize: 11, color: C.muted }}>@{u.username}</div>
          </div>
          <span style={{
            fontSize: 11, color: C.pink, fontWeight: 600,
            background: C.pinkLight, padding: "4px 12px",
            borderRadius: 20,
          }}>
            {t("profile.view")}
          </span>
        </div>
      ))}
    </div>
  )
}

function GridPublicaciones({ publicaciones, onVer }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
      {publicaciones.map(pub => (
        <div
          key={pub.idPublicacion}
          onClick={() => onVer(pub.idPublicacion)}
          style={{ position: "relative", aspectRatio: "1", cursor: "pointer", overflow: "hidden" }}
        >
          {pub.fotos?.length > 0 ? (
            <img
              src={pub.fotos[0]} alt={pub.titulo}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: C.pinkLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32,
            }}>
              ✨
            </div>
          )}
          <div
            style={{
              position: "absolute", inset: 0,
              background: "rgba(44,26,34,0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 14, transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(44,26,34,0.45)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(44,26,34,0)"}
          >
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, opacity: 0, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            >
              ❤️ {pub.totalReacciones}
            </span>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
              💬 {pub.totalComentarios}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Estilos base ─────────────────────────────────────────────

const wrapStyle = {
  flex: 1, overflowY: "auto",
  background: C.white, minHeight: "100vh",
  fontFamily: "'DM Sans', sans-serif",
}

const btnPink = {
  padding: "12px 28px", borderRadius: 14, border: "none",
  background: "linear-gradient(135deg, #E8547A, #C23660)",
  color: "#FFFFFF", fontSize: 13, fontWeight: 700,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 14px rgba(232,84,122,0.35)",
}

const btnOutline = {
  padding: "11px 0", borderRadius: 12,
  border: "1.5px solid var(--border)", background: "var(--white)",
  color: "var(--text)", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
}