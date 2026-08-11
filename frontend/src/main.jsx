import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplicar tema guardado antes del primer render (evita parpadeo)
try {
  if (localStorage.getItem('tema') === 'oscuro') {
    document.documentElement.classList.add('dark')
  }
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
