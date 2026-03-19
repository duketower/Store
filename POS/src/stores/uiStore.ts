import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  toasts: Toast[]
  creditRequestCount: number
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
  setCreditRequestCount: (count: number) => void
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  creditRequestCount: 0,

  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    // Auto-remove after 4s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setCreditRequestCount: (count) => set({ creditRequestCount: count }),
}))
