// src/pages/Explorar.jsx
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { C, FONT } from "../theme"
import { useI18n } from "../context/I18nContext"
import { traducirCategoria } from "../i18n/translations"
import api from "../api/axios"
import Avatar from "../components/Avatar"
import Spinner from "../components/Spinner"

export default function Explorar() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [categorias, setCategorias] = useState([])
  const [catActiva, setCatActiva] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [posts, setPosts] = useState([])
  const [tendencias, setTendencias] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [cargandoTendencias, setCargandoTendencias] = useState(true)
  const debounce = useRef(null)

  useEffect(() => {
    api.get("/categorias/").then(r => setCategorias(r.data.categorias)).catch(() => {})
    cargarTendencias()
  }, [])

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (!query.trim() && !catActiva) { setUsuarios([]); setPosts([]); return }
    debounce.current = setTimeout(() => buscar(), 400)
  }, [query, catActiva])

  const cargarTendencias = async () => {
    setCargandoTendencias(true)
    try {
      const res = await api.get("/publicaciones/?tab=tendencias")
      setTendencias(res.data.publicaciones.slice(0, 9))
    } catch {
      setTendencias([])
    } finally {
      setCargandoTendencias(false)
    }
  }

  const buscar = async () => {
    setBuscando(true)
    try {
      const params = new URLSearchParams()
      if (catActiva) params.append("categoria", catActiva)
      const res = await api.get(`/publicaciones/?${params}`)
      let data = res.data.publicaciones

      if (query.trim()) {
        const q = query.toLowerCase()
        data = data.filter(p =>
          p.titulo?.toLowerCase().includes(q) ||
          p.descripcion?.toLowerCase().includes(q) ||
          p.username?.toLowerCase().includes(q)
        )
        const resUsers = await api.get("/auth/buscar/", { params: { q: query.trim() } })
        setUsuarios(resUsers.data.usuarios || [])
      } else {
        setUsuarios([])
      }
      setPosts(data)
    } catch {
      setPosts([]); setUsuarios([])
    } finally {
      setBuscando(false)
    }
  }

  const hayResultados = query.trim() || catActiva

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.beige }}>
      <div style={{ padding: "16px 16px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
        {/* Buscador */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.pinkLight, borderRadius: 50, padding: "10px 16px", marginBottom: 12,
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("explore.search")}
            style={{
              border: "none", background: "none", outline: "none",
              flex: 1, fontSize: 13, color: C.text, fontFamily: FONT.body,
            }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}
            >✕</button>
          )}
        </div>

        {/* Categorías */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
          {categorias.map(c => (
            <button key={c.idCategoria}
              onClick={() => setCatActiva(catActiva === c.idCategoria ? "" : c.idCategoria)}
              style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 50, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: FONT.body,
                background: catActiva === c.idCategoria ? C.pink : C.pinkMid,
                color: catActiva === c.idCategoria ? C.white : C.pinkDark,
              }}
            >
              {traducirCategoria(t, c.nombreCategoria)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {buscando && (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Spinner size={16} />
            {t("explore.searching")}
          </div>
        )}

        {!buscando && hayResultados && (
          <>
            {usuarios.length > 0 && (
              <Section title={t("explore.people")}>
                {usuarios.map(u => (
                  <div
                    key={u.idUsuario}
                    onClick={() => navigate(`/perfil/${u.idUsuario}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                    }}
                  >
                    <Avatar username={u.username} size={44} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>@{u.username}</div>
                  </div>
                ))}
              </Section>
            )}

            {posts.length > 0 && (
              <Section title={t("explore.posts")}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                  {posts.map(p => (
                    <img
                      key={p.idPublicacion}
                      src={p.fotos?.[0] || ""}
                      alt={p.titulo}
                      onClick={() => navigate(`/publicaciones/${p.idPublicacion}`)}
                      style={{
                        width: "100%", aspectRatio: "1", objectFit: "cover",
                        borderRadius: 8, cursor: "pointer", background: C.pinkLight,
                        display: "block",
                      }}
                    />
                  ))}
                </div>
              </Section>
            )}

            {!buscando && usuarios.length === 0 && posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14 }}>{t("explore.noResults", { q: query })}</div>
              </div>
            )}
          </>
        )}

        {!hayResultados && cargandoTendencias && (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 13 }}>
            <Spinner size={28} />
          </div>
        )}

        {!hayResultados && !buscando && !cargandoTendencias && tendencias.length > 0 && (
          <>
            <Section title={t("explore.trending")}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                {tendencias.map(p => (
                  <div key={p.idPublicacion} style={{ position: "relative" }}
                    onClick={() => navigate(`/publicaciones/${p.idPublicacion}`)}>
                    <img
                      src={p.fotos?.[0] || ""}
                      alt={p.titulo}
                      style={{
                        width: "100%", aspectRatio: "1", objectFit: "cover",
                        borderRadius: 8, cursor: "pointer", background: C.pinkLight, display: "block",
                      }}
                    />
                    <div style={{
                      position: "absolute", bottom: 4, left: 4, right: 4,
                      background: "rgba(0,0,0,0.45)", borderRadius: 6,
                      padding: "2px 6px", fontSize: 10, color: "#fff",
                    }}>
                      ❤️ {p.totalReacciones}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, fontFamily: FONT.display }}>
        {title}
      </div>
      {children}
    </div>
  )
}