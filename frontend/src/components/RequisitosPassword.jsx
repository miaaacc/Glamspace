// src/components/RequisitosPassword.jsx
import { useI18n } from "../context/I18nContext"
import { C } from "../theme"

export function validarRequisitos(password = "") {
  return {
    longitud:  password.length >= 8,
    mayuscula: /[A-Z]/.test(password),
    minuscula: /[a-z]/.test(password),
    numero:    /[0-9]/.test(password),
    especial:  /[^A-Za-z0-9]/.test(password),
  }
}

export function passwordValida(password) {
  const r = validarRequisitos(password)
  return r.longitud && r.mayuscula && r.minuscula && r.numero && r.especial
}

export default function RequisitosPassword({ password }) {
  const { t } = useI18n()
  const reqs = validarRequisitos(password)

  const items = [
    { key: "longitud",  label: t('reg.reqLength') },
    { key: "mayuscula", label: t('reg.reqUpper') },
    { key: "minuscula", label: t('reg.reqLower') },
    { key: "numero",    label: t('reg.reqNumber') },
    { key: "especial",  label: t('reg.reqSpecial') },
  ]

  return (
    <div style={{
      background: C.pinkLight, borderRadius: 12,
      padding: "10px 14px", marginBottom: 20,
    }}>
      {items.map(it => {
        const ok = reqs[it.key]
        return (
          <div key={it.key} style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, marginBottom: 4, lineHeight: 1.5,
            color: ok ? "#166534" : C.muted,
            fontWeight: ok ? 600 : 400,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 11 }}>{ok ? "✅" : "⬜"}</span>
            {it.label}
          </div>
        )
      })}
    </div>
  )
}
