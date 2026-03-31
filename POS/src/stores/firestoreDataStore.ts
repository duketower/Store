/**
 * Firestore data store — single source of truth for all live entity state.
 * Populated by firestoreListeners.ts; read by pages/components instead of Dexie useLiveQuery.
 */
import { create } from 'zustand'
import type {
  Product,
  Batch,
  Customer,
  Employee,
  Vendor,
  Grn,
  RtvSession,
  DaySession,
  CashEntry,
  Expense,
  Sale,
  SaleReturn,
  CreditLedgerEntry,
  ExternalStaff,
  AttendanceLog,
  LeaveRequest,
  PerformanceTargets,
  SharedStoreSettings,
} from '@/types'

export interface FirestoreDataState {
  // Entity collections
  products: Product[]
  batches: Batch[]
  customers: Customer[]
  employees: Employee[]
  vendors: Vendor[]
  grns: Grn[]
  rtvs: RtvSession[]
  daySessions: DaySession[]
  cashEntries: CashEntry[]
  expenses: Expense[]
  sales: Sale[]
  saleReturns: SaleReturn[]
  creditLedger: CreditLedgerEntry[]
  staffExternal: ExternalStaff[]
  attendanceLogs: AttendanceLog[]
  leaveRequests: LeaveRequest[]
  performanceTargets: PerformanceTargets | null
  storeSettings: SharedStoreSettings | null

  // Hydration status — true once the initial snapshot for each collection has arrived
  hydrated: Set<string>

  // Setters (called by firestoreListeners)
  setProducts: (items: Product[]) => void
  upsertProduct: (item: Product) => void
  removeProduct: (id: number) => void

  setBatches: (items: Batch[]) => void
  upsertBatch: (item: Batch) => void
  removeBatch: (id: number) => void

  setCustomers: (items: Customer[]) => void
  upsertCustomer: (item: Customer) => void
  removeCustomer: (id: number) => void

  setEmployees: (items: Employee[]) => void
  upsertEmployee: (item: Employee) => void
  removeEmployee: (id: number) => void

  setVendors: (items: Vendor[]) => void
  upsertVendor: (item: Vendor) => void
  removeVendor: (id: number) => void

  setGrns: (items: Grn[]) => void
  upsertGrn: (item: Grn) => void

  setRtvs: (items: RtvSession[]) => void
  upsertRtv: (item: RtvSession) => void

  setDaySessions: (items: DaySession[]) => void
  upsertDaySession: (item: DaySession) => void

  setCashEntries: (items: CashEntry[]) => void
  upsertCashEntry: (item: CashEntry) => void

  setExpenses: (items: Expense[]) => void
  upsertExpense: (item: Expense) => void
  removeExpense: (syncId: string) => void

  setSales: (items: Sale[]) => void
  upsertSale: (item: Sale) => void

  setSaleReturns: (items: SaleReturn[]) => void
  upsertSaleReturn: (item: SaleReturn) => void

  setCreditLedger: (items: CreditLedgerEntry[]) => void
  upsertCreditEntry: (item: CreditLedgerEntry) => void

  setStaffExternal: (items: ExternalStaff[]) => void
  upsertStaffExternal: (item: ExternalStaff) => void

  setAttendanceLogs: (items: AttendanceLog[]) => void
  upsertAttendanceLog: (item: AttendanceLog) => void

  setLeaveRequests: (items: LeaveRequest[]) => void
  upsertLeaveRequest: (item: LeaveRequest) => void

  setPerformanceTargets: (targets: PerformanceTargets) => void
  setStoreSettings: (settings: SharedStoreSettings) => void

  markHydrated: (collection: string) => void
}

