import { db } from '@/db'
import type { Expense } from '@/types'
import { deleteExpenseFromFirestore, syncExpenseToFirestore } from '@/services/firebase/sync'
import { createSyncId } from '@/utils/syncIds'
import { queueOutboxEntry } from './outbox'

export interface CreateExpenseInput {
  category: string
  amount: number
  note?: string
  date: Date
}

export async function listExpensesBetween(start: Date, end: Date): Promise<Expense[]> {
  const all = await db.expenses
    .filter((expense) => {
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
      return expenseDate >= start && expenseDate <= end
    })
    .toArray()

  return all.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date)
    const dateB = b.date instanceof Date ? b.date : new Date(b.date)
    return dateB.getTime() - dateA.getTime()
  })
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const now = new Date()
  const expense: Expense = {
    syncId: createSyncId('expense'),
    category: input.category,
    amount: input.amount,
    note: input.note,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  }

  const id = await db.transaction('rw', [db.expenses, db.outbox], async () => {
    const expenseId = await db.expenses.add(expense)
    await queueOutboxEntry({
      action: 'upsert_expense',
      entityType: 'expense',
      entityKey: expense.syncId,
      payload: JSON.stringify({
        ...expense,
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      }),
      createdAt: now,
    })
    return expenseId
  })

  syncExpenseToFirestore(expense).catch((err: unknown) =>
    console.warn('[Firestore] expense sync failed (will retry):', err)
  )

  return { ...expense, id }
}

export async function deleteExpenseById(id: number): Promise<Expense | null> {
  const expense = await db.expenses.get(id)
  if (!expense) return null

  await db.transaction('rw', [db.expenses, db.outbox], async () => {
    await db.expenses.delete(id)
    await queueOutboxEntry({
      action: 'delete_expense',
      entityType: 'expense',
      entityKey: expense.syncId,
      payload: JSON.stringify({ syncId: expense.syncId }),
      createdAt: new Date(),
    })
  })

  deleteExpenseFromFirestore(expense.syncId).catch((err: unknown) =>
    console.warn('[Firestore] expense delete sync failed (will retry):', err)
  )

  return expense
}
