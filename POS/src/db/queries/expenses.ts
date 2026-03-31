import type { Expense } from '@/types'
import { deleteExpenseFromFirestore, syncExpenseToFirestore } from '@/services/firebase/sync'
import { createSyncId } from '@/utils/syncIds'
import { useFirestoreDataStore } from '@/stores/firestoreDataStore'

export interface CreateExpenseInput {
  category: string
  amount: number
  note?: string
  date: Date
}

export async function listExpensesBetween(start: Date, end: Date): Promise<Expense[]> {
  const all = useFirestoreDataStore.getState().expenses

  return [...all]
    .filter((expense) => {
      const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date)
      return expenseDate >= start && expenseDate <= end
    })
    .sort((a, b) => {
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

  await syncExpenseToFirestore(expense)
  return expense
}

export async function deleteExpenseById(syncId: string): Promise<Expense | null> {
  const expenses = useFirestoreDataStore.getState().expenses
  const expense = expenses.find((e) => e.syncId === syncId)
  if (!expense) return null

  await deleteExpenseFromFirestore(syncId)
  return expense
}
