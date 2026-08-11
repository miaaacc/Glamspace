// src/pages/Mensajes.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { C, FONT } from "../theme"
import api from "../api/axios"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"
import { useLayout } from "../context/LayoutContext"
import Avatar from "../components/Avatar"
import Spinner from "../components/Spinner"

export default function Mensajes() {
  const { t, idioma } = useI18n()
  const { usuario } = useAuth()
  const { setChatAbierto } = useLayout()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [hilos, setHilos] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [cargandoHilos, setCargandoHilos] = useState(true)
  const [cargandoChat, setCargandoChat] = useState(false)
  const bottomRef = useRef(null)
  const chatActivoRef = useRef(null)

  useEffect(() => {
    cargarHilos()
    // Si viene ?con=idUsuario desde un perfil, abrir ese chat
    const conId = searchParams.get("con")
    const conUser = searchParams.get("username")
    if (conId && conUser) {
      abrirChat({ idOtro: conId, usernameOtro: conUser, fotoOtro: "" })
    }
    // Al salir de la página, restablecer el layout normal
    return () => setChatAbierto(false)
  }, [])

  useEffect(() => {
    if (chatActivo) {
      cargarMensajes()
      const intervalo = setInterval(cargarMensajes, 8000)
      return () => clearInterval(intervalo)
    }
  }, [chatActivo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  const cargarHilos = async () => {
    setCargandoHilos(true)
    try {
      const res = await api.get("/mensajes/")
      setHilos(res.data.hilos)
    } catch {}
    finally { setCargandoHilos(false) }
  }

  const cargarMensajes = async () => {
    const chat = chatActivoRef.current
    if (!chat) return
    setCargandoChat(true)
    try {
      const res = await api.get(`/mensajes/${chat.idOtro}/`)
      // Si el chat se cerró o cambió mientras llegaba la respuesta, no tocar estado
      if (chatActivoRef.current !== chat) return
      setMensajes(res.data.mensajes)
      if (res.data.otroUsuario?.username) {
        setChatActivo(prev => {
          if (!prev) return prev
          return { ...prev, usernameOtro: res.data.otroUsuario.username, fotoOtro: res.data.otroUsuario.fotoPerfil }
        })
      }
    } catch {}
    finally { setCargandoChat(false) }
  }

  const abrirChat = (hilo) => {
    chatActivoRef.current = hilo
    setChatActivo(hilo)
    setMensajes([])
    setChatAbierto(true)
  }

  const cerrarChat = () => {
    chatActivoRef.current = null
    setChatActivo(null)
    setChatAbierto(false)
    cargarHilos()
  }

  const enviar = async () => {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const optimista = {
      idMensaje: "tmp-" + Date.now(),
      idRemitente: usuario.idUsuario,
      contenido: texto.trim(),
      fecha: new Date().toISOString(),
      enviando: true,
    }
    setMensajes(prev => [...prev, optimista])
    setTexto("")
    try {
      await api.post(`/mensajes/${chatActivo.idOtro}/`, { contenido: optimista.contenido })
      cargarMensajes()
      cargarHilos()
    } catch {
      setMensajes(prev => prev.filter(m => m.idMensaje !== optimista.idMensaje))
    } finally {
      setEnviando(false)
    }
  }

  if (chatActivo) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.beige, minHeight: 0 }}>
        {/* Header chat */}
        <div style={{
          padding: "12px 16px", background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={cerrarChat}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.pink }}
          >←</button>
          <Avatar username={chatActivo.usernameOtro} fotoPerfil={chatActivo.fotoOtro} size={36} />
          <div
            onClick={() => navigate(`/perfil/${chatActivo.idOtro}`)}
            style={{ fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer" }}
          >
            @{chatActivo.usernameOtro}
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {cargandoChat && mensajes.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spinner size={28} />
            </div>
          )}
          {mensajes.map(m => {
            const esMio = m.idRemitente === usuario.idUsuario
            const hora = new Date(m.fecha).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-CR', { hour: "2-digit", minute: "2-digit" })
            return (
              <div key={m.idMensaje} style={{ alignSelf: esMio ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                {m.tipo === "publicacion" && m.publicacionEliminada ? (
                  <div style={{
                    padding: 10, borderRadius: "18px 18px 4px 18px",
                    background: esMio ? C.pink : C.white,
                    border: esMio ? "none" : `1px solid ${C.border}`,
                    opacity: m.enviando ? 0.6 : 1,
                    minWidth: 220,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
                      color: esMio ? "rgba(255,255,255,0.9)" : C.muted, marginBottom: 6,
                    }}>
                      🔗 {t('messages.sharedPost')}
                    </div>
                    <div
                      onClick={() => navigate(`/publicaciones/${m.idPublicacion}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: esMio ? "rgba(255,255,255,0.18)" : C.pinkLight,
                        borderRadius: 12, padding: 8, cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 16, flexShrink: 0 }}>🗑️</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: esMio ? C.white : C.muted, textDecoration: "line-through" }}>
                        {m.tituloPublicacion}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, color: esMio ? "rgba(255,255,255,0.9)" : C.muted, marginTop: 6,
                    }}>
                      {t('messages.postDeleted')}
                    </div>
                  </div>
                ) : m.tipo === "publicacion" ? (
                  <div style={{
                    padding: 10, borderRadius: "18px 18px 4px 18px",
                    background: esMio ? C.pink : C.white,
                    border: esMio ? "none" : `1px solid ${C.border}`,
                    opacity: m.enviando ? 0.6 : 1,
                    minWidth: 220,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
                      color: esMio ? "rgba(255,255,255,0.9)" : C.muted, marginBottom: 6,
                    }}>
                      🔗 {t('messages.sharedPost')}
                    </div>
                    <div
                      onClick={() => navigate(`/publicaciones/${m.idPublicacion}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: esMio ? "rgba(255,255,255,0.18)" : C.pinkLight,
                        borderRadius: 12, padding: 8, cursor: "pointer",
                      }}
                    >
                      {m.fotoPublicacion && (
                        <img
                          src={m.fotoPublicacion}
                          alt={m.tituloPublicacion}
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: esMio ? C.white : C.text,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {m.tituloPublicacion}
                        </div>
                        <div style={{ fontSize: 10, color: esMio ? "rgba(255,255,255,0.9)" : C.muted }}>
                          @{m.autorPublicacion}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "10px 14px", borderRadius: esMio ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: esMio ? C.pink : C.white,
                    color: esMio ? C.white : C.text,
                    fontSize: 13, lineHeight: 1.5,
                    border: esMio ? "none" : `1px solid ${C.border}`,
                    opacity: m.enviando ? 0.6 : 1,
                  }}>
                    {m.contenido}
                  </div>
                )}
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2, textAlign: esMio ? "right" : "left" }}>
                  {hora}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px 24px", borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 10, alignItems: "center", background: C.white,
        }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === "Enter" && enviar()}
            placeholder={t('messages.placeholder')}
            style={{
              flex: 1, border: `1px solid ${C.border}`, borderRadius: 50,
              padding: "10px 16px", fontSize: 13, outline: "none",
              background: C.pinkLight, fontFamily: FONT.body, color: C.text,
            }}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando}
            style={{
              width: 42, height: 42, borderRadius: "50%",
              background: texto.trim() ? C.pink : C.pinkMid,
              border: "none", cursor: texto.trim() ? "pointer" : "default",
              fontSize: 18, color: C.white, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            {enviando ? <Spinner size={16} color={C.white} track="rgba(255,255,255,0.4)" /> : "➤"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.beige }}>
      <div style={{ padding: "16px" }}>
        {cargandoHilos && hilos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spinner size={28} />
          </div>
        ) : hilos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14 }}>{t('messages.empty')}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{t('messages.emptySub')}</div>
          </div>
        ) : (
          hilos.map(h => (
            <div
              key={h.idOtro}
              onClick={() => abrirChat(h)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0", borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
              }}
            >
              <Avatar username={h.usernameOtro} fotoPerfil={h.fotoOtro} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                  @{h.usernameOtro}
                </div>
                <div style={{
                  fontSize: 12, color: C.muted,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {h.ultimoMensaje}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
                {new Date(h.fecha).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-CR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}