export const useFirestoreDataStore = create<FirestoreDataState>((set) => ({
  products: [],
  batches: [],
  customers: [],
  employees: [],
  vendors: [],
  grns: [],
  rtvs: [],
  daySessions: [],
  cashEntries: [],
  expenses: [],
  sales: [],
  saleReturns: [],
  creditLedger: [],
  staffExternal: [],
  attendanceLogs: [],
  leaveRequests: [],
  performanceTargets: null,
  storeSettings: null,
  hydrated: new Set(),

  setProducts: (items) => set({ products: items }),
  upsertProduct: (item) =>
    set((s) => ({
      products: s.products.some((p) => p.id === item.id)
        ? s.products.map((p) => (p.id === item.id ? item : p))
        : [...s.products, item],
    })),
  removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  setBatches: (items) => set({ batches: items }),
  upsertBatch: (item) =>
    set((s) => ({
      batches: s.batches.some((b) => b.id === item.id)
        ? s.batches.map((b) => (b.id === item.id ? item : b))
        : [...s.batches, item],
    })),
  removeBatch: (id) => set((s) => ({ batches: s.batches.filter((b) => b.id !== id) })),

  setCustomers: (items) => set({ customers: items }),
  upsertCustomer: (item) =>
    set((s) => ({
      customers: s.customers.some((c) => c.id === item.id)
        ? s.customers.map((c) => (c.id === item.id ? item : c))
        : [...s.customers, item],
    })),
  removeCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

  setEmployees: (items) => set({ employees: items }),
  upsertEmployee: (item) =>
    set((s) => ({
      employees: s.employees.some((e) => e.id === item.id)
        ? s.employees.map((e) => (e.id === item.id ? item : e))
        : [...s.employees, item],
    })),
  removeEmployee: (id) => set((s) => ({ employees: s.employees.filter((e) => e.id !== id) })),

  setVendors: (items) => set({ vendors: items }),
  upsertVendor: (item) =>
    set((s) => ({
      vendors: s.vendors.some((v) => v.syncId === item.syncId)
        ? s.vendors.map((v) => (v.syncId === item.syncId ? item : v))
        : [...s.vendors, item],
    })),
  removeVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),

  setGrns: (items) => set({ grns: items }),
  upsertGrn: (item) =>
    set((s) => ({
      grns: s.grns.some((g) => g.syncId === item.syncId)
        ? s.grns.map((g) => (g.syncId === item.syncId ? item : g))
        : [...s.grns, item],
    })),

  setRtvs: (items) => set({ rtvs: items }),
  upsertRtv: (item) =>
    set((s) => ({
      rtvs: s.rtvs.some((r) => r.syncId === item.syncId)
        ? s.rtvs.map((r) => (r.syncId === item.syncId ? item : r))
        : [...s.rtvs, item],
    })),

  setDaySessions: (items) => set({ daySessions: items }),
  upsertDaySession: (item) =>
    set((s) => ({
      daySessions: s.daySessions.some((d) => d.syncId === item.syncId)
        ? s.daySessions.map((d) => (d.syncId === item.syncId ? item : d))
        : [...s.daySessions, item],
    })),

  setCashEntries: (items) => set({ cashEntries: items }),
  upsertCashEntry: (item) =>
    set((s) => ({
      cashEntries: s.cashEntries.some((c) => c.syncId === item.syncId)
        ? s.cashEntries.map((c) => (c.syncId === item.syncId ? item : c))
        : [...s.cashEntries, item],
    })),

  setExpenses: (items) => set({ expenses: items }),
  upsertExpense: (item) =>
    set((s) => ({
      expenses: s.expenses.some((e) => e.syncId === item.syncId)
        ? s.expenses.map((e) => (e.syncId === item.syncId ? item : e))
        : [...s.expenses, item],
    })),
  removeExpense: (syncId) =>
    set((s) => ({ expenses: s.expenses.filter((e) => e.syncId !== syncId) })),

  setSales: (items) => set({ sales: items }),
  upsertSale: (item) =>
    set((s) => ({
      sales: s.sales.some((sale) => sale.billNo === item.billNo)
        ? s.sales.map((sale) => (sale.billNo === item.billNo ? item : sale))
        : [...s.sales, item],
    })),

  setSaleReturns: (items) => set({ saleReturns: items }),
  upsertSaleReturn: (item) =>
    set((s) => ({
      saleReturns: s.saleReturns.some((r) => r.syncId === item.syncId)
        ? s.saleReturns.map((r) => (r.syncId === item.syncId ? item : r))
        : [...s.saleReturns, item],
    })),

  setCreditLedger: (items) => set({ creditLedger: items }),
  upsertCreditEntry: (item) =>
    set((s) => ({
      creditLedger: s.creditLedger.some((c) => c.syncId === item.syncId)
        ? s.creditLedger.map((c) => (c.syncId === item.syncId ? item : c))
        : [...s.creditLedger, item],
    })),

  setStaffExternal: (items) => set({ staffExternal: items }),
  upsertStaffExternal: (item) =>
    set((s) => ({
      staffExternal: s.staffExternal.some((e) => e.syncId === item.syncId)
        ? s.staffExternal.map((e) => (e.syncId === item.syncId ? item : e))
        : [...s.staffExternal, item],
    })),

  setAttendanceLogs: (items) => set({ attendanceLogs: items }),
  upsertAttendanceLog: (item) =>
    set((s) => ({
      attendanceLogs: s.attendanceLogs.some((l) => l.syncId === item.syncId)
        ? s.attendanceLogs.map((l) => (l.syncId === item.syncId ? item : l))
        : [...s.attendanceLogs, item],
    })),

  setLeaveRequests: (items) => set({ leaveRequests: items }),
  upsertLeaveRequest: (item) =>
    set((s) => ({
      leaveRequests: s.leaveRequests.some((r) => r.syncId === item.syncId)
        ? s.leaveRequests.map((r) => (r.syncId === item.syncId ? item : r))
        : [...s.leaveRequests, item],
    })),

  setPerformanceTargets: (targets) => set({ performanceTargets: targets }),
  setStoreSettings: (settings) => set({ storeSettings: settings }),

  markHydrated: (collection) =>
    set((s) => ({ hydrated: new Set([...s.hydrated, collection]) })),
}))
