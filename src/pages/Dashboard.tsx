import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  Activity, AlertTriangle, Box, ChevronRight, CircleHelp, Command, FileText,
  LayoutDashboard, LogOut, Menu, Moon, Package, RefreshCw, Search, ShoppingBag,
  ShoppingCart, Sun, Users, DollarSign, Lightbulb,
} from 'lucide-react'
import { DashboardData, DashboardRange, DashboardTip, ProductMetric, getDashboardData, getDashboardSalesOverview, getNextDashboardTip } from '../data/dashboard'
import { getInitialDarkTheme, saveThemePreference } from '../data/theme'
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

function RollingDigit({ digit, place }: { digit: number; place: number }) {
  const [position, setPosition] = useState(0)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPosition(digit))
    return () => window.cancelAnimationFrame(frame)
  }, [digit])
  return <span className="rolling-digit" aria-hidden="true"><span className="rolling-digit-track" style={{ transform: `translateY(-${position}em)`, transitionDelay: `${Math.min(place, 8) * 18}ms` }}>{Array.from({ length: 10 }, (_, value) => <span key={value}>{value}</span>)}</span></span>
}

function RollingNumber({ value, currencyValue = false }: { value: string | number; currencyValue?: boolean }) {
  const source = String(value)
  const numberMatch = source.match(/\d[\d,]*(?:\.\d+)?/)
  const number = numberMatch?.[0] ?? source
  const start = numberMatch?.index ?? 0
  const prefix = currencyValue ? '₱' : source.slice(0, start)
  const suffix = currencyValue ? '' : source.slice(start + number.length)
  let digitPlace = number.replace(/\D/g, '').length - 1

  return <span className="rolling-number" aria-label={`${prefix}${number}${suffix}`}>
    {prefix && <span className="rolling-fixed">{prefix}</span>}
    {Array.from(number).map((character, index) => {
      if (!/\d/.test(character)) return <span className="rolling-static" key={`static-${index}-${character}`} aria-hidden="true">{character}</span>
      const place = digitPlace--
      return <RollingDigit key={`digit-${place}`} digit={Number(character)} place={place} />
    })}
    {suffix && <span className="rolling-fixed">{suffix}</span>}
  </span>
}

