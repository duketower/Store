import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'
import { calcGstInclusive } from '@/utils/gst'

interface CartTotals {
  subtotal: number
  itemDiscount: number
  taxTotal: number
  grandTotal: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'lineTotal'>) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  applyItemDiscount: (productId: number, discount: number) => void
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

      clearCart: () => set({ items: [] }, false, 'cart/clearCart'),

      totals: () => {
        const { items } = get()
        let subtotal = 0
        let itemDiscount = 0
        let taxTotal = 0

        for (const item of items) {
          const gross = item.unitPrice * item.qty
          subtotal += gross
          itemDiscount += item.discount
          const { taxTotal: lineTax } = calcGstInclusive(item.lineTotal, item.taxRate)
          taxTotal += lineTax
        }

        const grandTotal = subtotal - itemDiscount
        return { subtotal, itemDiscount, taxTotal, grandTotal }
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
