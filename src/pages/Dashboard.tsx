import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, MouseEvent, ReactNode } from 'react'
import {
  Activity, AlertTriangle, Box, ChevronRight, CircleHelp, Command, FileText,
  LayoutDashboard, LogOut, Menu, Moon, Package, RefreshCw, Search, ShoppingBag,
  ShoppingCart, Sun, Users, DollarSign, Lightbulb,
} from 'lucide-react'
import { DashboardData, DashboardRange, ProductMetric, getDashboardData } from '../data/dashboard'
import gigahertzLogo from '../assets/gigahertz-logo-white.png'

const mainNav = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Inventory', icon: Box },
]
const managementNav = [
  { label: 'Users', icon: Users },
  { label: 'Finance', icon: DollarSign },
  { label: 'Sales', icon: ShoppingCart },
  { label: 'Activity Logs', icon: Activity },
]
const currency = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 })
const chartDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatPeso(amount: number) { return `₱${currency.format(amount)}` }

function SalesChart({ values }: { values: number[] }) {
  const points = values.map((value, index) => `${24 + index * 152},${160 - value * 1.34}`).join(' ')
  return <div className="chart-area">
    <div className="chart-values" aria-hidden="true"><span>₱100K</span><span>₱75K</span><span>₱50K</span><span>₱25K</span><span>0</span></div>
    <svg className="sales-chart" viewBox="0 0 960 190" preserveAspectRatio="none" role="img" aria-label="Sales trend for the week">
      {[8, 48, 88, 128, 168].map((y) => <line key={y} x1="24" x2="936" y1={y} y2={y} className="chart-gridline" />)}
      <polyline points={points} className="chart-line" />
    </svg>
    <div className="chart-days">{chartDays.map((day) => <span key={day}>{day}</span>)}</div>
  </div>
}

function Metric({ label, value, icon: Icon, detail, loading = false, alert = false }: {
  label: string
  value: string
  icon: typeof ShoppingCart
  detail: ReactNode
  loading?: boolean
  alert?: boolean
}) {
  return <article className={`metric ${alert ? 'metric-alert' : ''}`}>
    <div className="metric-label">{label}<Icon size={17} strokeWidth={1.8} /></div>
    <strong className="metric-value">{loading ? <i className="skeleton-block metric-value-skeleton" /> : value}</strong>
    <div className="metric-detail">{loading ? <i className="skeleton-block metric-detail-skeleton" /> : detail}</div>
  </article>
}

function PanelHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <header className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header>
}

