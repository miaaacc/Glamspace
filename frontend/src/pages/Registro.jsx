// src/pages/Registro.jsx
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useI18n } from "../context/I18nContext"
import { C, FONT } from "../theme"
import Spinner from "../components/Spinner"
import RequisitosPassword, { passwordValida } from "../components/RequisitosPassword"

export default function Registro() {
  const { t } = useI18n()
  const { registrar, cargando, error, setError } = useAuth()
  const [form, setForm] = useState({ nombre: "", username: "", email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [paso, setPaso] = useState(1) // 2 pasos para no abrumar

  const manejarCambio = (e) => {
    setError("")
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validarPaso1 = () => {
    if (!form.nombre.trim()) { setError(t('reg.errName')); return false }
    if (!form.username.trim()) { setError(t('reg.errUsername')); return false }
    if (form.username.includes(" ")) { setError(t('reg.errUsernameSpace')); return false }
    return true
  }

  const siguientePaso = (e) => {
    e.preventDefault()
    setError("")
    if (validarPaso1()) setPaso(2)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!passwordValida(form.password)) { setError(t('reg.errPassword')); return }
    await registrar(form)
  }

  const campos1 = [
    { name: "nombre",   label: t('reg.name'),    placeholder: t('reg.namePh'),      icon: "👤", type: "text" },
    { name: "username", label: t('reg.username'), placeholder: t('reg.usernamePh'),   icon: "✨", type: "text" },
  ]
  const campos2 = [
    { name: "email",    label: t('reg.email'),   placeholder: t('reg.emailPh'),     icon: "✉️", type: "email" },
  ]

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
        <div style={{ textAlign: "center", marginBottom: 32 }}>
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
          }}>
            GlamSpace
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
            {t('reg.tagline')}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {[1, 2].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: paso >= n
                  ? "linear-gradient(135deg, #E8547A, #C23660)"
                  : C.pinkLight,
                border: `2px solid ${paso >= n ? C.pink : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                color: paso >= n ? C.white : C.muted,
                transition: "all 0.3s",
              }}>
                {paso > n ? "✓" : n}
              </div>
              {n < 2 && (
                <div style={{
                  width: 48, height: 2, borderRadius: 2,
                  background: paso > n ? C.pink : C.border,
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          ))}
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
            {paso === 1 ? t('reg.step1Title') : t('reg.step2Title')}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>
            {paso === 1 ? t('reg.step1Sub') : t('reg.step2Sub')}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              color: "#991B1B", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, marginBottom: 20, display: "flex", gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Paso 1 */}
          {paso === 1 && (
            <form onSubmit={siguientePaso}>
              {campos1.map(c => (
                <div key={c.name} style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>{c.label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={iconStyle}>{c.icon}</span>
                    <input
                      type={c.type} name={c.name}
                      value={form[c.name]} onChange={manejarCambio}
                      placeholder={c.placeholder}
                      style={inputStyle} required
                    />
                  </div>
                </div>
              ))}

              {/* Preview username */}
              {form.username && (
                <div style={{
                  background: C.pinkLight, borderRadius: 10,
                  padding: "10px 14px", fontSize: 12, color: C.pinkDark,
                  marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
                }}>
                  ✨ {t('reg.previewProfile')} <strong>@{form.username}</strong>
                </div>
              )}

              <button type="submit" style={btnPrimario}>
                {t('reg.continue')}
              </button>
            </form>
          )}

          {/* Paso 2 */}
          {paso === 2 && (
            <form onSubmit={enviar}>
              {campos2.map(c => (
                <div key={c.name} style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>{c.label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={iconStyle}>{c.icon}</span>
                    <input
                      type={c.type} name={c.name}
                      value={form[c.name]} onChange={manejarCambio}
                      placeholder={c.placeholder}
                      style={inputStyle} required
                    />
                  </div>
                </div>
              ))}

              {/* Contraseña */}
              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>{t('login.password')}</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>🔒</span>
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password} onChange={manejarCambio}
                    placeholder={t('reg.passwordPh')}
                    style={{ ...inputStyle, paddingRight: 44 }} required
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
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

              {/* Requisitos de contraseña */}
              {form.password && <RequisitosPassword password={form.password} />}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setPaso(1); setError("") }}
                  style={btnSecundario}
                >
                  {t('reg.back')}
                </button>
                <button
                  type="submit" disabled={cargando}
                  style={{ ...btnPrimario, flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {cargando && <Spinner size={15} color={C.white} track="rgba(255,255,255,0.4)" />}
                  {cargando ? t('reg.creating') : t('reg.create')}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ fontSize: 13, color: C.muted }}>{t('reg.haveAccount')} </span>
            <Link to="/login" style={{ color: C.pink, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              {t('reg.login')}
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
const iconStyle = {
  position: "absolute", left: 13, top: "50%",
  transform: "translateY(-50%)", fontSize: 16,
  zIndex: 1, pointerEvents: "none",
}
const inputStyle = {
  width: "100%", border: "1.5px solid var(--border)", borderRadius: 12,
  padding: "12px 14px 12px 40px", fontSize: 14, outline: "none",
  fontFamily: "'DM Sans', sans-serif", color: "var(--text)",
  background: "var(--pink-light)", boxSizing: "border-box",
}
const btnPrimario = {
  width: "100%", padding: "14px", borderRadius: 14, border: "none",
  background: "linear-gradient(135deg, #E8547A, #C23660)",
  color: "#FFFFFF", fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 16px rgba(232,84,122,0.35)",
}
const btnSecundario = {
  flex: 1, padding: "14px", borderRadius: 14,
  border: "1.5px solid var(--border)", background: "var(--pink-light)",
  color: "var(--muted)", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
}
