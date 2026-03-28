import { db } from '@/db'
import {
  deleteExpenseFromFirestore,
  syncCashEntryToFirestore,
  syncCreditLedgerEntryToFirestore,
  syncExpenseToFirestore,
  syncPerformanceTargetsToFirestore,
  syncGrnToFirestore,
  syncReturnToFirestore,
  syncSaleToFirestore,
  syncProductToFirestore,
  syncCustomerToFirestore,
  syncSessionToFirestore,
  syncVendorToFirestore,
} from '@/services/firebase/sync'
import { markOutboxFailed, markOutboxSyncing } from '@/db/queries/outbox'

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
      const data = JSON.parse(entry.payload)

      // Old-format entries (before full-payload outbox) are missing cashierId — delete them.
      // The fire-and-forget attempt at time of sale likely already synced them.
      if (!data.cashierId) {
        console.warn(`[Outbox] Dropping malformed create_sale entry id=${entry.id} (missing cashierId):`, data)
        await db.outbox.delete(entry.id!)
        continue
      }

      await syncSaleToFirestore({
        saleId: data.saleId,
        billNo: data.billNo,
        cashierId: data.cashierId,
        cashierName: data.cashierName ?? null,
        customerId: data.customerId ?? null,
        subtotal: data.subtotal,
        discount: data.discount,
        taxTotal: data.taxTotal,
        grandTotal: data.grandTotal,
        cogsTotal: data.cogsTotal ?? 0,
        grossProfitTotal: data.grossProfitTotal ?? data.grandTotal ?? 0,
        profitEstimated: data.profitEstimated ?? false,
        returnTotal: data.returnTotal ?? 0,
        creditLedgerSyncId: data.creditLedgerSyncId ?? undefined,
        payments: data.payments ?? [],
        items: data.items ?? [],
        stockDeltas: data.stockDeltas ?? [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(entry.createdAt),
      })

      await db.outbox.delete(entry.id!)
      console.log(`[Outbox] Synced and cleared: ${data.billNo}`)
    } catch (error) {
      await markOutboxFailed(entry.id, error)
    }
  }
}

export async function getPendingCount(): Promise<number> {
  return db.outbox.count()
}