function SalesChart({ values, range }: { values: number[]; range: DashboardRange }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [pointerPosition, setPointerPosition] = useState({ x: 50, y: 40 })
  const coordinates = values.map((value, index) => ({ x: values.length < 2 ? 480 : 24 + index * (912 / (values.length - 1)), y: 160 - value * 1.34 }))
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
  const areaPath = coordinates.length ? `M24,168 L${points} L936,168 Z` : ''
  const rangeLabel = range === 'today' ? 'today' : range === 'week' ? 'this week' : 'this month'
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height || !values.length) return
    const x = (event.clientX - bounds.left) / bounds.width * 960
    const nearest = coordinates.reduce((best, point, index) => Math.abs(point.x - x) < Math.abs(coordinates[best].x - x) ? index : best, 0)
    setHoverIndex(nearest)
    const edgePadding = Math.min(30, 84 / bounds.width * 100)
    setPointerPosition({
      x: Math.max(edgePadding, Math.min(100 - edgePadding, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(23, Math.min(83, (event.clientY - bounds.top) / bounds.height * 100)),
    })
  }
  return <div className="chart-area">
    <div className="chart-values" aria-hidden="true"><span>₱100K</span><span>₱75K</span><span>₱50K</span><span>₱25K</span><span>0</span></div>
    <div className="sales-chart-wrap">
      <svg className="sales-chart" viewBox="0 0 960 190" preserveAspectRatio="none" role="img" aria-label={`Sales trend for ${rangeLabel}`} onPointerMove={onPointerMove} onPointerLeave={() => setHoverIndex(null)}>
        <defs><linearGradient id="sales-area-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--blue)" stopOpacity=".2" /><stop offset="100%" stopColor="var(--blue)" stopOpacity="0" /></linearGradient></defs>
        {coordinates.length > 0 && <path d={areaPath} className="chart-area-fill" />}
        {[8, 48, 88, 128, 168].map((y) => <line key={y} x1="24" x2="936" y1={y} y2={y} className="chart-gridline" />)}
        {hoverIndex !== null && coordinates[hoverIndex] && <>
          <line x1={coordinates[hoverIndex].x} x2={coordinates[hoverIndex].x} y1="8" y2="168" className="chart-hover-guide" />
          <circle cx={coordinates[hoverIndex].x} cy={coordinates[hoverIndex].y} r="3.5" className="chart-hover-point" />
        </>}
        <polyline points={points} pathLength="1" className="chart-line" />
        <rect x="24" y="8" width="912" height="160" className="chart-hit-area" />
      </svg>
      {hoverIndex !== null && values[hoverIndex] !== undefined && <div className="chart-tooltip" style={{ left: `${pointerPosition.x}%`, top: `${pointerPosition.y}%` }}><span>Sales</span><strong>₱{currency.format(values[hoverIndex] * 1000)}</strong></div>}
    </div>
    <div className="chart-days">{chartDays.map((day) => <span key={day}>{day}</span>)}</div>
  </div>
}
function Metric({ label, value, icon: Icon, detail, loading = false, alert = false, currencyValue = false }: {
  label: string
  value: string
  icon: typeof ShoppingCart
  detail: ReactNode
  loading?: boolean
  alert?: boolean
  currencyValue?: boolean
}) {
  return <article className={`metric ${alert ? 'metric-alert' : ''}`}>
    <div className="metric-label">{label}<Icon size={17} strokeWidth={1.8} /></div>
    <strong className="metric-value">{loading ? <i className="skeleton-block metric-value-skeleton" /> : <RollingNumber value={value} currencyValue={currencyValue} />}</strong>
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
  const [advisorTip, setAdvisorTip] = useState<DashboardTip | null>(null)
  const [advisorRefreshing, setAdvisorRefreshing] = useState(false)
  const [salesPanelData, setSalesPanelData] = useState<Pick<DashboardData, 'salesOverview' | 'salesSeries'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(getInitialDarkTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [requestKey, setRequestKey] = useState(0)

  const reloadData = () => setRequestKey((key) => key + 1)

  const refreshAdvisorTip = async () => {
    if (!advisorTip || advisorRefreshing) return
    setAdvisorRefreshing(true)
    try {
      setAdvisorTip(await getNextDashboardTip(advisorTip.message))
    } finally {
      setAdvisorRefreshing(false)
    }
  }

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`)
    document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`)
    const updateTheme = () => setDark((current) => {
      const next = !current
      saveThemePreference(next)
      return next
    })
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
    Promise.all([getDashboardData('week'), minimumSkeletonTime])
      .then(([next]) => { if (current) { setData(next); setAdvisorTip({ category: 'Inventory', message: next.tip, relatedItems: next.relatedSkus }); setLoading(false) } })
      .catch(() => { if (current) { setError('Dashboard data could not be loaded.'); setLoading(false) } })
    return () => { current = false }
  }, [requestKey])

  useEffect(() => {
    let current = true
    setSalesLoading(true)
    getDashboardSalesOverview(range)
      .then((next) => { if (current) { setSalesPanelData(next); setSalesLoading(false) } })
      .catch(() => { if (current) setSalesLoading(false) })
    return () => { current = false }
  }, [range, requestKey])

  const filteredProducts = useMemo(() => data?.topProducts.filter((product) =>
    product.name.toLowerCase().includes(query.trim().toLowerCase()),
  ) ?? [], [data, query])
  const maxProductValue = Math.max(1, ...filteredProducts.map((product) => product[metric]))

  const renderNavigation = (items: typeof mainNav) => items.map(({ label, icon: Icon }) => (
    <a key={label} href={label === 'Inventory' ? '/?module=inventory' : label === 'Finance' ? '/?module=finance' : '/'} className={`nav-item ${label === 'Dashboard' ? 'active' : ''}`}>
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
          <label className="global-search"><Search size={18} /><input aria-label="Search products" placeholder="Search products, SKUs, transactions" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></label>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun size={21} /> : <Moon size={21} />}</button>
        </div>
      </header>

      <div className="content-wrap">
        <section className="metrics-grid" aria-label="Business metrics">
          <Metric label="Total Sales" value={data?.sales ?? '0'} icon={ShoppingCart} loading={loading} currencyValue detail={<><b className="trend">↗ <RollingNumber value={data?.salesDelta ?? '0%'} /></b> vs. last month</>} />
          <Metric label="Total Orders" value={data ? String(data.orders) : '0'} icon={ShoppingBag} loading={loading} detail={<><b className="trend">↗ <RollingNumber value={data?.ordersDelta ?? 0} /></b> vs. last month</>} />
          <Metric label="Inventory Items" value={data ? String(data.inventoryItems) : '0'} icon={Box} loading={loading} detail={data ? <>SKUs across <RollingNumber value={9} /> categories · <RollingNumber value={`${currency.format(data.units)} units`} /></> : 'Loading inventory summary'} />
          <Metric label="Low Stock Items" value={data ? String(data.lowStock) : '0'} icon={AlertTriangle} loading={loading} alert detail={<><b><RollingNumber value={data?.outOfStock ?? 1} /> out of stock · requires attention</b></>} />
        </section>

        {error ? <section className="error-panel"><AlertTriangle size={22} /><div><strong>{error}</strong><span>Try again to reload the dashboard.</span></div><button className="text-action" onClick={reloadData}><RefreshCw size={15} /> Retry</button></section> : <div className="dashboard-layout">
          <div className="dashboard-primary">
            <section className="panel advisor-panel">
              <div className="advisor-content">
                <div className="advisor-head"><div className="advisor-title"><Lightbulb size={18} /><strong>AI ADVISOR</strong><span className="slash">/</span><span>Quick Tip</span></div><span className="context-tag">{advisorTip?.category ?? 'Inventory'}</span></div>
                {loading ? <div className="advisor-loading"><i className="skeleton-block tip-skeleton" /><i className="skeleton-block related-skeleton" /></div> : <><p className="advisor-tip">{advisorTip?.message ?? data?.tip}</p><div className="related"><span>Related:</span>{(advisorTip?.relatedItems ?? data?.relatedSkus ?? []).map((item) => <code key={item}>{item}</code>)}</div></>}
              </div>
                <footer className="advisor-footer"><span>Based on today’s sales and stock data · 15:05</span><div><button className="text-action" onClick={refreshAdvisorTip} disabled={advisorRefreshing}><RefreshCw size={15} className={advisorRefreshing ? 'refresh-tip-spinning' : ''} /> Refresh Tip</button><button className="text-action blue-action">View Details <ChevronRight size={17} /></button></div></footer>
            </section>

            <section className="panel sales-panel">
              <PanelHeading title="Sales Overview" subtitle="Gross sales, all registers" action={<div className="segmented">{(['today', 'week', 'month'] as DashboardRange[]).map((item) => <button key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item === 'today' ? 'Today' : item === 'week' ? 'This Week' : 'This Month'}</button>)}</div>} />
              <div className="sales-totals"><div><span>Sales</span><strong>{salesLoading ? <i className="skeleton-block value-skeleton" /> : <RollingNumber value={formatPeso(salesPanelData?.salesOverview.sales ?? 0)} currencyValue />}</strong></div><div><span>Orders</span><strong>{salesLoading ? <i className="skeleton-block value-skeleton short" /> : <RollingNumber value={salesPanelData?.salesOverview.orders ?? 0} />}</strong></div><div><span>Average Sales</span><strong>{salesLoading ? <i className="skeleton-block value-skeleton" /> : <RollingNumber value={formatPeso(salesPanelData?.salesOverview.average ?? 0)} currencyValue />}</strong></div></div>
              {salesLoading ? <div className="chart-skeleton"><i /><i /><i /><i /></div> : <SalesChart key={range} values={salesPanelData?.salesSeries ?? []} range={range} />}
            </section>
          </div>

          <div className="dashboard-secondary">
            <section className="panel inventory-panel">
              <PanelHeading title="Inventory Status" subtitle={`${data ? currency.format(data.inventoryItems) : '—'} active SKUs`} />
              <div className="inventory-content">
                {loading ? <div className="skeleton-block stock-bar-skeleton" /> : <div className="stock-bar" aria-label="Inventory stock distribution"><span className="stock-low" /><span className="stock-out" /></div>}
                <div className="stock-row"><span className="status-name"><i className="status-dot in-stock" />In Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : <RollingNumber value={data?.inStock ?? 0} />}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : <RollingNumber value="98.0%" />}</span></div>
                <div className="stock-row"><span className="status-name"><i className="status-dot low-stock" />Low Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : <RollingNumber value={data?.lowStockCount ?? 0} />}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : <RollingNumber value="1.6%" />}</span></div>
                <div className="stock-row"><span className="status-name"><i className="status-dot out-stock" />Out of Stock</span><strong>{loading ? <i className="skeleton-block stock-skeleton" /> : <RollingNumber value={data?.outOfStock ?? 0} />}</strong><span className="percentage">{loading ? <i className="skeleton-block percent-skeleton" /> : <RollingNumber value="0.4%" />}</span></div>
                <p className="sync-note">Last stock count synced {data?.stockSyncedAt ?? '—'}</p>
              </div>
            </section>

            <section className="panel products-panel">
              <PanelHeading title="Top Products" subtitle="This week" action={<div className="segmented metric-toggle"><button className={metric === 'revenue' ? 'active' : ''} onClick={() => setMetric('revenue')}>Revenue</button><button className={metric === 'units' ? 'active' : ''} onClick={() => setMetric('units')}>Units</button></div>} />
              <div className="product-list">{loading ? [1, 2, 3, 4, 5].map((item) => <div className="product-row skeleton" key={item} />) : filteredProducts.length ? filteredProducts.map((product, index) => {
                const amount = product[metric]
                return <div className="product-row" key={product.name}>
                  <span className="rank">{index + 1}</span>
                  <div className="product-data"><span>{product.name}</span><div className="product-track"><i style={{ width: `${Math.max(6, (amount / maxProductValue) * 100)}%` }} /></div></div>
                  <strong className="product-value"><RollingNumber value={metric === 'revenue' ? formatPeso(amount) : `${currency.format(amount)} units`} currencyValue={metric === 'revenue'} /></strong>
                </div>
              }) : <div className="empty-state"><Search size={19} /><span>No products match “{query}”.</span><button onClick={() => setQuery('')}>Clear search</button></div>}</div>
            </section>
          </div>
        </div>}
      </div>
    </main>
  </div>
}
