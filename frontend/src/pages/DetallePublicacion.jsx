// src/pages/DetallePublicacion.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import Reacciones from '../components/Reacciones'
import SeccionComentarios from '../components/SeccionComentarios'
import BotonReportar from '../components/BotonReportar'
import ModalCompartirPublicacion from '../components/ModalCompartirPublicacion'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'

export default function DetallePublicacion() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const { idioma, t } = useI18n()
  const navigate = useNavigate()

  const [publicacion, setPublicacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [eliminada, setEliminada] = useState(false)
  const [esFavorito, setEsFavorito] = useState(false)
  const [compartirAbierto, setCompartirAbierto] = useState(false)

  useEffect(() => {
    api.get(`/publicaciones/${id}/`)
      .then(res => {
        setPublicacion(res.data.publicacion)
        setEsFavorito(!!res.data.publicacion.esFavorito)
      })
      .catch(err => {
        if (err.response?.status === 404) setEliminada(true)
        else navigate('/feed')
      })
      .finally(() => setCargando(false))
  }, [id])

  const eliminar = async () => {
    if (!confirm(t('detail.confirmDelete'))) return

    try {
      await api.delete(`/publicaciones/${id}/`)
      navigate('/feed')
    } catch (err) {
      alert(err.response?.data?.error || t('common.error'))
    }
  }

  const toggleFavorito = async () => {
    const anterior = esFavorito
    setEsFavorito(!anterior)

    try {
      const res = await api.post(`/favoritos/${id}/toggle/`)
      setEsFavorito(res.data.guardado)
    } catch {
      setEsFavorito(anterior)
    }
  }

  if (cargando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--beige)',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        <Spinner size={36} />
      </div>
    )
  }

  if (eliminada) {
    return (
      <div className="min-h-[calc(100vh-129px)] md:min-h-[calc(100vh-169px)] bg-[var(--beige)] grid place-items-center px-4">
        <div
          className="max-w-md w-full bg-[var(--white)] rounded-3xl p-8 text-center shadow-sm border border-[var(--border)]"
          style={{ animation: 'fadeSlideIn 0.4s ease' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--pink-light)] flex items-center justify-center text-3xl">
            🗑️
          </div>
          <h1 className="text-lg font-bold text-[var(--text)] mb-1">
            {t('detail.notFound')}
          </h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            {t('detail.notFoundSub')}
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--pink) 0%, var(--pink-dark) 100%)',
              boxShadow: '0 4px 14px rgba(232, 84, 122, 0.35)'
            }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  const esDueno = usuario?.idUsuario === publicacion?.idUsuario
  const esAdmin = ['admin', 'moderador'].includes(usuario?.rol)

  const fecha = new Date(
    publicacion.fechaPublicacion
  ).toLocaleDateString(
    idioma === 'en' ? 'en-US' : 'es-CR',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  )

  const tieneFoto = publicacion.fotos?.length > 0

  return (
    <div className="min-h-[calc(100vh-129px)] md:h-[calc(100vh-169px)] md:overflow-hidden bg-[var(--beige)] grid place-items-center py-4">

      <div className="w-full max-w-[960px] px-3 sm:px-4 flex h-full">

        {/* Tarjeta principal con borde degradado */}
        <div
          className={`rounded-3xl p-[2px] gradiente-rosa shadow-rosa flex-1 max-h-full flex ${
            tieneFoto ? '' : 'md:max-w-xl md:mx-auto'
          }`}
          style={{ animation: 'fadeSlideIn 0.4s ease' }}
        >

          <div
            className={`bg-[var(--white)] rounded-[22px] overflow-hidden relative w-full flex flex-col min-h-0 ${
              tieneFoto
                ? 'md:grid md:grid-cols-7 md:gap-x-2'
                : ''
            }`}
          >

            {/* Botón de regresar */}
            <button
              onClick={() => navigate(-1)}
              aria-label={t('common.back')}
              className="absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-[var(--white)]/90 border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--pink)] transition hover:opacity-80 active:scale-95"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Imagen */}
            {tieneFoto && (
              <div className="bg-[var(--pink-light)] shrink-0 md:col-span-4 md:flex md:items-center md:justify-center md:p-5 md:h-full">
                <img
                  src={publicacion.fotos[0]}
                  alt={publicacion.titulo}
                  className="w-full aspect-[4/3] object-cover md:aspect-auto md:h-full md:max-h-[560px] md:w-full md:object-cover md:rounded-2xl"
                />
              </div>
            )}

            {/* Panel derecho (Lógica de espaciado corregida con gap y separadores) */}
            <div className="flex flex-col flex-1 min-h-0 md:col-span-3 px-5 sm:px-6 py-6 gap-6">

              {/* 1. USUARIO + FECHA */}
              <div className="flex items-center justify-between gap-3 pt-6 md:pt-0 pb-2 border-b border-[var(--border)]/40 shrink-0">
                <div
                  className="flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() =>
                    navigate(`/perfil/${publicacion.idUsuario}`)
                  }
                >
                  <Avatar
                    username={publicacion.username}
                    fotoPerfil={publicacion.fotoPerfil}
                    size={44}
                  />

                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text)] text-sm leading-tight truncate">
                      @{publicacion.username}
                    </p>

                    <p className="text-xs text-[var(--muted)] mt-1">
                      {fecha}
                    </p>
                  </div>
                </div>

                {(esDueno || esAdmin) && (
                  <button
                    onClick={eliminar}
                    className="text-xs font-medium text-red-400 hover:text-red-600 transition shrink-0"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>

              {/* 2. TÍTULO Y DESCRIPCIÓN */}
              <div className="flex flex-col gap-3 shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
                    {t('detail.postTitle')}
                  </p>
                  <h1 className="text-lg sm:text-xl font-bold text-[var(--text)] leading-snug">
                    {publicacion.titulo}
                  </h1>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
                    {t('detail.bio')}
                  </p>
                  <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-line">
                    {publicacion.descripcion}
                  </p>
                </div>
              </div>

              {/* 3. GUARDAR / COMPARTIR / REPORTAR */}
              <div className="py-2 border-y border-[var(--border)]/40 shrink-0">
                <div className="flex flex-wrap items-center gap-3">

                  {/* Guardar */}
                  <button
                    onClick={toggleFavorito}
                    className="flex items-center gap-2 text-xs font-semibold pl-2 pr-3.5 py-1.5 rounded-full transition-all active:scale-95"
                    style={
                      esFavorito
                        ? {
                            background:
                              'linear-gradient(135deg, var(--pink) 0%, var(--pink-dark) 100%)',
                            color: '#fff',
                            boxShadow:
                              '0 4px 12px rgba(232, 84, 122, 0.3)'
                          }
                        : {
                            background: 'var(--white)',
                            border: '1.5px solid var(--pink)',
                            color: 'var(--pink)'
                          }
                    }
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: esFavorito
                          ? 'rgba(255,255,255,0.25)'
                          : 'var(--pink-light)',
                        animation: esFavorito
                          ? 'heartBeat 0.5s ease'
                          : undefined
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={esFavorito ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>

                    {esFavorito
                      ? t('detail.saved')
                      : t('detail.save')}
                  </button>

                  {/* Compartir */}
                  <button
                    onClick={() => setCompartirAbierto(true)}
                    className="flex items-center gap-2 text-xs font-semibold pl-2 pr-3.5 py-1.5 rounded-full transition-all active:scale-95"
                    style={{
                      background: 'var(--white)',
                      border: '1.5px solid var(--pink)',
                      color: 'var(--pink)'
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'var(--pink-light)' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </span>

                    {t('share.sharePost')}
                  </button>

                  {/* Reportar */}
                  {!esDueno && (
                    <BotonReportar
                      idPublicacion={publicacion.idPublicacion}
                    />
                  )}

                </div>
              </div>

              {/* 4. REACCIONES */}
              <div className="pb-2 border-b border-[var(--border)]/40 shrink-0">
                <Reacciones
                  idPublicacion={publicacion.idPublicacion}
                />
              </div>

              {/* 5. COMENTARIOS */}
              <div className="pt-2 md:flex-1 md:min-h-0 md:overflow-y-auto">
                <SeccionComentarios
                  idPublicacion={publicacion.idPublicacion}
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modal compartir */}
      <ModalCompartirPublicacion
        abierto={compartirAbierto}
        publicacion={publicacion}
        onClose={() => setCompartirAbierto(false)}
      />

    </div>
  )
}
