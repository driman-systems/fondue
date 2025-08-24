'use client'
import { create } from 'zustand'

type CaixaState = {
  isOpen: boolean
  caixaNumber: number | null
  loading: boolean
}

type CaixaActions = {
  setStatus: (s: Partial<CaixaState>) => void
  reset: () => void
}

export const useCaixaStore = create<CaixaState & CaixaActions>((set) => ({
  isOpen: false,
  caixaNumber: null,
  loading: true,
  setStatus: (s) => set((prev) => ({ ...prev, ...s })),
  reset: () => set({ isOpen: false, caixaNumber: null, loading: false }),
}))
