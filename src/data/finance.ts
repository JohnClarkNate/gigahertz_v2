export type FinanceTransactionType = 'Income' | 'Expense'

export interface FinanceTransaction {
  date: string
  time: string
  reference: string
  type: FinanceTransactionType
  description: string
  payee: string
  category: string
  method: string
  amount: number
}

export interface FinanceData {
  period: string
  recordedAsOf: string
  transactions: FinanceTransaction[]
}

export const financeMockData: FinanceData = {
  period: 'November 2026',
  recordedAsOf: 'Nov 7, 2026',
  transactions: [
    { date: 'Nov 06, 2026', time: '17:20', reference: 'PV-20261106-0148', type: 'Expense', description: 'Courier pickup – 4 parcels', payee: 'J&T Express', category: 'Shipping & courier', method: 'Cash', amount: -420 },
    { date: 'Nov 06, 2026', time: '14:07', reference: 'RC-20261106-0147', type: 'Income', description: 'Zeus K004 mechanical keyboard ×1', payee: 'Walk-in customer', category: 'POS sale', method: 'Cash', amount: 1344 },
    { date: 'Nov 06, 2026', time: '09:40', reference: 'PV-20261106-0146', type: 'Expense', description: 'Receipt paper rolls, packing tape', payee: 'Deeco Hardware', category: 'Store supplies', method: 'Cash', amount: -640 },
    { date: 'Nov 05, 2026', time: '15:44', reference: 'RC-20261105-0145', type: 'Income', description: 'MSI GeForce RTX 4060 Ventus 2X 8GB ×1', payee: 'Walk-in customer', category: 'POS sale', method: 'Card', amount: 18995 },
    { date: 'Nov 05, 2026', time: '12:25', reference: 'RC-20261105-0144', type: 'Income', description: 'PC build assembly & BIOS update', payee: 'K. Ramos', category: 'Service & repair', method: 'Cash', amount: 1500 },
    { date: 'Nov 04, 2026', time: '13:51', reference: 'RC-20261104-0143', type: 'Income', description: 'Logitech G102 mouse ×2', payee: 'Lazada order #9110431187', category: 'Online order', method: 'E-wallet', amount: 1990 },
    { date: 'Nov 03, 2026', time: '16:12', reference: 'RC-20261103-0142', type: 'Income', description: 'Custom workstation – Ryzen 5 7600 / 32GB DDR5', payee: 'Northpoint Design Studio', category: 'POS sale', method: 'Bank transfer', amount: 42300 },
    { date: 'Nov 03, 2026', time: '10:20', reference: 'PV-20261103-0141', type: 'Expense', description: 'Restock: Corsair Vengeance DDR5 32GB ×6', payee: 'PCHub Supply Co.', category: 'Supplier purchase', method: 'Bank transfer', amount: -38500 },
    { date: 'Nov 02, 2026', time: '14:38', reference: 'RC-20261102-0140', type: 'Income', description: 'Samsung 990 EVO 1TB NVMe SSD ×1', payee: 'Walk-in customer', category: 'POS sale', method: 'E-wallet', amount: 5490 },
    { date: 'Nov 02, 2026', time: '11:05', reference: 'RC-20261102-0139', type: 'Income', description: 'Attack Shark X3 wireless mouse ×1', payee: 'Walk-in customer', category: 'POS sale', method: 'Cash', amount: 1568 },
    { date: 'Nov 01, 2026', time: '09:30', reference: 'PV-20261101-0138', type: 'Expense', description: 'Store rent – November', payee: 'Gilmore Commercial Leasing', category: 'Rent', method: 'Bank transfer', amount: -45000 },
  ],
}

// Replace this mock data boundary with the Finance query when Supabase is ready.
export async function getFinanceData(): Promise<FinanceData> {
  await new Promise((resolve) => window.setTimeout(resolve, 160))
  return { ...financeMockData, transactions: financeMockData.transactions.map((transaction) => ({ ...transaction })) }
}
