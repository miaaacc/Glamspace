// src/pages/NuevaPublicacion.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useI18n } from '../context/I18nContext'
import { traducirCategoria } from '../i18n/translations'
import Spinner from '../components/Spinner'

export default function NuevaPublicacion() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    idCategoria: '',
    fotos: []
  })

  useEffect(() => {
    api.get('/categorias/').then(res => setCategorias(res.data.categorias))
  }, [])

  const manejarImagen = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    // Convertir imagen a base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        fotos: [reader.result]  // guardamos el base64
      }))
    }
    reader.readAsDataURL(archivo)
  }

  const manejarEnvio = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const res = await api.post('/publicaciones/', form)
      navigate(`/publicaciones/${res.data.publicacion.idPublicacion}`)
    } catch (err) {
      setError(err.response?.data?.error || t('new.errorPublish'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--beige)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">{t('new.title')}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={manejarEnvio} className="bg-[var(--white)] rounded-2xl shadow-sm p-6 space-y-4 border border-[var(--border)]">

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('new.postTitle')}</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm({...form, titulo: e.target.value})}
              placeholder={t('new.postTitlePh')}
              className="w-full border border-[var(--border)] bg-[var(--pink-light)] rounded-lg px-4 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('new.category')}</label>
            <select
              value={form.idCategoria}
              onChange={e => setForm({...form, idCategoria: e.target.value})}
              className="w-full border border-[var(--border)] bg-[var(--pink-light)] rounded-lg px-4 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--pink)]"
              required
            >
                <option value="">{t('new.selectCategory')}</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {traducirCategoria(t, cat.nombreCategoria)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('new.description')}</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({...form, descripcion: e.target.value})}
              placeholder={t('new.descriptionPh')}
              rows={5}
              className="w-full border border-[var(--border)] bg-[var(--pink-light)] rounded-lg px-4 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--pink)] resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              {t('new.image')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={manejarImagen}
              className="w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--pink-light)] file:text-[var(--pink)] hover:file:opacity-80"
            />
            {form.fotos.length > 0 && (
              <img
                src={form.fotos[0]}
                alt={t('new.preview')}
                className="mt-3 w-full h-48 object-cover rounded-xl"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[var(--pink)] hover:opacity-90 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {cargando && <Spinner size={15} color="white" track="rgba(255,255,255,0.4)" />}
            {cargando ? t('new.publishing') : t('new.publish')}
          </button>
        </form>
      </div>
    </div>
  )
}
