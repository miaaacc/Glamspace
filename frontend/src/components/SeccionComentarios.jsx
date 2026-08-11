// src/components/SeccionComentarios.jsx
import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import Spinner from './Spinner'
import Avatar from './Avatar'

export default function SeccionComentarios({ idPublicacion }) {
  const { usuario } = useAuth()
  const { idioma, t } = useI18n()
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    cargarComentarios()
    const intervalo = setInterval(cargarComentarios, 15000)
    return () => clearInterval(intervalo)
  }, [idPublicacion])

  async function cargarComentarios() {
    try {
      const res = await api.get(`/comentarios/${idPublicacion}/`)
      setComentarios(res.data.comentarios)
    } catch (err) {
      console.error('Error cargando comentarios:', err)
    } finally {
      setCargando(false)
    }
  }

  async function enviarComentario(e) {
    e.preventDefault()
    if (!texto.trim() || enviando) return

    setEnviando(true)
    try {
      const res = await api.post(`/comentarios/${idPublicacion}/`, {
        contenido: texto.trim()
      })
      setComentarios(prev => [...prev, res.data.comentario])
      setTexto('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      alert(err.response?.data?.error || t('common.error'))
    } finally {
      setEnviando(false)
    }
  }

  async function eliminarComentario(idComentario) {
    if (!confirm(t('comments.confirmDelete'))) return
    try {
      await api.delete(`/comentarios/eliminar/${idComentario}/`)
      setComentarios(prev => prev.filter(c => c.idComentario !== idComentario))
    } catch {
      alert('No puedes eliminar este comentario')
    }
  }

  return (
    <div className="pt-16 pb-10">
      <h3 className="flex items-center gap-2 font-semibold text-[var(--text)] mb-6">
        <span className="text-base">💬</span>
        <span>{t('comments.title', { n: comentarios.length })}</span>
      </h3>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-6">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-[var(--pink)] border-t-transparent animate-spin" />
          {t('comments.loading')}
        </div>
      ) : comentarios.length === 0 ? (
        <p className="text-center text-sm text-[var(--muted)] py-9 mb-4">
          {t('comments.empty')}
        </p>
      ) : (
        <div className="space-y-5 mb-6">
          {comentarios.map(com => {
            const esMio = com.idUsuario === usuario?.idUsuario
            const fecha = new Date(com.fechaComentario).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-CR', {
              hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={com.idComentario} className="flex gap-3 group" style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                <Avatar username={com.username} fotoPerfil={com.fotoPerfil} size={36} />

                <div className="flex-1 min-w-0">
                  <div className={`rounded-2xl rounded-tl-md px-4 py-2.5 text-sm inline-block max-w-full shadow-sm ${
                    esMio ? 'bg-[var(--pink-mid)]' : 'bg-[var(--pink-light)]'
                  }`}>
                    <span className="font-semibold text-[var(--pink-dark)] mr-2">
                      @{com.username}
                    </span>
                    <span className="text-[var(--text)] break-words leading-relaxed">{com.contenido}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <span className="text-[11px] text-[var(--muted)]">{fecha}</span>
                    {esMio && (
                      <button
                        onClick={() => eliminarComentario(com.idComentario)}
                        className="text-[11px] text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        {t('comments.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Formulario de comentario */}
      <form
        onSubmit={enviarComentario}
        className="flex items-center gap-3 pt-8 border-t border-[var(--border)]"
      >
        <Avatar username={usuario?.username} fotoPerfil={usuario?.fotoPerfil} size={36} />
        <div className="flex-1 flex gap-2 items-center">
          <input
            type="text"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={t('comments.placeholder')}
            maxLength={500}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enviarComentario(e) } }}
            className="flex-1 border border-[var(--border)] bg-[var(--pink-light)] rounded-full px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pink)] focus:border-[var(--pink)] min-w-0"
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-base transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: texto.trim() && !enviando
                ? 'linear-gradient(135deg, var(--pink) 0%, var(--pink-dark) 100%)'
                : 'var(--pink-mid)',
              boxShadow: texto.trim() && !enviando ? '0 4px 14px rgba(232, 84, 122, 0.4)' : 'none',
            }}
            aria-label={t('comments.send')}
          >
            {enviando ? <Spinner size={15} color="#fff" track="rgba(255,255,255,0.4)" /> : '➤'}
          </button>
        </div>
      </form>
    </div>
  )
}
