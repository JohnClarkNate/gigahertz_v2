import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react'
import { Activity, AlertTriangle, Box, ChevronLeft, ChevronRight, Command, DollarSign, EyeOff, FilePlus2, FileText, LayoutDashboard, List, LogOut, Menu, Moon, MoreHorizontal, MoreVertical, Package, Pencil, Plus, Search, SlidersHorizontal, Sun, Trash2, Users, ShoppingCart, X } from 'lucide-react'
import { deleteInventoryProduct, getInventoryProducts, getInventorySoldLifetime, getInventorySpecifications, getInventoryUnitHistory, InventoryProduct, InventoryTab, markInventoryProductDefective, setInventoryProductVisibility } from '../data/inventory'
import { AddInventoryProductWizard } from '../components/AddInventoryProductWizard'
import { EditInventoryProductWizard } from '../components/EditInventoryProductWizard'
import { SegmentedControl } from '../components/SegmentedControl'
import { navigateToModule } from '../data/navigation'
import { getInitialDarkTheme, saveThemePreference } from '../data/theme'
import logo from '../assets/inventory-logo.png'
import gigahertzLogoBlue from '../assets/gigahertz-logo-blue.png'
import avatar from '../assets/inventory-avatar.svg'
import selectedNav from '../assets/inventory-selected-nav.svg'
import separators from '../assets/inventory-separators.svg'
import kpiDividers from '../assets/inventory-sidebar-divider.svg'
import visibleDot from '../assets/inventory-pos-visible.svg'
import hiddenDot from '../assets/inventory-pos-hidden.svg'
import inStockDot from '../assets/inventory-in-stock.svg'
import lowStockDot from '../assets/inventory-low-stock.svg'
import outStockDot from '../assets/inventory-out-of-stock.svg'
import sidebarLine from '../assets/inventory-sidebar-line.svg'
import navbarLine from '../assets/inventory-navbar-divider.svg'

const peso = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 })
const navMain = [{ label: 'Dashboard', Icon: LayoutDashboard, href: '/' }, { label: 'Inventory', Icon: Box, href: '/?module=inventory' }]
const navManagement = [{ label: 'Users', Icon: Users }, { label: 'Finance', Icon: DollarSign }, { label: 'Sales', Icon: ShoppingCart }, { label: 'Activity Logs', Icon: Activity }]

function RollingSummaryValue({ value }: { value: string }) {
  let place = value.replace(/\D/g, '').length - 1
  return <span className="rolling-number" aria-label={value}>{Array.from(value).map((character, index) => {
    if (!/\d/.test(character)) return <span className="rolling-static" key={`static-${index}-${character}`} aria-hidden="true">{character}</span>
    const digitPlace = place--
    return <RollingSummaryDigit key={`digit-${digitPlace}`} digit={Number(character)} place={digitPlace} />
  })}</span>
}

function RollingSummaryDigit({ digit, place }: { digit: number; place: number }) {
  const [position, setPosition] = useState(0)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPosition(digit))
    return () => window.cancelAnimationFrame(frame)
  }, [digit])
  return <span className="rolling-digit" aria-hidden="true"><span className="rolling-digit-track" style={{ transform: `translateY(-${position}em)`, transitionDelay: `${Math.min(place, 8) * 18}ms` }}>{Array.from({ length: 10 }, (_, value) => <span key={value}>{value}</span>)}</span></span>
}

