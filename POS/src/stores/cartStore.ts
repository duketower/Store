import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'
import { calculateInclusiveTaxTotal } from '@/utils/gst'
import { roundCurrency } from '@/utils/numbers'

export interface BillDiscount {
  mode: 'percent' | 'flat'
  value: number
}

export interface HeldBill {
  id: string
  items: CartItem[]
  billDiscount: BillDiscount
  savedAt: Date
  label: string
}

export interface CartTotals {
  subtotal: number
  itemDiscount: number
  billDiscountAmount: number
  taxTotal: number
  grandTotal: number
}

interface CartState {
  items: CartItem[]
  billDiscount: BillDiscount
  heldBills: HeldBill[]
  selectedCustomerId: number | null

  addItem: (item: Omit<CartItem, 'lineTotal'>) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  applyItemDiscount: (productId: number, discount: number) => void
  setBillDiscount: (mode: BillDiscount['mode'], value: number) => void
  holdCurrentBill: () => void
  recallHeldBill: (id: string) => void
  discardHeldBill: (id: string) => void
  setSelectedCustomer: (id: number | null) => void
  clearCart: () => void
  totals: () => CartTotals
}

function calcLineTotal(item: Omit<CartItem, 'lineTotal'>): number {
  return item.unitPrice * item.qty - item.discount
}

export function calculateCartTotals(items: CartItem[], billDiscount: BillDiscount): CartTotals {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0))
  const itemDiscount = roundCurrency(items.reduce((sum, item) => sum + item.discount, 0))
  const afterItemDiscount = roundCurrency(subtotal - itemDiscount)
  const billDiscountAmount = roundCurrency(
    billDiscount.mode === 'percent'
      ? afterItemDiscount * (billDiscount.value / 100)
      : Math.min(billDiscount.value, afterItemDiscount)
  )
  const taxTotal = calculateInclusiveTaxTotal(items, billDiscountAmount)
  const grandTotal = roundCurrency(afterItemDiscount - billDiscountAmount)

  return { subtotal, itemDiscount, billDiscountAmount, taxTotal, grandTotal }
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        billDiscount: { mode: 'percent', value: 0 },
        heldBills: [],
        selectedCustomerId: null,

        addItem: (item) =>
          set(
            (state) => {
              const existing = state.items.find((i) => i.productId === item.productId)
              if (existing) {
                return {
                  items: state.items.map((i) =>
                    i.productId === item.productId
                      ? { ...i, qty: i.qty + item.qty, lineTotal: calcLineTotal({ ...i, qty: i.qty + item.qty }) }
                      : i
                  ),
                }
              }
              return { items: [...state.items, { ...item, lineTotal: calcLineTotal(item) }] }
            },
            false,
            'cart/addItem'
          ),

        removeItem: (productId) =>
          set(
            (state) => ({ items: state.items.filter((i) => i.productId !== productId) }),
            false,
            'cart/removeItem'
          ),

        updateQty: (productId, qty) =>
          set(
            (state) => ({
              items:
                qty <= 0
                  ? state.items.filter((i) => i.productId !== productId)
                  : state.items.map((i) =>
                      i.productId === productId
                        ? { ...i, qty, lineTotal: calcLineTotal({ ...i, qty }) }
                        : i
                    ),
            }),
            false,
            'cart/updateQty'
          ),

        applyItemDiscount: (productId, discount) =>
          set(
            (state) => ({
              items: state.items.map((i) =>
                i.productId === productId
                  ? { ...i, discount, lineTotal: calcLineTotal({ ...i, discount }) }
                  : i
              ),
            }),
            false,
            'cart/applyItemDiscount'
          ),

        setBillDiscount: (mode, value) =>
          set({ billDiscount: { mode, value } }, false, 'cart/setBillDiscount'),

        holdCurrentBill: () =>
          set(
            (state) => {
              if (state.items.length === 0) return state
              const first = state.items[0]
              const label =
                state.items.length === 1
                  ? first.name
                  : `${first.name} & ${state.items.length - 1} more`
              const held: HeldBill = {
                id: Date.now().toString(),
                items: state.items,
                billDiscount: state.billDiscount,
                savedAt: new Date(),
                label,
              }
              return {
                heldBills: [...state.heldBills, held],
                items: [],
                billDiscount: { mode: 'percent', value: 0 },
                selectedCustomerId: null,
              }
            },
            false,
            'cart/holdCurrentBill'
          ),

        recallHeldBill: (id) =>
          set(
            (state) => {
              const bill = state.heldBills.find((b) => b.id === id)
              if (!bill) return state
              return {
                items: bill.items,
                billDiscount: bill.billDiscount,
                heldBills: state.heldBills.filter((b) => b.id !== id),
                selectedCustomerId: null,
              }
            },
            false,
            'cart/recallHeldBill'
          ),

        discardHeldBill: (id) =>
          set(
            (state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) }),
            false,
            'cart/discardHeldBill'
          ),

        setSelectedCustomer: (id) =>
          set({ selectedCustomerId: id }, false, 'cart/setSelectedCustomer'),

        clearCart: () =>
          set(
            { items: [], billDiscount: { mode: 'percent', value: 0 }, selectedCustomerId: null },
            false,
            'cart/clearCart'
          ),

        totals: () => {
          const { items, billDiscount } = get()
          return calculateCartTotals(items, billDiscount)
        },
      }),
      {
        name: 'pos-cart',
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    { name: 'cart' }
  )
)
