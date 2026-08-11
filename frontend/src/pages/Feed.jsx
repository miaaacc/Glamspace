// src/pages/Feed.jsx
import { useState, useEffect } from "react"
import { C, FONT } from "../theme"
import api from "../api/axios"
import PostCard from "../components/PostCard"
import { useI18n } from "../context/I18nContext"
import { traducirCategoria } from "../i18n/translations"

export default function Feed() {
  const { t } = useI18n()
  const TABS = [
    { id: "parati",      label: t("feed.forYou") },
    { id: "siguiendo",   label: t("feed.following") },
    { id: "tendencias",  label: t("feed.trending") },
  ]
  const [activeTab, setActiveTab] = useState("parati")
  const [posts, setPosts] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get("/categorias/").then(r => setCategorias(r.data.categorias)).catch(() => {})
  }, [])

  useEffect(() => {
    cargarPosts()
  }, [activeTab, categoriaActiva])

  const cargarPosts = async () => {
    setCargando(true)
    try {
      let url = "/publicaciones/"
      const params = new URLSearchParams()
      if (categoriaActiva) params.append("categoria", categoriaActiva)
      params.append("tab", activeTab)
      if (params.toString()) url += "?" + params.toString()
      const res = await api.get(url)
      setPosts(res.data.publicaciones || [])
    } catch {
      setPosts([])
    } finally {
      setCargando(false)
    }
  }

  const eliminarPost = (id) => setPosts(prev => prev.filter(p => p.idPublicacion !== id))

  return (
    <div style={{ minHeight: "100vh", background: C.beige }}>
      {/* Tabs */}
      <div style={{
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", maxWidth: 680, margin: "0 auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "12px 0", background: "none", border: "none",
              cursor: "pointer", fontSize: 13,
              fontWeight: activeTab === t.id ? 700 : 400,
              color: activeTab === t.id ? C.pink : C.muted,
              borderBottom: activeTab === t.id ? `2.5px solid ${C.pink}` : "2.5px solid transparent",
              fontFamily: FONT.body,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chips de categoría */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          display: "flex", gap: 8, overflowX: "auto",
          padding: "12px 16px", maxWidth: 680, margin: "0 auto",
        }}>
          <ChipCat label={t("feed.all")} activo={!categoriaActiva} onClick={() => setCategoriaActiva("")} />
          {categorias.map(c => (
            <ChipCat
              key={c.idCategoria}
              label={traducirCategoria(t, c.nombreCategoria)}
              activo={categoriaActiva === c.idCategoria}
              onClick={() => setCategoriaActiva(categoriaActiva === c.idCategoria ? "" : c.idCategoria)}
            />
          ))}
        </div>
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 0" }}>
        {cargando ? (
          <Skeleton />
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
            <div style={{ fontSize: 14 }}>{t("feed.empty")}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{t("feed.emptySub")}</div>
          </div>
        ) : (
          posts.map(p => <PostCard key={p.idPublicacion} pub={p} onDelete={eliminarPost} />)
        )}
      </div>
    </div>
  )
}

function ChipCat({ label, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, padding: "6px 14px", borderRadius: 50, border: "none",
        cursor: "pointer", fontSize: 12, fontWeight: 600,
        background: activo ? C.pink : C.pinkMid,
        color: activo ? C.white : C.pinkDark,
        fontFamily: FONT.body, transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  )
}

function Skeleton() {
  return (
    <div>
      {[1, 2].map(i => (
        <div key={i} style={{ background: C.white, borderRadius: 20, marginBottom: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <div style={{ padding: "14px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.pinkMid }} />
            <div>
              <div style={{ width: 100, height: 10, background: C.pinkMid, borderRadius: 6, marginBottom: 6 }} />
              <div style={{ width: 60, height: 8, background: C.pinkLight, borderRadius: 6 }} />
            </div>
          </div>
          <div style={{ height: 240, background: C.pinkLight }} />
        </div>
      ))}
    </div>
  )
}