export function Dashboard() {
  const [range, setRange] = useState<DashboardRange>('week')
  const [metric, setMetric] = useState<ProductMetric>('revenue')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requestKey, setRequestKey] = useState(0)

  const reloadData = () => setRequestKey((key) => key + 1)

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`)
    document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`)
    const updateTheme = () => setDark((current) => !current)
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
      document.startViewTransition(updateTheme)
    } else {
      updateTheme()
    }
  }

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    const minimumSkeletonTime = new Promise<void>((resolve) => window.setTimeout(resolve, 700))
    Promise.all([getDashboardData(range), minimumSkeletonTime])
      .then(([next]) => { if (current) { setData(next); setLoading(false) } })
      .catch(() => { if (current) { setError('Dashboard data could not be loaded.'); setLoading(false) } })
    return () => { current = false }
  }, [range, requestKey])

  const filteredProducts = useMemo(() => data?.topProducts.filter((product) =>
    product.name.toLowerCase().includes(query.trim().toLowerCase()),
  ) ?? [], [data, query])
  const maxProductValue = Math.max(1, ...filteredProducts.map((product) => product[metric]))

  const renderNavigation = (items: typeof mainNav) => items.map(({ label, icon: Icon }) => (
    <a key={label} href={label === 'Inventory' ? '/?module=inventory' : '/'} className={`nav-item ${label === 'Dashboard' ? 'active' : ''}`}>
      <Icon size={21} strokeWidth={1.5} /><span>{label}</span>
    </a>
  ))

  return <div className={`app-shell ${dark ? '' : 'light-mode'}`}>
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><img src={gigahertzLogo} alt="Gigahertz" /></div>
      <nav className="side-nav">
        <button className="nav-item report-link"><FileText size={21} strokeWidth={1.5} /><span>Reports</span></button>
        <p className="nav-label">MAIN</p>
        {renderNavigation(mainNav)}
        <p className="nav-label management-label">MANAGEMENT</p>
        {renderNavigation(managementNav)}
      </nav>
      <div className="sidebar-bottom">
        <div className="account"><div className="avatar">CN</div><div><strong>Clark Nate</strong><span>Admin</span></div></div>
        <button className="signout"><LogOut size={18} strokeWidth={1.5} /><span>Sign out</span></button>
      </div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

    <main className="main-content">
      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <span className="section-title">Dashboard</span><span className="separator" />
          <span className="greeting">Good afternoon, User · Saturday, September 26, 2026</span>
        </div>
        <div className="topbar-actions">
          <label className="global-search"><Search size={18} /><input aria-label="Search products" placeholder="Search products, SKUs, transactions" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /><kbd><Command size={11} /> Ctrl K</kbd></label>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun size={21} /> : <Moon size={21} />}</button>
        </div>
      </header>

      <div className="content-wrap">
        <section className="metrics-grid" aria-label="Business metrics">
          <Metric label="Total Sales" value={data?.sales ?? '—'} icon={ShoppingCart} loading={loading} detail={<><b className="trend">↗ {data?.salesDelta ?? '—'}</b> vs. last month</>} />
          <Metric label="Total Orders" value={data ? String(data.orders) : '—'} icon={ShoppingBag} loading={loading} detail={<><b className="trend">↗ {data?.ordersDelta ?? '—'}</b> vs. last month</>} />
          <Metric label="Inventory Items" value={data ? String(data.inventoryItems) : '—'} icon={Box} loading={loading} detail={data ? `SKUs across 9 categories · ${currency.format(data.units)} units` : 'Loading inventory summary'} />
          <Metric label="Low Stock Items" value={data ? String(data.lowStock) : '—'} icon={AlertTriangle} loading={loading} alert detail={<><b>1 out of stock · requires attention</b></>} />
        </section>

        {error ? <section className="error-panel"><AlertTriangle size={22} /><div><strong>{error}</strong><span>Try again to reload the dashboard.</span></div><button className="text-action" onClick={reloadData}><RefreshCw size={15} /> Retry</button></section> : <div className="dashboard-layout">
          <div className="dashboard-primary">
            <section className="panel advisor-panel">
              <div className="advisor-content">
                <div className="advisor-head"><div className="advisor-title"><Lightbulb size={18} /><strong>AI ADVISOR</strong><span className="slash">/</span><span>Quick Tip</span></div><span className="context-tag">Inventory</span></div>
                {loading ? <div className="advisor-loading"><i className="skeleton-block tip-skeleton" /><i className="skeleton-block related-skeleton" /></div> : <><p className="advisor-tip">{data?.tip}</p><div className="related"><span>Related:</span>{(data?.relatedSkus ?? []).map((sku) => <code key={sku}>{sku}</code>)}</div></>}
              </div>
                <footer className="advisor-footer"><span>Based on today’s sales and stock data · 15:05</span><div><button className="text-action" onClick={reloadData}><RefreshCw size={15} /> Refresh Tip</button><button className="text-action blue-action">View Details <ChevronRight size={17} /></button></div></footer>
            </section>

            <section className="panel sales-panel">
              <PanelHeading title="Sales Overview" subtitle="Gross sales, all registers" action={<div className="segmented">{(['today', 'week', 'month'] as DashboardRange[]).map((item) => <button key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item === 'today' ? 'Today' : item === 'week' ? 'This Week' : 'This Month'}</button>)}</div>} />
              <div className="sales-totals"><div><span>Sales</span><strong>{loading ? <i className="skeleton-block value-skeleton" /> : formatPeso(data?.salesOverview.sales ?? 0)}</strong></div><div><span>Orders</span><strong>{loading ? <i className="skeleton-block value-skeleton short" /> : data?.salesOverview.orders}</strong></div><div><span>Average Sales</span><strong>{loading ? <i className="skeleton-block value-skeleton" /> : formatPeso(data?.salesOverview.average ?? 0)}</strong></div></div>
              {loading ? <div className="chart-skeleton"><i /><i /><i /><i /></div> : <SalesChart values={data?.salesSeries ?? []} />}
            </section>
          </div>

          <div className="dashboard-secondary">
            <section className="panel inventory-panel">
              <PanelHeading title="Inventory Status" subtitle={`${data ? currency.format(data.inventoryItems) : '—'} active SKUs`} />
              <div className="inventory-content">
                {loading ? <div className="skeleton-block stock-bar-skeleton" /> : <div className="stock-bar" aria-label="Inventory stock distribution"><span className="stock-low" /><span className="stock-out" /></div>}
                <div className="stock-row"><span className="status-name"><i className="status-dot in-stock" />In Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : data?.inStock}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : '98.0%'}</span></div>
                <div className="stock-row"><span className="status-name"><i className="status-dot low-stock" />Low Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : data?.lowStockCount}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : '1.6%'}</span></div>
                <div className="stock-row"><span className="status-name"><i className="status-dot out-stock" />Out of Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : data?.outOfStock}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : '0.4%'}</span></div>
                <p className="sync-note">Last stock count synced {data?.stockSyncedAt ?? '—'}</p>
              </div>
            </section>

            <section className="panel products-panel">
              <PanelHeading title="Top Products" subtitle={range === 'week' ? 'This week' : range === 'today' ? 'Today' : 'This month'} action={<div className="segmented metric-toggle"><button className={metric === 'revenue' ? 'active' : ''} onClick={() => setMetric('revenue')}>Revenue</button><button className={metric === 'units' ? 'active' : ''} onClick={() => setMetric('units')}>Units</button></div>} />
              <div className="product-list">{loading ? [1, 2, 3, 4, 5].map((item) => <div className="product-row skeleton" key={item} />) : filteredProducts.length ? filteredProducts.map((product, index) => {
                const amount = product[metric]
                return <div className="product-row" key={product.name}>
                  <span className="rank">{index + 1}</span>
                  <div className="product-data"><span>{product.name}</span><div className="product-track"><i style={{ width: `${Math.max(6, (amount / maxProductValue) * 100)}%` }} /></div></div>
                  <strong className="product-value">{metric === 'revenue' ? formatPeso(amount) : `${currency.format(amount)} units`}</strong>
                </div>
              }) : <div className="empty-state"><Search size={19} /><span>No products match “{query}”.</span><button onClick={() => setQuery('')}>Clear search</button></div>}</div>
            </section>
          </div>
        </div>}
        <footer className="page-foot"><CircleHelp size={14} /><span>Dashboard data is a demonstration snapshot.</span></footer>
      </div>
    </main>
  </div>
}