export function Inventory() {
  const [dark, setDark] = useState(getInitialDarkTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState<InventoryTab>('products')
  const [query, setQuery] = useState('')
  const [data, setData] = useState<InventoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [page, setPage] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null)
  const [selectedProductTab, setSelectedProductTab] = useState<'overview' | 'units'>('overview')
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
  const [addProductOpen, setAddProductOpen] = useState(false)

  useEffect(() => {
    let live = true
    setLoading(true); setError(false)
    getInventoryProducts(tab).then((result) => { if (live) { setData(result); setLoading(false) } }).catch(() => { if (live) { setError(true); setLoading(false) } })
    return () => { live = false }
  }, [tab, reload])

  const filtered = useMemo(() => data.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())), [data, query])
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleProducts = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const openProductDetails = (product: InventoryProduct, initialTab: 'overview' | 'units' = 'overview') => {
    setSelectedProduct(product)
    setSelectedProductTab(initialTab)
  }
  const handleRowAction = (action: InventoryRowAction, product: InventoryProduct) => {
    if (action === 'edit') {
      setEditingProduct(product)
      return
    }
    if (action === 'visibility') {
      const updated = setInventoryProductVisibility(product.sku, !product.posVisible)
      if (updated) setData((current) => current.map((item) => item.sku === updated.sku ? updated : item))
      return
    }
    if (action === 'defective') {
      const updated = markInventoryProductDefective(product.sku)
      if (updated) setData((current) => current.map((item) => item.sku === updated.sku ? updated : item))
      return
    }
    if (action === 'units') {
      openProductDetails(product, 'units')
      return
    }
    if (window.confirm(`Delete ${product.name}? This action cannot be undone.`)) {
      deleteInventoryProduct(product.sku)
      setData((current) => current.filter((item) => item.sku !== product.sku))
      setSelectedProduct((current) => current?.sku === product.sku ? null : current)
    }
  }
  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--theme-x', `${bounds.left + bounds.width / 2}px`)
    document.documentElement.style.setProperty('--theme-y', `${bounds.top + bounds.height / 2}px`)
    const update = () => setDark((value) => {
      const next = !value
      saveThemePreference(next)
      return next
    })
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') document.startViewTransition(update)
    else update()
  }

  const navButton = (item: typeof navMain[number]) => <a key={item.label} className={`nav-item ${item.label === 'Inventory' ? 'active' : ''}`} href={item.href} onClick={(event) => { event.preventDefault(); navigateToModule(item.label === 'Inventory' ? 'inventory' : 'dashboard') }}><item.Icon size={21} strokeWidth={1.5} /><span>{item.label}</span>{item.label === 'Inventory' && <img className="inv-selected-nav" src={selectedNav} alt="" />}</a>
  return <div className={`app-shell inventory-screen ${dark ? '' : 'light-mode'}`}>
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><img src={dark ? logo : gigahertzLogoBlue} alt="Gigahertz" /></div>
      <img className="inv-sidebar-rule" src={sidebarLine} alt="" />
      <nav className="side-nav">
        <button className="nav-item report-link"><FileText size={21} strokeWidth={1.5} /><span>Reports</span></button>
        <p className="nav-label">MAIN</p>{navMain.map(navButton)}
        <p className="nav-label management-label">MANAGEMENT</p>{navManagement.map(({ label, Icon }) => { const href = label === 'Finance' ? '/?module=finance' : undefined; return <a className="nav-item" key={label} href={href ?? '#'} onClick={(event) => { event.preventDefault(); if (label === 'Finance') navigateToModule('finance') }}><Icon size={21} strokeWidth={1.5} /><span>{label}</span></a> })}
      </nav>
      <div className="sidebar-bottom"><div className="account"><img src={avatar} alt="" /><div><strong>Clark Nate</strong><span>Admin</span></div></div><button className="signout"><LogOut size={18} strokeWidth={1.5} /><span>Sign out</span></button></div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><span className="section-title">Inventory</span><img className="inv-navbar-rule" src={navbarLine} alt="" /><span className="greeting">Good afternoon, User · Saturday, September 26, 2026</span></div><div className="topbar-actions"><label className="global-search"><Search size={18} /><input placeholder="Search products, SKUs, transactions" aria-label="Search products" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></label><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun size={21} /> : <Moon size={21} />}</button></div></header>
      <div className="content-wrap inv-content">
        <section className="inv-summary" aria-label="Inventory summary">
          {[['Products', '12', 'Total product types'], ['Units on Hand', '78', 'Across all products'], ['Low Stock', '3', 'Products need reorder'], ['Out of Stock', '78', 'Products unavailable'], ['Defective Units', '3', 'Across 3 products']].map(([label, value, note], i) => <article className={`inv-kpi inv-kpi-${i}`} key={label}><span>{label}</span><strong><RollingSummaryValue value={value} /></strong><small>{note}</small>{i > 0 && <img className="inv-kpi-divider" src={kpiDividers} alt="" />}</article>)}
        </section>
        <SegmentedControl className="inv-tabs" role="tablist"><button className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setPage(0) }} role="tab" aria-selected={tab === 'products'}><Package size={15} />Products</button><button className={tab === 'defective' ? 'active' : ''} onClick={() => { setTab('defective'); setPage(0) }} role="tab" aria-selected={tab === 'defective'}>Defective Units <span>3</span></button></SegmentedControl>
        <section className="panel inv-table-panel">
          <div className="inv-toolbar"><label className="inv-search"><Search size={15} /><input placeholder="Search name, SKU, brand, model, or serial number" aria-label="Search inventory" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></label><button className="inv-filter"><SlidersHorizontal size={15} />Filter</button><div className="inv-toolbar-spacer"/><button className="inv-secondary"><FilePlus2 size={15} />Import CSV</button><button className="inv-primary" type="button" onClick={() => setAddProductOpen(true)}><Plus size={16} />Add Product</button></div>
          <div className="inv-table-scroll"><div className="inv-table">
            <div className="inv-table-head"><span>Product</span><span>SKU</span><span>Category</span><span>Quantity</span><span>Reorder Level</span><span>Status</span><span>Cost Price</span><span>Selling Price</span><span>POS</span><span/></div>
            <img className="inv-row-separators" src={separators} alt="" />
            {loading ? <div className="inv-loading-rows" aria-label="Loading inventory">{Array.from({ length: 10 }, (_, i) => <div className="inv-row inv-skeleton-row" key={i}>{Array.from({ length: 10 }, (_, j) => <i key={j} className="skeleton-block" />)}</div>)}</div> : error ? <div className="inv-state"><strong>Inventory could not be loaded.</strong><button onClick={() => setReload((key) => key + 1)}>Try again</button></div> : filtered.length === 0 ? <div className="inv-state">No products match your search.</div> : visibleProducts.map((item) => <InventoryRow key={item.sku} item={item} onSelect={() => openProductDetails(item)} onAction={(action) => handleRowAction(action, item)} />)}
          </div></div>
          <footer className="inv-pagination"><span>Showing {filtered.length ? currentPage * pageSize + 1 : 0}-{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length} {tab === 'products' ? 'products' : 'defective products'}</span><div><button disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={14} />Previous</button>{Array.from({ length: pageCount }, (_, i) => <button key={i} className={currentPage === i ? 'page-active' : ''} aria-current={currentPage === i ? 'page' : undefined} onClick={() => setPage(i)}>{i + 1}</button>)}<button disabled={currentPage >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>Next<ChevronRight size={14} /></button></div></footer>
        </section>
      </div>
    </main>
    {selectedProduct && <InventoryDetailsDrawer key={`${selectedProduct.sku}-${selectedProductTab}`} product={selectedProduct} initialTab={selectedProductTab} onClose={() => setSelectedProduct(null)} onEdit={() => { setSelectedProduct(null); setEditingProduct(selectedProduct) }} />}
    {editingProduct && <EditInventoryProductWizard product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={(updated) => {
      setData((current) => current.map((item) => item.sku === updated.sku ? updated : item))
      setSelectedProduct((current) => current?.sku === updated.sku ? updated : current)
      setEditingProduct(null)
    }} />}
    {addProductOpen && <AddInventoryProductWizard onClose={() => setAddProductOpen(false)} onSaved={() => {
      setAddProductOpen(false)
      setTab('products')
      setPage(0)
      setQuery('')
      setReload((key) => key + 1)
    }} />}
  </div>
}

