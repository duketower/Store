import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'
import { calcGstInclusive } from '@/utils/gst'

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

interface CartTotals {
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
          let subtotal = 0
          let itemDiscount = 0
          let taxTotal = 0

          for (const item of items) {
            subtotal += item.unitPrice * item.qty
            itemDiscount += item.discount
            const { taxTotal: lineTax } = calcGstInclusive(item.lineTotal, item.taxRate)
            taxTotal += lineTax
          }

          const afterItemDiscount = subtotal - itemDiscount
          const billDiscountAmount =
            billDiscount.mode === 'percent'
              ? afterItemDiscount * (billDiscount.value / 100)
              : Math.min(billDiscount.value, afterItemDiscount)

          const grandTotal = afterItemDiscount - billDiscountAmount
          return { subtotal, itemDiscount, billDiscountAmount, taxTotal, grandTotal }
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
