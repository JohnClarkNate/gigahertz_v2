import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).get('module') === 'inventory' ? <Inventory /> : <Dashboard />}
  </StrictMode>,
)