type InventoryRowAction = 'edit' | 'visibility' | 'defective' | 'units' | 'delete'

function InventoryRow({ item, onSelect, onAction }: { item: InventoryProduct; onSelect: () => void; onAction: (action: InventoryRowAction) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const statusIcon = item.status === 'Out of Stock' ? outStockDot : item.status === 'Low Stock' ? lowStockDot : inStockDot
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect() } }

  useEffect(() => {
    if (!menuOpen) return
    const closeOutside = (event: globalThis.MouseEvent) => { if (!rowRef.current?.contains(event.target as Node)) setMenuOpen(false) }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeOnEscape) }
  }, [menuOpen])

  const runAction = (action: InventoryRowAction) => { setMenuOpen(false); onAction(action) }
  return <div ref={rowRef} className={`inv-row inv-product-row ${menuOpen ? 'menu-open' : ''}`} role="button" tabIndex={0} onClick={onSelect} onKeyDown={onKeyDown} aria-label={`View details for ${item.name}`}>
    <span className="inv-product-name">{item.name}</span><span className="inv-mono">{item.sku}</span><span>{item.category}</span>
    <span className="inv-quantity">{item.status !== 'In Stock' && <AlertTriangle className={`inv-quantity-warning ${item.status === 'Out of Stock' ? 'critical' : ''}`} size={14} strokeWidth={2.2} />}<span><strong>{item.quantity}</strong> units{item.defective > 0 && <small className="inv-defective">{item.defective} defective</small>}</span></span>
    <span>{item.reorderLevel}</span><span className={`inv-status ${item.status.toLowerCase().replace(/ /g, '-')}`}><img src={statusIcon} alt="" />{item.status}</span>
    <span>₱{peso.format(item.cost)}</span><span>₱{peso.format(item.price)}</span><span className="inv-pos"><img src={item.posVisible ? visibleDot : hiddenDot} alt="" />{item.posVisible ? 'Visible' : 'Hidden'}</span>
    <button className="inv-row-menu" aria-label={`More actions for ${item.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open) }}><MoreVertical size={17} /></button>
    {menuOpen && <div className="inv-action-menu" role="menu" onClick={(event) => event.stopPropagation()}>
      <button role="menuitem" onClick={() => runAction('edit')}><Pencil size={14} />Edit Product</button>
      <button role="menuitem" onClick={() => runAction('visibility')}><EyeOff size={14} />{item.posVisible ? 'Hide from POS' : 'Show on POS'}</button>
      <button role="menuitem" disabled={item.quantity < 1} onClick={() => runAction('defective')}><AlertTriangle size={14} />Mark as Defective</button>
      <button role="menuitem" onClick={() => runAction('units')}><List size={14} />Manage units</button>
      <div className="inv-action-menu-separator" />
      <button className="danger" role="menuitem" onClick={() => runAction('delete')}><Trash2 size={14} />Delete Product</button>
    </div>}
  </div>
}
function InventoryDetailsDrawer({ product, initialTab = 'overview', onClose, onEdit }: { product: InventoryProduct; initialTab?: 'overview' | 'units'; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState<'overview' | 'units'>(initialTab)
  const [unitQuery, setUnitQuery] = useState('')
  const history = useMemo(() => getInventoryUnitHistory(product), [product])
  const shownHistory = history.filter((unit) => `${unit.serialNumber} ${unit.status}`.toLowerCase().includes(unitQuery.trim().toLowerCase()))
  const sold = getInventorySoldLifetime(product)
  const brand = product.name.split(' ')[0]
  const model = product.sku === 'MSI-4060-V2X' ? 'RTX 4060 VENTUS 2X 8G' : product.name.slice(brand.length).trim() + (product.category === 'GPU' ? ' 8G' : '')
  const specifications = getInventorySpecifications(product)
  const updated = product.updatedAt ?? 'Sep 29, 2026, 4:02 PM'
  const margin = product.price ? ((product.price - product.cost) / product.price * 100).toFixed(1) : '0.0'

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return <>
    <button className="inv-drawer-backdrop" aria-label="Close product details" onClick={onClose} />
    <aside className="inv-details-drawer" role="dialog" aria-modal="true" aria-label={`${product.name} details`}>
      <header className="inv-drawer-header">
        <button className="inv-drawer-close" aria-label="Close details" onClick={onClose}><X size={17} /></button>
        <span className="inv-drawer-sku">{product.sku}</span>
        <h2>{product.name}</h2>
        <div className="inv-drawer-status-line"><span className={`inv-drawer-status ${product.status.toLowerCase().replace(/ /g, '-')}`}><i />{product.status}</span><span>Last updated · {updated}</span></div>
        <div className="inv-drawer-actions"><button onClick={onEdit}><Pencil size={13} />Edit</button><button><EyeOff size={13} />{product.posVisible ? 'Hide from POS' : 'Show on POS'}</button></div>
      </header>
      <section className="inv-drawer-stats" aria-label="Unit counts"><div><span>On Hand</span><strong>{product.quantity + product.defective}</strong></div><div><span>Available</span><strong>{product.quantity}</strong></div><div><span>Defective</span><strong>{product.defective}</strong></div><div><span>Sold (lifetime)</span><strong>{sold}</strong></div></section>
      <div className="inv-drawer-content">
        <SegmentedControl className="inv-drawer-tabs" role="tablist"><button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button><button role="tab" aria-selected={tab === 'units'} className={tab === 'units' ? 'active' : ''} onClick={() => setTab('units')}>Manage Units · {history.length}</button></SegmentedControl>
        {tab === 'overview' ? <div className="inv-overview">
          <section className="inv-detail-section"><h3>Product Information</h3><DetailLine label="Brand" value={brand} /><DetailLine label="Model" value={model} /><DetailLine label="Category" value={product.category} /><DetailLine label="Identifier" value="Serial Number" /></section>
          <section className="inv-detail-section"><h3>Pricing</h3><DetailLine label="Cost" value={`₱${peso.format(product.cost)}.00`} /><DetailLine label="Selling Price" value={`₱${peso.format(product.price)}.00`} /><DetailLine label="Margin" value={`${margin}%`} /></section>
          <section className="inv-detail-section"><h3>Inventory</h3><DetailLine label="Reorder Level" value={`${product.reorderLevel} units`} /><DetailLine label="POS Visibility" value={<span className="inv-detail-visibility"><i className={product.posVisible ? 'visible' : 'hidden'} />{product.posVisible ? 'Visible' : 'Hidden'}</span>} /></section>
          <section className="inv-detail-section"><h3>Specifications · {product.category}</h3>{specifications.map(([label, value]) => <DetailLine key={label} label={label} value={value} />)}</section>
        </div> : <div className="inv-managed-units">
          <p>Each row is one physical unit. Select an item to restore a defective unit, or review its history.</p>
          <section className="inv-units-table"><label className="inv-units-search"><Search size={15} /><input placeholder="Search serial number" aria-label="Search unit serial number" value={unitQuery} onChange={(event: ChangeEvent<HTMLInputElement>) => setUnitQuery(event.target.value)} /></label><div className="inv-units-head"><span>Identifier</span><span>Status</span><span>Added</span><span>Warranty</span><span /></div>{shownHistory.length ? shownHistory.map((unit) => <div className="inv-unit-row" key={unit.serialNumber}><span><strong>{unit.serialNumber}</strong><small>Serial Number</small></span><span><em className={`inv-unit-status ${unit.status.toLowerCase()}`}><i />{unit.status}</em></span><span>{unit.addedAt}</span><span>{unit.warrantyUntil}</span><button aria-label={`More actions for ${unit.serialNumber}`}><MoreHorizontal size={18} /></button></div>) : <div className="inv-units-empty">No managed units match this search.</div>}</section>
        </div>}
      </div>
    </aside>
  </>
}

function DetailLine({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="inv-detail-line"><span>{label}</span><strong>{value}</strong></div>
}
