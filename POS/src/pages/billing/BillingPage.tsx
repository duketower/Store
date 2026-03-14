import { useState, useEffect, useCallback } from 'react'
import { ScanLine, AlertTriangle } from 'lucide-react'
import { isPrinterConnected, printReceipt } from '@/services/printer/printer'
import { groupByGstSlab } from '@/utils/gst'
import { useCartStore } from '@/stores/cartStore'
import { useUiStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { getProductByBarcode, getLowStockProducts } from '@/db/queries/products'
import { createSaleTransaction, getSaleWithItems } from '@/db/queries/sales'
import { getBatchesFEFO } from '@/db/queries/batches'
import { generateBillNumber } from '@/utils/billNumber'
import type { Product } from '@/types'
import { BarcodeInput } from './components/BarcodeInput'
import { ProductSearch } from './components/ProductSearch'
import { Cart } from './components/Cart'
import { PaymentModal, type PaymentEntry } from './components/PaymentModal'
import { Modal } from '@/components/common/Modal'
import { Receipt } from './components/Receipt'

export function BillingPage() {
  const { addItem, clearCart, totals, items } = useCartStore()
  const { addToast, setLowStockCount } = useUiStore()
  const { employeeId, name: cashierName } = useAuth()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null)
  const [receiptData, setReceiptData] = useState<Awaited<ReturnType<typeof getSaleWithItems>> | null>(null)
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false)

  const refreshLowStock = useCallback(async () => {
    const low = await getLowStockProducts()
    setLowStockCount(low.length)
  }, [setLowStockCount])

  useEffect(() => {
    refreshLowStock()
  }, [refreshLowStock])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setPaymentOpen(true) }
      if (e.key === 'F8') { e.preventDefault(); if (items.length > 0) setVoidConfirmOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [items.length])

  const addProductToCart = async (product: Product) => {
    if (!product.id) return
    if (product.stock <= 0) {
      addToast('error', `${product.name} is out of stock`)
      return
    }
    const batches = await getBatchesFEFO(product.id)
    const batchId = batches[0]?.id
    addItem({
      productId: product.id,
      batchId,
      name: product.name,
      barcode: product.barcode,
      qty: 1,
      unitPrice: product.sellingPrice,
      taxRate: product.taxRate,
      discount: 0,
      soldByWeight: product.soldByWeight,
      unit: product.unit,
    })
    addToast('success', `${product.name} added`)
  }

  const handleBarcodeScan = async (barcode: string) => {
    const product = await getProductByBarcode(barcode)
    if (!product) {
      addToast('error', `Product not found: ${barcode}`)
      return
    }
    await addProductToCart(product)
  }

  const handlePaymentComplete = async (payments: PaymentEntry[], _change: number, customerId?: number) => {
    if (!employeeId) return
    const { grandTotal, subtotal, itemDiscount, taxTotal } = totals()
    const currentItems = useCartStore.getState().items
    try {
      const billNo = await generateBillNumber()
      const saleId = await createSaleTransaction({
        billNo,
        cashierId: employeeId,
        cashierName: cashierName ?? undefined,
        customerId,
        cartItems: currentItems,
        subtotal,
        discount: itemDiscount,
        taxTotal,
        grandTotal,
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          referenceNo: p.referenceNo,
        })),
      })
      clearCart()
      setPaymentOpen(false)
      await refreshLowStock()
      const data = await getSaleWithItems(saleId)
      setReceiptData(data)
      setReceiptSaleId(saleId)
      addToast('success', `Bill ${billNo} saved`)

      // If ESC/POS thermal printer is connected, send receipt bytes directly
      if (data && isPrinterConnected()) {
        const gstSlabs = groupByGstSlab(currentItems)
        printReceipt({
          billNo,
          cashierName: cashierName ?? '',
          createdAt: new Date(),
          items: currentItems.map((i) => ({
            name: i.name,
            qty: i.qty,
            unit: i.unit,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
            lineTotal: i.lineTotal,
          })),
          subtotal,
          itemDiscount,
          taxTotal,
          grandTotal,
          payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
          gstSlabs: gstSlabs.map((s) => ({ rate: s.rate, cgst: s.cgst, sgst: s.sgst })),
        }).catch(() => {
          // Printer failed silently — window.print() is still available on the receipt modal
        })
      }
    } catch (err) {
      addToast('error', `Failed to save sale: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const { grandTotal } = totals()

  return (
    <div className="flex h-full">
      <BarcodeInput onScan={handleBarcodeScan} enabled={!paymentOpen} />

      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine size={16} className="text-blue-600 flex-shrink-0" />
            <span className="text-xs text-gray-500">Scan barcode or search below</span>
          </div>
          <ProductSearch onSelect={addProductToCart} />
        </div>
        <div className="p-4">
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
            <p><kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">F2</kbd> Open payment</p>
            <p><kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">F8</kbd> Void bill</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Current Bill
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({items.length} item{items.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          {items.length > 0 && (
            <button onClick={() => setVoidConfirmOpen(true)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <AlertTriangle size={12} /> Void
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <Cart onPay={() => setPaymentOpen(true)} />
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        grandTotal={grandTotal}
        billNo="PENDING"
        onComplete={handlePaymentComplete}
      />

      {receiptData && (
        <Modal
          open={receiptSaleId !== null}
          onClose={() => { setReceiptSaleId(null); setReceiptData(null) }}
          title="Receipt"
          size="md"
        >
          <Receipt
            sale={receiptData.sale}
            items={receiptData.items}
            payments={receiptData.payments}
            cashierName={cashierName ?? ''}
            onPrint={() => window.print()}
          />
        </Modal>
      )}

      {voidConfirmOpen && (
        <Modal open onClose={() => setVoidConfirmOpen(false)} title="Void Bill?" size="sm">
          <p className="text-sm text-gray-600 mb-4">Clear all {items.length} item(s) from the current bill? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setVoidConfirmOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => { clearCart(); setVoidConfirmOpen(false) }}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Void Bill
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
