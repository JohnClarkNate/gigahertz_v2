import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Finance } from './pages/Finance'
import './styles.css'

const activeModule = new URLSearchParams(window.location.search).get('module')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {activeModule === 'inventory' ? <Inventory /> : activeModule === 'finance' ? <Finance /> : <Dashboard />}
  </StrictMode>,
)
