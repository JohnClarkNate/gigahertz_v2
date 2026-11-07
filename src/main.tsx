import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Finance } from './pages/Finance'
import { AppModule, getCurrentModule } from './data/navigation'
import './styles.css'

function App() {
  const [activeModule, setActiveModule] = useState<AppModule>(getCurrentModule)
  useEffect(() => {
    const syncModule = () => setActiveModule(getCurrentModule())
    window.addEventListener('popstate', syncModule)
    return () => window.removeEventListener('popstate', syncModule)
  }, [])
  return activeModule === 'inventory' ? <Inventory /> : activeModule === 'finance' ? <Finance /> : <Dashboard />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
