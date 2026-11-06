export type InventoryTab = 'products' | 'defective'
export type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface InventoryProduct {
  name: string
  sku: string
  category: string
  quantity: number
  defective: number
  reorderLevel: number
  status: InventoryStatus
  cost: number
  price: number
  posVisible: boolean
  soldLifetime?: number
  updatedAt?: string
  brand?: string
  model?: string
  tracksUnits?: boolean
  identifierType?: string
  serialNumbers?: string[]
  specifications?: Record<string, string>
}

export type NewInventoryProduct = Pick<InventoryProduct, 'name' | 'sku' | 'category' | 'cost' | 'price' | 'reorderLevel' | 'posVisible'> & {
  brand: string
  model: string
  tracksUnits: boolean
  identifierType?: string
  serialNumbers: string[]
  specifications: Record<string, string>
  initialQuantity: number
}

export interface InventoryUnitRecord {
  serialNumber: string
  status: 'Defective' | 'Sold'
  addedAt: string
  warrantyUntil: string
}

const products: InventoryProduct[] = [
  { name: 'Toshiba P300 1TB HDD', sku: 'TSB-P300-1TB', category: 'Storage', quantity: 0, defective: 0, reorderLevel: 2, status: 'Out of Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'Kingston Fury Beast 16GB DDR5', sku: 'KNG-16-DDR5', category: 'RAM', quantity: 3, defective: 1, reorderLevel: 2, status: 'Low Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'G.Skill Ripjaws 32GB SODIMM', sku: 'GSK-32-SO-3200', category: 'RAM', quantity: 1, defective: 0, reorderLevel: 2, status: 'Low Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'ADATA 16GB DDR5 5600', sku: 'ADT-16-D5-5600', category: 'RAM', quantity: 7, defective: 1, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'Cat6 UTP Patch Cable 3m', sku: 'CBL-CAT6-3M', category: 'Accessories', quantity: 42, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'AMD Ryzen 5 7600', sku: 'AMD-R5-7600', category: 'CPU', quantity: 3, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: false },
  { name: 'ASUS Prime B650M-A II', sku: 'ASU-B650M-A2', category: 'Motherboard', quantity: 3, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: false },
  { name: 'MSI GeForce RTX 4060 Ventus 2X', sku: 'MSI-4060-V2X', category: 'GPU', quantity: 3, defective: 1, reorderLevel: 2, status: 'In Stock', cost: 17800, price: 19999, posVisible: true, soldLifetime: 1, updatedAt: 'Sep 29, 2026, 4:02 PM' },
  { name: 'Attack Shark X3 Wireless Mouse', sku: 'ATK-X3-BLK', category: 'Peripherals', quantity: 4, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: true },
  { name: 'Samsung 990 Pro 1TB NVMe', sku: 'SAM-990P-1TB', category: 'Storage', quantity: 7, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 12000, price: 12000, posVisible: false },
  { name: 'Western Digital Blue 2TB HDD', sku: 'WDB-2TB-7200', category: 'Storage', quantity: 5, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 4800, price: 5900, posVisible: true },
  { name: 'Corsair Vengeance 32GB DDR5', sku: 'COR-VEN-32D5', category: 'RAM', quantity: 2, defective: 0, reorderLevel: 2, status: 'Low Stock', cost: 5200, price: 6490, posVisible: true },
  { name: 'Cooler Master MWE 650 Bronze', sku: 'CM-MWE-650B', category: 'Power Supply', quantity: 8, defective: 0, reorderLevel: 3, status: 'In Stock', cost: 3200, price: 3990, posVisible: true },
  { name: 'DeepCool AK400 CPU Cooler', sku: 'DPC-AK400-BK', category: 'Cooling', quantity: 6, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 1450, price: 1890, posVisible: true },
  { name: 'Logitech G102 Lightsync', sku: 'LOG-G102-BLK', category: 'Peripherals', quantity: 0, defective: 0, reorderLevel: 2, status: 'Out of Stock', cost: 850, price: 1090, posVisible: false },
  { name: 'ASUS TUF Gaming A520M-Plus', sku: 'ASU-TUF-A520M', category: 'Motherboard', quantity: 4, defective: 0, reorderLevel: 2, status: 'In Stock', cost: 4200, price: 5190, posVisible: true },
]

// Replace this service with the Supabase query when the backend is ready.
export async function getInventoryProducts(tab: InventoryTab): Promise<InventoryProduct[]> {
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  return (tab === 'defective' ? products.filter((product) => product.defective > 0) : products).slice()
}

export async function addInventoryProduct(input: NewInventoryProduct): Promise<InventoryProduct> {
  await new Promise((resolve) => window.setTimeout(resolve, 180))
  if (products.some((product) => product.sku.toLowerCase() === input.sku.trim().toLowerCase())) {
    throw new Error('A product with this SKU already exists.')
  }
  const product: InventoryProduct = {
    name: input.name.trim(),
    sku: input.sku.trim(),
    category: input.category,
    quantity: input.initialQuantity,
    defective: 0,
    reorderLevel: input.reorderLevel,
    status: input.initialQuantity === 0 ? 'Out of Stock' : input.initialQuantity <= input.reorderLevel ? 'Low Stock' : 'In Stock',
    cost: input.cost,
    price: input.price,
    posVisible: input.posVisible,
    brand: input.brand.trim(),
    model: input.model.trim(),
    tracksUnits: input.tracksUnits,
    identifierType: input.identifierType,
    serialNumbers: input.serialNumbers,
    specifications: input.specifications,
  }
  products.unshift(product)
  return product
}

export function getInventoryUnitHistory(product: InventoryProduct): InventoryUnitRecord[] {
  const seed = Array.from(product.sku).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const record = (status: InventoryUnitRecord['status'], offset: number): InventoryUnitRecord => {
    if (product.sku === 'MSI-4060-V2X') {
      return status === 'Defective'
        ? { serialNumber: '602-V516-06', status, addedAt: 'Jul 9, 2026', warrantyUntil: 'Until Jul 3, 2029' }
        : { serialNumber: '602-V516-07', status, addedAt: 'Aug 11, 2026', warrantyUntil: 'Until Aug 3, 2029' }
    }
    const unit = String((seed + offset * 17) % 900 + 100).padStart(3, '0')
    const month = (seed + offset * 3) % 9 + 1
    const day = (seed + offset * 11) % 27 + 1
    const monthLabel = new Date(2026, month - 1, day).toLocaleString('en-US', { month: 'short' })
    const warrantyMonth = new Date(2029, (month + 2) % 12, day).toLocaleString('en-US', { month: 'short' })
    return {
      serialNumber: `${product.sku.slice(0, 3).toUpperCase()}-${unit}-${String(offset + 1).padStart(2, '0')}`,
      status,
      addedAt: `${monthLabel} ${day}, 2026`,
      warrantyUntil: `Until ${warrantyMonth} ${day}, 2029`,
    }
  }

  const rows: InventoryUnitRecord[] = []
  for (let index = 0; index < product.defective; index += 1) rows.push(record('Defective', index))
  if (getInventorySoldLifetime(product) > 0) rows.push(record('Sold', product.defective + 1))
  return rows
}

export function getInventorySoldLifetime(product: InventoryProduct): number {
  if (product.soldLifetime !== undefined) return product.soldLifetime
  const seed = Array.from(product.sku).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return seed % 31 + 1
}

export function getInventorySpecifications(product: InventoryProduct): Array<[string, string]> {
  const name = product.name
  if (product.category === 'GPU') return [['VRAM', '8 GB'], ['Memory Type', 'GDDR6'], ['Interface', 'PCIe 4.0 x8']]
  if (product.category === 'RAM') return [['Capacity', /\d+GB/i.exec(name)?.[0] ?? '16 GB'], ['Memory Type', /DDR\d/i.exec(name)?.[0] ?? 'DDR5'], ['Form Factor', name.includes('SODIMM') ? 'SODIMM' : 'DIMM']]
  if (product.category === 'Storage') return [['Capacity', /\d+\s?TB/i.exec(name)?.[0] ?? '1 TB'], ['Interface', name.includes('NVMe') ? 'PCIe 4.0 NVMe' : name.includes('HDD') ? 'SATA 6 Gb/s' : 'SATA'], ['Form Factor', name.includes('NVMe') ? 'M.2 2280' : '3.5 inch']]
  if (product.category === 'CPU') return [['Cores / Threads', '6 / 12'], ['Socket', 'AM5'], ['Base / Boost', '3.8 / 5.1 GHz']]
  if (product.category === 'Motherboard') return [['Form Factor', name.includes('B650M') || name.includes('A520M') ? 'Micro-ATX' : 'ATX'], ['Memory Support', 'DDR4 / DDR5'], ['Socket', name.includes('B650') ? 'AM5' : 'AM4']]
  if (product.category === 'Power Supply') return [['Power Output', '650 W'], ['Efficiency', '80 PLUS Bronze'], ['Modular', 'Non-modular']]
  if (product.category === 'Cooling') return [['Cooler Type', 'Air cooler'], ['Fan Size', '120 mm'], ['Socket Support', 'AM4 / AM5 / LGA1700']]
  if (product.category === 'Peripherals') return [['Connection', name.includes('Wireless') ? '2.4 GHz wireless' : 'USB wired'], ['Color', 'Black'], ['Warranty', '1 year']]
  return [['Product Type', product.category], ['Model', name], ['Warranty', '1 year']]
}
