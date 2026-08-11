// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import { I18nProvider } from "./context/I18nContext"
import { LayoutProvider, useLayout } from "./context/LayoutContext"
import RutaProtegida from "./components/RutaProtegida"

import Login from "./pages/Login"
import Registro from "./pages/Registro"
import RecuperarPassword from "./pages/RecuperarPassword"
import Feed from "./pages/Feed"
import Explorar from "./pages/Explorar"
import Mensajes from "./pages/Mensajes"
import Perfil from "./pages/Perfil"
import EditarPerfil from "./pages/EditarPerfil"
import NuevaPublicacion from "./pages/NuevaPublicacion"
import DetallePublicacion from "./pages/DetallePublicacion"
import Notificaciones from "./pages/Notificaciones"
import PanelAdmin from "./pages/PanelAdmin"
import Navbar from "./components/Navbar"

function Layout({ children }) {
  const { chatAbierto } = useLayout()
  return (
    <>
      <Navbar />
      <main
        style={chatAbierto ? {
          paddingBottom: 0,
          height: "calc(100vh - 49px)",
          display: "flex",
          flexDirection: "column",
        } : undefined}
      >
        {children}
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <LayoutProvider>
              <Routes>
                {/* Públicas */}
                <Route path="/login"    element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/recuperar" element={<RecuperarPassword />} />

                {/* Protegidas con Navbar */}
                <Route path="/feed" element={
                  <RutaProtegida><Layout><Feed /></Layout></RutaProtegida>
                }/>
                <Route path="/explorar" element={
                  <RutaProtegida><Layout><Explorar /></Layout></RutaProtegida>
                }/>
                <Route path="/mensajes" element={
                  <RutaProtegida><Layout><Mensajes /></Layout></RutaProtegida>
                }/>
                <Route path="/notificaciones" element={
                  <RutaProtegida><Layout><Notificaciones /></Layout></RutaProtegida>
                }/>
                <Route path="/perfil/:id" element={
                  <RutaProtegida><Layout><Perfil /></Layout></RutaProtegida>
                }/>
                <Route path="/perfil/editar" element={
                  <RutaProtegida><Layout><EditarPerfil /></Layout></RutaProtegida>
                }/>
                <Route path="/publicaciones/nueva" element={
                  <RutaProtegida><Layout><NuevaPublicacion /></Layout></RutaProtegida>
                }/>
                <Route path="/publicaciones/:id" element={
                  <RutaProtegida><Layout><DetallePublicacion /></Layout></RutaProtegida>
                }/>
                <Route path="/admin" element={
                  <RutaProtegida><Layout><PanelAdmin /></Layout></RutaProtegida>
                }/>

                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </LayoutProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
