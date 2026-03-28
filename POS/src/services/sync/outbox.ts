import { db } from '@/db'
import {
  deleteExpenseFromFirestore,
  syncCashEntryToFirestore,
  syncCreditLedgerEntryToFirestore,
  syncExpenseToFirestore,
  syncPerformanceTargetsToFirestore,
  syncGrnToFirestore,
  syncRtvToFirestore,
  syncReturnToFirestore,
  syncSaleToFirestore,
  syncProductToFirestore,
  syncCustomerToFirestore,
  syncEmployeeToFirestore,
  syncSessionToFirestore,
  syncAttendanceLogToFirestore,
  syncExternalStaffToFirestore,
  syncLeaveRequestToFirestore,
  syncStoreSettingsToFirestore,
  syncVendorToFirestore,
  type SaleSyncPayload,
} from '@/services/firebase/sync'
import { markOutboxFailed, markOutboxSyncing } from '@/db/queries/outbox'
import { toFiniteNumber } from '@/utils/numbers'

async function rebuildLegacySalePayload(
  data: Record<string, unknown>,
  fallbackCreatedAt: Date
): Promise<SaleSyncPayload> {
  const saleId = Number(data.saleId ?? 0)
  const billNo = String(data.billNo ?? '')
  const sale =
    (saleId ? await db.sales.get(saleId) : undefined) ??
    (billNo ? await db.sales.where('billNo').equals(billNo).first() : undefined)

  if (!sale?.id) {
    throw new Error(`Legacy sale outbox entry cannot be rebuilt: sale not found (${billNo || saleId})`)
  }

  const [items, payments, ledgerEntries] = await Promise.all([
    db.sale_items.where('saleId').equals(sale.id).toArray(),
    db.payments.where('saleId').equals(sale.id).toArray(),
    db.credit_ledger.filter((entry) => entry.saleId === sale.id).toArray(),
  ])
  const products = await db.products.bulkGet(items.map((item) => item.productId))
  const productNameById = new Map<number, string>()
  for (const product of products) {
    if (product?.id) {
      productNameById.set(product.id, product.name)
    }
  }
  const creditLedgerEntry = ledgerEntries.find((entry) => entry.entryType === 'debit')

  return {
    saleId: sale.id,
    billNo: sale.billNo,
    cashierId: sale.cashierId,
    cashierName: data.cashierName ? String(data.cashierName) : null,
    customerId: sale.customerId ?? null,
    subtotal: toFiniteNumber(sale.subtotal),
    discount: toFiniteNumber(sale.discount),
    taxTotal: toFiniteNumber(sale.taxTotal),
    grandTotal: toFiniteNumber(sale.grandTotal),
    cogsTotal: toFiniteNumber(sale.cogsTotal),
    grossProfitTotal: toFiniteNumber(
      sale.grossProfitTotal,
      toFiniteNumber(sale.grandTotal) - toFiniteNumber(sale.cogsTotal)
    ),
    profitEstimated: Boolean(sale.profitEstimated ?? false),
    returnTotal: toFiniteNumber(sale.returnTotal),
    creditLedgerSyncId: creditLedgerEntry?.syncId ?? (sale.customerId ? `sale-credit-${sale.billNo}` : undefined),
    payments: payments.map((payment) => ({
      method: payment.method,
      amount: toFiniteNumber(payment.amount),
      ...(payment.referenceNo ? { referenceNo: payment.referenceNo } : {}),
    })),
    items: items.map((item, index) => ({
      lineId: `${sale.billNo}-${index + 1}`,
      productId: item.productId,
      productName: productNameById.get(item.productId) ?? `Product #${item.productId}`,
      ...(item.batchId !== undefined ? { batchId: item.batchId } : {}),
      ...(item.batchAllocations && item.batchAllocations.length > 0
        ? { batchAllocations: item.batchAllocations }
        : {}),
      qty: toFiniteNumber(item.qty),
      unitPrice: toFiniteNumber(item.unitPrice),
      discount: toFiniteNumber(item.discount),
      taxRate: toFiniteNumber(item.taxRate),
      lineTotal: toFiniteNumber(item.lineTotal),
    })),
    stockDeltas: items.map((item) => ({
      productId: item.productId,
      qty: toFiniteNumber(item.qty),
      batchAllocations:
        item.batchAllocations && item.batchAllocations.length > 0
          ? item.batchAllocations
          : item.batchId !== undefined
            ? [{ batchId: item.batchId, qty: toFiniteNumber(item.qty) }]
            : [],
    })),
    createdAt: sale.createdAt ?? fallbackCreatedAt,
  }
}

