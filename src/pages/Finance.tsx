import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { Activity, ArrowDown, ArrowUpDown, Box, ChevronDown, DollarSign, FileText, LayoutDashboard, LogOut, Menu, Moon, Search, ShoppingCart, Sun, Users } from 'lucide-react'
import { FinanceTransaction, FinanceTransactionType, financeMockData, getFinanceData } from '../data/finance'
import { getInitialDarkTheme, saveThemePreference } from '../data/theme'
import gigahertzLogo from '../assets/gigahertz-logo-white.png'

type TypeFilter = 'All' | FinanceTransactionType
type SortField = 'date' | 'amount'

const amountFormat = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const mainNav = [{ label: 'Dashboard', Icon: LayoutDashboard }, { label: 'Inventory', Icon: Box }]
const managementNav = [{ label: 'Users', Icon: Users }, { label: 'Finance', Icon: DollarSign }, { label: 'Sales', Icon: ShoppingCart }, { label: 'Activity Logs', Icon: Activity }]

function formatPeso(amount: number) {
  return `${amount < 0 ? '−' : '+'}₱${amountFormat.format(Math.abs(amount))}`
}

export function Finance() {
  const [data, setData] = useState(financeMockData)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [method, setMethod] = useState('All methods')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [dark, setDark] = useState(getInitialDarkTheme)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let active = true
    getFinanceData().then((next) => { if (active) setData(next) })
    return () => { active = false }
  }, [])

  const categories = useMemo(() => [...new Set(data.transactions.map((transaction) => transaction.category))].sort(), [data])
  const methods = useMemo(() => [...new Set(data.transactions.map((transaction) => transaction.method))].sort(), [data])
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return data.transactions
      .filter((transaction) => typeFilter === 'All' || transaction.type === typeFilter)
      .filter((transaction) => category === 'All categories' || transaction.category === category)
      .filter((transaction) => method === 'All methods' || transaction.method === method)
      .filter((transaction) => !normalizedQuery || `${transaction.reference} ${transaction.description} ${transaction.payee}`.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => {
        const comparison = sortField === 'date'
          ? `${left.reference.slice(3, 11)}${left.time}`.localeCompare(`${right.reference.slice(3, 11)}${right.time}`)
          : left.amount - right.amount
        return sortDirection === 'desc' ? -comparison : comparison
      })
  }, [data, typeFilter, category, method, query, sortField, sortDirection])

  const incomeTotal = data.transactions.filter((item) => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = Math.abs(data.transactions.filter((item) => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0))
  const netTotal = incomeTotal - expenseTotal
  const filteredIncome = filtered.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0)
  const filteredExpense = Math.abs(filtered.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0))

  const setType = (value: TypeFilter) => setTypeFilter(value)
  const changeSort = (field: SortField) => {
    if (sortField === field) setSortDirection((direction) => direction === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDirection('desc') }
  }
  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--theme-x', `${bounds.left + bounds.width / 2}px`)
    document.documentElement.style.setProperty('--theme-y', `${bounds.top + bounds.height / 2}px`)
    const update = () => setDark((current) => {
      const next = !current
      saveThemePreference(next)
      return next
    })
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') document.startViewTransition(update)
    else update()
  }
  const navLink = (label: string, Icon: typeof LayoutDashboard, href: string | undefined, active = false) => <a key={label} href={href ?? '#'} onClick={(event) => { if (!href || active) event.preventDefault() }} className={`nav-item ${active ? 'active' : ''}`}><Icon size={21} strokeWidth={1.5} /><span>{label}</span></a>
  const navList = (items: typeof mainNav | typeof managementNav) => items.map(({ label, Icon }) => navLink(label, Icon, label === 'Dashboard' ? '/' : label === 'Inventory' ? '/?module=inventory' : label === 'Finance' ? '/?module=finance' : undefined, label === 'Finance'))

  return <div className={`app-shell finance-screen ${dark ? '' : 'light-mode'}`}>
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><img src={gigahertzLogo} alt="Gigahertz" /></div>
      <nav className="side-nav">
        <button className="nav-item report-link"><FileText size={21} strokeWidth={1.5} /><span>Reports</span></button>
        <p className="nav-label">MAIN</p>{navList(mainNav)}
        <p className="nav-label management-label">MANAGEMENT</p>{navList(managementNav)}
      </nav>
      <div className="sidebar-bottom"><div className="account"><div className="avatar">CN</div><div><strong>Clark Nate</strong><span>Admin</span></div></div><button className="signout"><LogOut size={18} strokeWidth={1.5} /><span>Sign out</span></button></div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

    <main className="main-content">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><span className="section-title">Finance</span><span className="separator" /><span className="greeting">Good afternoon, User · Saturday, November 7, 2026</span></div>
        <div className="topbar-actions"><label className="global-search"><Search size={18} /><input aria-label="Search transactions" placeholder="Search reference, item, payee" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></label><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun size={21} /> : <Moon size={21} />}</button></div>
      </header>

      <div className="content-wrap finance-content">
        <section className="finance-page-heading">
          <div><div className="finance-title-line"><h1>Finance</h1><span className="finance-sample-badge">Sample data</span></div><p>Income, expenses and net balance for <strong>{data.period}</strong> · records as of {data.recordedAsOf}</p></div>
          <button className="finance-range" type="button" aria-label="Date range: This month">This month<ChevronDown size={15} /></button>
        </section>

        <section className="metrics-grid finance-metrics" aria-label="Finance summary">
          <article className="metric finance-metric"><div className="metric-label">Income</div><strong className="metric-value finance-income">₱{amountFormat.format(incomeTotal)}</strong><div className="metric-detail"><b className="finance-income">+229.0%</b> vs Oct 1–7</div></article>
          <article className="metric finance-metric"><div className="metric-label">Expenses</div><strong className="metric-value finance-expense">₱{amountFormat.format(expenseTotal)}</strong><div className="metric-detail"><b className="finance-change-expense">+87.9%</b> vs Oct 1–7</div></article>
          <article className="metric finance-metric"><div className="metric-label">Net balance</div><strong className={`metric-value ${netTotal >= 0 ? 'finance-income' : 'finance-expense'}`}>{netTotal < 0 ? '−' : ''}₱{amountFormat.format(Math.abs(netTotal))}</strong><div className="metric-detail"><b className="finance-income">+₱11,382.00</b> vs Oct 1–7</div></article>
          <article className="metric finance-metric"><div className="metric-label">Transactions</div><strong className="metric-value">{data.transactions.length}</strong><div className="metric-detail">{data.transactions.filter((item) => item.type === 'Income').length} in · {data.transactions.filter((item) => item.type === 'Expense').length} out</div></article>
        </section>

        <section className="panel finance-records">
          <header className="panel-heading finance-records-heading"><h2>Transaction records</h2><span>Showing {filtered.length} of {data.transactions.length}</span></header>
          <div className="finance-toolbar">
            <div className="segmented finance-tabs" role="tablist" aria-label="Transaction type">
              {(['All', 'Income', 'Expense'] as TypeFilter[]).map((item) => <button type="button" key={item} role="tab" aria-selected={typeFilter === item} className={typeFilter === item ? 'active' : ''} onClick={() => setType(item)}>
                {item === 'Income' && <i className="finance-dot income-dot" />}{item === 'Expense' && <i className="finance-dot expense-dot" />}{item === 'Expense' ? 'Expenses' : item} <small>{item === 'All' ? data.transactions.length : data.transactions.filter((transaction) => transaction.type === item).length}</small>
              </button>)}
            </div>
            <div className="finance-filters">
              <label className="finance-search"><Search size={16} /><input aria-label="Search transactions" placeholder="Search reference, item, payee" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></label>
              <label className="finance-select"><select aria-label="Filter by category" value={category} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
              <label className="finance-select"><select aria-label="Filter by payment method" value={method} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMethod(event.target.value)}><option>All methods</option>{methods.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
            </div>
          </div>

          <div className="finance-table-scroll"><table className="finance-table">
            <colgroup><col className="finance-col-date" /><col className="finance-col-ref" /><col className="finance-col-type" /><col className="finance-col-description" /><col className="finance-col-category" /><col className="finance-col-method" /><col className="finance-col-amount" /></colgroup>
            <thead><tr>
              <th><button type="button" onClick={() => changeSort('date')}>DATE {sortField === 'date' ? <ArrowDown className={sortDirection === 'asc' ? 'sort-up' : ''} size={14} /> : null}</button></th>
              <th>REFERENCE</th><th>TYPE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>METHOD</th>
              <th><button className="amount-sort" type="button" onClick={() => changeSort('amount')}><ArrowUpDown size={13} /> AMOUNT</button></th>
            </tr></thead>
            <tbody>{filtered.map((transaction) => <FinanceRow key={transaction.reference} transaction={transaction} />)}</tbody>
          </table>{filtered.length === 0 && <div className="finance-empty">No transactions match these filters.</div>}</div>

          <footer className="finance-totals"><span>Totals for {filtered.length} filtered records</span><div><span>In <b className="finance-income">{formatPeso(filteredIncome)}</b></span><span>Out <b className="finance-expense">−₱{amountFormat.format(filteredExpense)}</b></span><span>Net <b className={filteredIncome - filteredExpense >= 0 ? 'finance-income' : 'finance-expense'}>{formatPeso(filteredIncome - filteredExpense)}</b></span></div></footer>
        </section>
      </div>
    </main>
  </div>
}
function FinanceRow({ transaction }: { transaction: FinanceTransaction }) {
  return <tr>
    <td className="finance-date"><strong>{transaction.date}</strong><span>{transaction.time}</span></td>
    <td className="finance-reference">{transaction.reference}</td>
    <td><span className="finance-type"><i className={`finance-dot ${transaction.type === 'Income' ? 'income-dot' : 'expense-dot'}`} />{transaction.type}</span></td>
    <td className="finance-description"><strong>{transaction.description}</strong><span>{transaction.payee}</span></td>
    <td>{transaction.category}</td><td>{transaction.method}</td>
    <td className={`finance-amount ${transaction.amount >= 0 ? 'finance-income' : 'finance-expense'}`}>{formatPeso(transaction.amount)}</td>
  </tr>
}
