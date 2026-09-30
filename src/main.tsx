import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'tailwindcss/index.css'
import './fonts'
import App from './App.tsx'
import { layoutTokens } from './layout/layoutTokens'
import { initAnalytics } from './utils/analytics'

initAnalytics()

const root = document.getElementById('root')!
for (const [name, value] of Object.entries(layoutTokens)) root.style.setProperty(name, value)

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
