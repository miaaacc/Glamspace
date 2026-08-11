// src/pages/EditarPerfil.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import Spinner from '../components/Spinner'

export default function EditarPerfil() {
  const { t } = useI18n()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    biografia: usuario?.biografia || '',
    fotoPerfil: usuario?.fotoPerfil || ''
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const manejarFoto = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    // Validar tamaño (máximo 2MB)
    if (archivo.size > 10 * 1024 * 1024) {
      setError(t('edit.imgTooBig'))
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, fotoPerfil: reader.result }))
    }
    reader.readAsDataURL(archivo)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    setExito('')

    try {
      const res = await api.put('/auth/editar/perfil/', form)

      // Actualizar el contexto con los datos nuevos
      const usuarioActualizado = res.data.usuario
      localStorage.setItem('usuario', JSON.stringify({
        ...usuario,
        nombre: usuarioActualizado.nombre,
        biografia: usuarioActualizado.biografia,
        fotoPerfil: usuarioActualizado.fotoPerfil
      }))

      setExito(t('edit.success'))
      setTimeout(() => navigate(`/perfil/${usuario.idUsuario}`), 1500)
    } catch (err) {
      setError(err.response?.data?.error || t('edit.errorSave'))
    } finally {
      setCargando(false)
    }
  }

  const restantes = 200 - form.biografia.length

  return (
    <div className="h-[calc(100vh-129px)] md:h-[calc(100vh-169px)] overflow-hidden flex items-center justify-center px-4 py-6">

      <div className="w-full max-w-lg max-h-full flex flex-col animate-[fadeSlideIn_0.3s_ease]">

        {/* Alertas */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-4 text-sm flex items-center justify-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {exito && (
          <div className="bg-green-50 border border-green-200 text-green-600 rounded-2xl px-4 py-3 mb-4 text-sm flex items-center justify-center gap-2">
            <span>✅</span> {exito}
          </div>
        )}

        {/* ── Tarjeta ──────────────────────────────────────── */}
        <div className="bg-[var(--white)] rounded-[28px] shadow-rosa border border-[var(--border)] overflow-hidden flex flex-col min-h-0">

          {/* Portada degradada */}
          <div className="gradiente-rosa flex items-center gap-3 px-2 pt-4 pb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
              aria-label={t('common.cancel')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none mb-14">{t('edit.title')}</h1>
              <p className="text-white/80 text-sm leading-none">@{usuario?.username}</p>
            </div>
            <div className="shrink-0 w-10" />
          </div>

          {/* Cuerpo */}
          <div className="px-6 pb-7 overflow-y-auto min-h-0 flex-1">

            {/* Foto de perfil */}
            <div className="flex flex-col items-center pt-6">
              <div className="relative w-32 h-32">
                <div className="w-full h-full rounded-full p-[3px] gradiente-rosa">
                  {form.fotoPerfil ? (
                    <img src={form.fotoPerfil} alt="Foto de perfil" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--beige)] flex items-center justify-center text-[var(--pink)] font-bold text-4xl">
                      {usuario?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full gradiente-rosa text-white text-base flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition border-[3px] border-[var(--white)]">
                  📷
                  <input type="file" accept="image/*" onChange={manejarFoto} className="hidden" />
                </label>
              </div>

              <div className="mt-3 flex items-center gap-5">
                <label className="cursor-pointer text-[15px] font-semibold text-[var(--pink)] hover:text-[var(--pink-dark)] transition">
                  {t('edit.changePhoto')}
                  <input type="file" accept="image/*" onChange={manejarFoto} className="hidden" />
                </label>
                {form.fotoPerfil && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, fotoPerfil: '' }))}
                    className="text-sm text-[var(--muted)] hover:text-red-400 transition"
                  >
                    {t('edit.removePhoto')}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={guardar} className="mt-6 space-y-6">

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  {t('edit.fullName')}
                </label>
                <div className="flex items-stretch border border-[var(--border)] bg-[var(--beige-card)] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--pink)] transition">
                  <span className="flex items-center pl-4 text-[var(--muted)] text-base">👤</span>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="flex-1 bg-transparent px-3 py-3.5 text-[15px] text-[var(--text)] outline-none min-w-0"
                    required
                  />
                </div>
              </div>

              {/* Biografía */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {t('edit.bio')}
                  </label>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition ${
                    restantes <= 20
                      ? 'bg-red-50 text-red-500'
                      : restantes <= 60
                        ? 'bg-[var(--pink-light)] text-[var(--pink)]'
                        : 'bg-[var(--pink-light)] text-[var(--muted)]'
                  }`}>
                    {restantes}
                  </span>
                </div>
                <div className="flex items-start border border-[var(--border)] bg-[var(--beige-card)] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--pink)] transition">
                  <span className="pt-3.5 pl-4 text-[var(--muted)] text-base">✍️</span>
                  <textarea
                    value={form.biografia}
                    onChange={e => setForm({ ...form, biografia: e.target.value })}
                    placeholder={t('edit.bioPlaceholder')}
                    maxLength={200}
                    rows={4}
                    className="flex-1 bg-transparent px-3 py-3 text-[15px] text-[var(--text)] outline-none resize-none min-w-0"
                  />
                </div>
              </div>

              {/* Username (no editable) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                  {t('edit.usernameReadonly')}
                </label>
                <div className="flex items-stretch border border-dashed border-[var(--border)] bg-[var(--beige-card)] rounded-2xl overflow-hidden">
                  <span className="flex items-center pl-4 text-[var(--muted)] text-base">🔒</span>
                  <input
                    type="text"
                    value={`@${usuario?.username}`}
                    disabled
                    className="flex-1 bg-transparent px-3 py-3.5 text-[15px] text-[var(--muted)] cursor-not-allowed min-w-0"
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 border border-[var(--border)] bg-[var(--beige-card)] text-[var(--muted)] hover:bg-[var(--pink-light)] hover:text-[var(--pink)] font-semibold py-3 rounded-2xl transition text-[15px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 gradiente-rosa hover:opacity-90 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-50 text-[15px] shadow-rosa"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {cargando && <Spinner size={15} color="white" track="rgba(255,255,255,0.4)" />}
                  {cargando ? t('edit.saving') : `💾  ${t('edit.save')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
