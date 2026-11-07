export type DashboardRange = 'today' | 'week' | 'month'
export type ProductMetric = 'revenue' | 'units'

export type DashboardProduct = {
  name: string
  units: number
  revenue: number
}

export type DashboardData = {
  sales: string
  salesDelta: string
  orders: number
  ordersDelta: number
  inventoryItems: number
  units: number
  lowStock: number
  inStock: number
  lowStockCount: number
  outOfStock: number
  stockSyncedAt: string
  tip: string
  relatedSkus: string[]
  salesOverview: { sales: number; orders: number; average: number }
  salesSeries: number[]
  topProducts: DashboardProduct[]
}

const products: DashboardProduct[] = [
  { name: 'RTX 4070 Super 12GB', units: 38, revenue: 184500 },
  { name: 'Ryzen 7 7800X3D', units: 26, revenue: 126000 },
  { name: 'Corsair Vengeance 32GB', units: 51, revenue: 71400 },
  { name: 'Samsung 990 Pro 1TB', units: 34, revenue: 52200 },
  { name: 'Tender Juicy', units: 19, revenue: 43800 },
]

const dataByRange: Record<DashboardRange, Pick<DashboardData, 'sales' | 'salesDelta' | 'orders' | 'ordersDelta' | 'salesOverview' | 'salesSeries'>> = {
  today: {
    sales: '₱18,920', salesDelta: '4.8%', orders: 28, ordersDelta: 2,
    salesOverview: { sales: 18920, orders: 28, average: 675 },
    salesSeries: [63, 50, 58, 71, 50, 85, 91],
  },
  week: {
    sales: '₱91,900', salesDelta: '12.4%', orders: 123, ordersDelta: 3,
    salesOverview: { sales: 480750, orders: 160, average: 3005 },
    salesSeries: [64, 50, 58, 71, 50, 85, 91],
  },
  month: {
    sales: '₱384,400', salesDelta: '9.7%', orders: 516, ordersDelta: 18,
    salesOverview: { sales: 384400, orders: 516, average: 3005 },
    salesSeries: [44, 52, 48, 61, 56, 66, 62],
  },
}

const commonData = {
  inventoryItems: 248,
  units: 1412,
  lowStock: 5,
  inStock: 243,
  lowStockCount: 4,
  outOfStock: 1,
  stockSyncedAt: '14:30 · Main branch',
  tip: '3 products are approaching their reorder levels. Review recent sales activity before the next replenishment cycle.',
  relatedSkus: ['RAM-CR-32D5', 'SSD-SS-990P1', 'MB-AS-B650T'],
  topProducts: products,
}

export async function getDashboardData(range: DashboardRange): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 180))
  return { ...commonData, ...dataByRange[range] }
}

export async function getDashboardSalesOverview(range: DashboardRange): Promise<Pick<DashboardData, 'salesOverview' | 'salesSeries'>> {
  await new Promise((resolve) => setTimeout(resolve, 180))
  return dataByRange[range]
}