/**
 * Flush pending outbox entries to Firestore.
 * Called on app startup and whenever the browser comes back online.
 * Each entry is deleted only after a confirmed successful sync.
 * syncSaleToFirestore uses setDoc (idempotent) — safe to retry.
 */
export async function flushOutbox(): Promise<void> {
  const pending = await db.outbox.orderBy('createdAt').toArray()
  if (pending.length === 0) return

  console.log(`[Outbox] Flushing ${pending.length} pending entries…`)

  for (const entry of pending) {
    if (!entry.id) continue

    if (entry.action === 'update_product_stock' || entry.action === 'upsert_product') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncProductToFirestore({
          ...data,
          ...(data.createdAt ? { createdAt: new Date(data.createdAt) } : {}),
          ...(data.updatedAt ? { updatedAt: new Date(data.updatedAt) } : {}),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_customer') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncCustomerToFirestore({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_employee') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncEmployeeToFirestore({
          ...data,
          createdAt: new Date(data.createdAt),
          ...(data.updatedAt ? { updatedAt: new Date(data.updatedAt) } : {}),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_vendor') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncVendorToFirestore({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_external_staff') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncExternalStaffToFirestore({
          ...data,
          createdAt: new Date(data.createdAt),
          ...(data.updatedAt ? { updatedAt: new Date(data.updatedAt) } : {}),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_attendance_log') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncAttendanceLogToFirestore({
          ...data,
          ...(data.checkIn ? { checkIn: new Date(data.checkIn) } : {}),
          ...(data.checkOut ? { checkOut: new Date(data.checkOut) } : {}),
          createdAt: new Date(data.createdAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_leave_request') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncLeaveRequestToFirestore({
          ...data,
          createdAt: new Date(data.createdAt),
          ...(data.approvedAt ? { approvedAt: new Date(data.approvedAt) } : {}),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'create_grn') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncGrnToFirestore({
          grn: {
            ...data.grn,
            createdAt: new Date(data.grn.createdAt),
          },
          batches: (data.batches ?? []).map((batch: Record<string, unknown>) => ({
            ...batch,
            ...(batch.mfgDate ? { mfgDate: new Date(String(batch.mfgDate)) } : {}),
            expiryDate: new Date(String(batch.expiryDate)),
            createdAt: new Date(String(batch.createdAt)),
          })),
          productStockDeltas: data.productStockDeltas ?? [],
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'create_rtv') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncRtvToFirestore({
          rtv: {
            ...data.rtv,
            createdAt: new Date(data.rtv.createdAt),
          },
          items: data.items ?? [],
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'update_customer_balance') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncCustomerToFirestore(data)
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'set_store_settings') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncStoreSettingsToFirestore({
          config: data.config,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(entry.createdAt),
          updatedBy: data.updatedBy ?? undefined,
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_expense') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncExpenseToFirestore({
          syncId: data.syncId,
          category: data.category,
          amount: data.amount,
          note: data.note,
          date: new Date(data.date),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'delete_expense') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await deleteExpenseFromFirestore(data.syncId)
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'set_performance_targets') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncPerformanceTargetsToFirestore({
          monthlySalesTarget: data.monthlySalesTarget ?? 0,
          monthlyBreakEvenTarget: data.monthlyBreakEvenTarget ?? 0,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(entry.createdAt),
          updatedBy: data.updatedBy ?? undefined,
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_credit_ledger') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncCreditLedgerEntryToFirestore({
          syncId: data.syncId,
          customerId: data.customerId,
          saleId: data.saleId,
          entryType: data.entryType,
          amount: data.amount,
          notes: data.notes,
          createdAt: new Date(data.createdAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_cash_entry') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncCashEntryToFirestore({
          syncId: data.syncId,
          sessionId: data.sessionId,
          amount: data.amount,
          category: data.category,
          note: data.note,
          authorizedBy: data.authorizedBy,
          createdAt: new Date(data.createdAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'upsert_day_session') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncSessionToFirestore({
          id: data.id ?? 0,
          syncId: data.syncId,
          openedBy: data.openedBy,
          openingFloat: data.openingFloat,
          closingCash: data.closingCash,
          expectedCash: data.expectedCash,
          variance: data.variance,
          varianceNote: data.varianceNote,
          status: data.status,
          openedAt: new Date(data.openedAt),
          closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action === 'create_sale_return') {
      try {
        await markOutboxSyncing(entry.id)
        const data = JSON.parse(entry.payload)
        await syncReturnToFirestore({
          syncId: data.syncId,
          saleId: data.saleId,
          billNo: data.billNo,
          ...(data.customerId ? { customerId: data.customerId } : {}),
          totalRefund: data.totalRefund,
          reason: data.reason,
          userId: data.userId,
          ...(data.creditLedgerSyncId ? { creditLedgerSyncId: data.creditLedgerSyncId } : {}),
          items: data.items ?? [],
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(entry.createdAt),
        })
        await db.outbox.delete(entry.id!)
      } catch (error) {
        await markOutboxFailed(entry.id, error)
      }
      continue
    }

    if (entry.action !== 'create_sale') continue

    try {
      await markOutboxSyncing(entry.id)
      const rawData = JSON.parse(entry.payload) as Record<string, unknown>
      const salePayload = rawData.cashierId
        ? {
            saleId: Number(rawData.saleId ?? 0),
            billNo: String(rawData.billNo ?? ''),
            cashierId: Number(rawData.cashierId),
            cashierName: rawData.cashierName ? String(rawData.cashierName) : null,
            customerId:
              rawData.customerId === undefined || rawData.customerId === null
                ? null
                : Number(rawData.customerId),
            subtotal: toFiniteNumber(rawData.subtotal),
            discount: toFiniteNumber(rawData.discount),
            taxTotal: toFiniteNumber(rawData.taxTotal),
            grandTotal: toFiniteNumber(rawData.grandTotal),
            cogsTotal: toFiniteNumber(rawData.cogsTotal),
            grossProfitTotal: toFiniteNumber(rawData.grossProfitTotal, toFiniteNumber(rawData.grandTotal)),
            profitEstimated: Boolean(rawData.profitEstimated ?? false),
            returnTotal: toFiniteNumber(rawData.returnTotal),
            creditLedgerSyncId: rawData.creditLedgerSyncId ? String(rawData.creditLedgerSyncId) : undefined,
            ...(rawData.loyaltyPointsDelta !== undefined && Number(rawData.loyaltyPointsDelta) > 0
              ? { loyaltyPointsDelta: Number(rawData.loyaltyPointsDelta) }
              : {}),
            payments: Array.isArray(rawData.payments) ? rawData.payments as SaleSyncPayload['payments'] : [],
            items: Array.isArray(rawData.items) ? rawData.items as SaleSyncPayload['items'] : [],
            stockDeltas: Array.isArray(rawData.stockDeltas) ? rawData.stockDeltas as SaleSyncPayload['stockDeltas'] : [],
            createdAt: rawData.createdAt ? new Date(String(rawData.createdAt)) : new Date(entry.createdAt),
          }
        : await rebuildLegacySalePayload(rawData, new Date(entry.createdAt))

      await syncSaleToFirestore(salePayload)

      await db.outbox.delete(entry.id!)
      console.log(`[Outbox] Synced and cleared: ${salePayload.billNo}`)
    } catch (error) {
      await markOutboxFailed(entry.id, error)
    }
  }
}

export async function getPendingCount(): Promise<number> {
  return db.outbox.count()
}
