// src/pages/Login.jsx
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"
import { C, FONT } from "../theme"
import Spinner from "../components/Spinner"

export default function Login() {
  const { t } = useI18n()
  const { iniciarSesion, cargando, error, setError } = useAuth()
  const [form, setForm] = useState({ email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const location = useLocation()
  const mensajeBienvenida = location.state?.mensaje

  const manejarCambio = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, var(--pink-light) 0%, var(--beige) 50%, var(--pink-mid) 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: FONT.body,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #E8547A, #C23660)",
            fontSize: 32, marginBottom: 16,
            boxShadow: "0 8px 24px rgba(232,84,122,0.35)",
          }}>
            ✨
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: C.pink, margin: 0,
            fontFamily: FONT.display,
            letterSpacing: "-0.5px",
          }}>
            GlamSpace
          </h1>
          <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>
            {t('login.tagline')}
          </p>
        </div>

        {/* Tarjeta */}
        <div style={{
          background: C.white, borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 20px 60px rgba(232,84,122,0.12), 0 4px 16px rgba(0,0,0,0.04)",
        }}>
          <h2 style={{
            fontSize: 20, fontWeight: 700, color: C.text,
            margin: "0 0 6px", fontFamily: FONT.display,
          }}>
            {t('login.welcome')}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 28px" }}>
            {t('login.subtitle')}
          </p>

          {/* Mensaje de éxito */}
          {mensajeBienvenida && (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              color: "#166534", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, marginBottom: 20, display: "flex", gap: 8, alignItems: "center",
            }}>
              ✅ {mensajeBienvenida}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#991B1B", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, marginBottom: 20, display: "flex", gap: 8, alignItems: "center",
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={async e => { e.preventDefault(); await iniciarSesion(form.email, form.password) }}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('login.email')}</label>
              <div style={inputWrap}>
                <span style={iconStyle}>✉️</span>
                <input
                  type="email" name="email"
                  value={form.email} onChange={manejarCambio}
                  placeholder={t('reg.emailPh')}
                  style={inputStyle} required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>{t('login.password')}</label>
              <div style={inputWrap}>
                <span style={iconStyle}>🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password} onChange={manejarCambio}
                  placeholder={t('login.passwordPh')}
                  style={{ ...inputStyle, paddingRight: 40 }} required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: 16, color: C.muted,
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit" disabled={cargando}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: cargando
                  ? C.pinkMid
                  : "linear-gradient(135deg, #E8547A, #C23660)",
                color: C.white, fontSize: 15, fontWeight: 700,
                cursor: cargando ? "default" : "pointer",
                fontFamily: FONT.body,
                boxShadow: cargando ? "none" : "0 4px 16px rgba(232,84,122,0.4)",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {cargando && <Spinner size={16} color={C.white} track="rgba(255,255,255,0.4)" />}
              {cargando ? t('login.loggingIn') : t('login.login')}
            </button>
          </form>

          {/* Divisor */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            margin: "24px 0 8px", color: C.muted, fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            {t('login.noAccount')}
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <Link to="/registro" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "13px", borderRadius: 14,
              border: `1.5px solid ${C.pinkMid}`, background: C.pinkLight,
              color: C.pinkDark, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT.body,
            }}>
              {t('login.createAccount')}
            </button>
          </Link>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <Link to="/recuperar" style={{
              color: C.muted, fontSize: 13, fontWeight: 600,
              textDecoration: "none", fontFamily: FONT.body,
            }}>
              {t('login.forgot')}
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 20 }}>
          {t('login.footer')}
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text)", marginBottom: 6,
}
const inputWrap = {
  position: "relative", display: "flex", alignItems: "center",
}
const iconStyle = {
  position: "absolute", left: 13, fontSize: 16, zIndex: 1, pointerEvents: "none",
}
const inputStyle = {
  width: "100%", border: "1.5px solid var(--border)", borderRadius: 12,
  padding: "12px 14px 12px 40px", fontSize: 14, outline: "none",
  fontFamily: "'DM Sans', sans-serif", color: "var(--text)",
  background: "var(--pink-light)", boxSizing: "border-box",
  transition: "border-color 0.2s",
}
