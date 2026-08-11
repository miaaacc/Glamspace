// src/components/Avatar.jsx
import { C, FONT } from "../theme"

const PALETTE = ["#F4B8C8","#C8E6C9","#FFE0B2","#E1BEE7","#BBDEFB","#F8BBD0","#B2EBF2","#FFCCBC"]

function colorForUsername(username = "") {
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + hash * 31
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function Avatar({ username = "", fotoPerfil = "", size = 36, borde = true }) {
  const initials = username.slice(0, 2).toUpperCase() || "??"
  const bg = colorForUsername(username)

  if (fotoPerfil) {
    return (
      <img
        src={fotoPerfil}
        alt={username}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0,
          border: borde ? `2px solid ${C.pinkMid}` : "none",
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.33,
      fontWeight: 600, color: C.text, flexShrink: 0,
      fontFamily: FONT.display,
    }}>
      {initials}
    </div>
  )
}