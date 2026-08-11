// src/components/Spinner.jsx
import { C } from "../theme"

export default function Spinner({ size = 28, color = C.pink, track = C.pinkMid }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${Math.max(2, Math.round(size / 8))}px solid ${track}`,
        borderTopColor: color,
        animation: "spin 0.8s linear infinite",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  )
}
