// src/context/LayoutContext.jsx
import { createContext, useContext, useState } from "react"

const LayoutContext = createContext(null)

export function LayoutProvider({ children }) {
  const [chatAbierto, setChatAbierto] = useState(false)

  return (
    <LayoutContext.Provider value={{ chatAbierto, setChatAbierto }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error("useLayout debe usarse dentro de LayoutProvider")
  return ctx
}
