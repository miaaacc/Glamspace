// src/pages/RecuperarPassword.jsx
import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/axios"
import { useI18n } from "../context/I18nContext"
import { C, FONT } from "../theme"
import Spinner from "../components/Spinner"
import RequisitosPassword, { passwordValida } from "../components/RequisitosPassword"

export default function RecuperarPassword() {
  const { t } = useI18n()
  const [paso, setPaso] = useState(1)
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [codigoDemo, setCodigoDemo] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState("")

  const solicitar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError("")
    setExito("")
    try {
      const res = await api.post("/auth/recuperar/solicitar/", { email })
      setCodigoDemo(res.data.codigo || "")
      setPaso(2)
    } catch (err) {
      setError(err.response?.data?.error || t('recover.errorGeneric'))
    } finally {
      setCargando(false)
    }
  }

  const cambiar = async (e) => {
    e.preventDefault()
    if (codigo.trim().length !== 6) {
      setError(t('recover.errCode'))
      return
    }
    if (!passwordValida(password)) {
      setError(t('reg.errPassword'))
      return
    }
    if (password !== confirmar) {
      setError(t('recover.errMismatch'))
      return
    }
    setCargando(true)
    setError("")
    setExito("")
    try {
      const res = await api.post("/auth/recuperar/cambiar/", { email, codigo: codigo.trim(), password })
      setExito(res.data.mensaje || t('recover.success'))
      setPaso(3)
    } catch (err) {
      setError(err.response?.data?.error || t('recover.errorGeneric'))
    } finally {
      setCargando(false)
    }
  }

  const pasos = [1, 2, 3]

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
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #E8547A, #C23660)",
            fontSize: 28, marginBottom: 12,
            boxShadow: "0 8px 24px rgba(232,84,122,0.35)",
          }}>
            🔑
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: C.pink, margin: 0,
            fontFamily: FONT.display,
          }}>
            {t('recover.title')}
          </h1>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {pasos.map((n, i) => (
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
              {i < pasos.length - 1 && (
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
            {paso === 1 && t('recover.step1Title')}
            {paso === 2 && t('recover.step2Title')}
            {paso === 3 && t('recover.doneTitle')}
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>
            {paso === 1 && t('recover.step1Sub')}
            {paso === 2 && t('recover.step2Sub')}
            {paso === 3 && t('recover.doneSub')}
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

          {/* Éxito */}
          {exito && (
            <div style={{
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              color: "#166534", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, marginBottom: 20, display: "flex", gap: 8,
            }}>
              ✅ {exito}
            </div>
          )}

          {/* Paso 1: correo */}
          {paso === 1 && (
            <form onSubmit={solicitar}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('login.email')}</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('reg.emailPh')}
                    style={inputStyle} required
                  />
                </div>
              </div>
              <button type="submit" disabled={cargando} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {cargando && <Spinner size={15} color={C.white} track="rgba(255,255,255,0.4)" />}
                {cargando ? t('recover.sending') : t('recover.sendCode')}
              </button>
            </form>
          )}

          {/* Paso 2: código + nueva contraseña */}
          {paso === 2 && (
            <form onSubmit={cambiar}>
              {/* Código demo */}
              {codigoDemo && (
                <div style={{
                  background: C.pinkLight, border: `1.5px dashed ${C.pinkMid}`,
                  borderRadius: 14, padding: "14px 16px", marginBottom: 18,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                    {t('recover.demoCode')}
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 800, color: C.pinkDark,
                    letterSpacing: 8, fontFamily: FONT.display,
                  }}>
                    {codigoDemo}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('recover.code')}</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>🔢</span>
                  <input
                    type="text"
                    value={codigo}
                    onChange={e => setCodigo(e.target.value)}
                    placeholder={t('recover.codePh')}
                    style={{ ...inputStyle, letterSpacing: 6, textAlign: "center" }}
                    maxLength={6} required
                  />
                </div>
              </div>

              {/* Nueva contraseña */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{t('recover.newPassword')}</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>🔒</span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
              {password && <RequisitosPassword password={password} />}

              {/* Confirmar contraseña */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('recover.confirmPassword')}</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>🔒</span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder={t('recover.confirmPh')}
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

              <button type="submit" disabled={cargando} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {cargando && <Spinner size={15} color={C.white} track="rgba(255,255,255,0.4)" />}
                {cargando ? t('recover.saving') : t('recover.changePassword')}
              </button>
            </form>
          )}

          {/* Paso 3: éxito */}
          {paso === 3 && (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: 14, color: C.text, margin: "0 0 24px" }}>
                {t('recover.doneSub')}
              </p>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button style={btnPrimario}>
                  {t('recover.goLogin')}
                </button>
              </Link>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link to="/login" style={{ color: C.pink, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              {t('recover.backLogin')}
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
