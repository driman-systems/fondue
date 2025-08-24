'use client'

import { create } from 'zustand'
import { ProdutoDTO } from '@/types/product'

export type PedidoTopping = {
  id: string
  name: string
  precoExtra: number
}

export type PedidoItem = {
  key: string
  signature: string
  productId: string
  name: string
  basePrice: number
  variationId?: string
  variationName?: string
  variationPrice?: number
  toppings?: PedidoTopping[]
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
}

type State = { itens: PedidoItem[]; total: number }
type Actions = {
  adicionarItemSimples: (p: ProdutoDTO) => void
  adicionarItemComOpcoes: (
    p: ProdutoDTO,
    opts: { variation?: { id: string; name: string; price: number } | null; toppings?: PedidoTopping[] }
  ) => void
  incrementar: (key: string) => void
  decrementar: (key: string) => void
  remover: (key: string) => void
  limpar: () => void
}

function makeId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const calcTotal = (itens: PedidoItem[]) => itens.reduce((a, it) => a + it.subtotal, 0)

/** Assinatura: produto | variação | ids de toppings ordenados */
function signature(productId: string, variationId?: string, toppings?: PedidoTopping[]) {
  const tops = (toppings ?? []).map(t => t.id).sort().join(',')
  return `${productId}|${variationId ?? ''}|${tops}`
}

export const usePedidoStore = create<State & Actions>((set, get) => ({
  itens: [],
  total: 0,

  adicionarItemSimples: (p) => {
    const sig = signature(p.id)
    const itens = [...get().itens]
    const idx = itens.findIndex(it => it.signature === sig)
    if (idx >= 0) {
      itens[idx].quantity += 1
      itens[idx].subtotal = itens[idx].quantity * itens[idx].unitPrice
    } else {
      const unitPrice = p.price
      itens.push({
        key: makeId(),
        signature: sig,
        productId: p.id,
        name: p.name,
        basePrice: p.price,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
      })
    }
    set({ itens, total: calcTotal(itens) })
  },

  adicionarItemComOpcoes: (p, { variation, toppings }) => {
    const tops = (toppings ?? []).map(t => ({
      id: t.id,
      name: t.name,
      precoExtra: t.precoExtra ?? 0,
    }))
    const vPrice = variation?.price ?? 0
    const extras = tops.reduce((a, t) => a + (t.precoExtra ?? 0), 0)
    const unitPrice = p.price + vPrice + extras
    const sig = signature(p.id, variation?.id, tops)

    const itens = [...get().itens]
    const idx = itens.findIndex(it => it.signature === sig)
    if (idx >= 0) {
      itens[idx].quantity += 1
      itens[idx].subtotal = itens[idx].quantity * itens[idx].unitPrice
    } else {
      itens.push({
        key: makeId(),
        signature: sig,
        productId: p.id,
        name: p.name,
        basePrice: p.price,
        variationId: variation?.id,
        variationName: variation?.name,
        variationPrice: variation?.price,
        toppings: tops,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
      })
    }
    set({ itens, total: calcTotal(itens) })
  },

  incrementar: (key) => {
    const itens = get().itens.map(it =>
      it.key === key ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.unitPrice } : it
    )
    set({ itens, total: calcTotal(itens) })
  },

  decrementar: (key) => {
    const itens = get().itens
      .map(it => (it.key === key ? { ...it, quantity: it.quantity - 1, subtotal: (it.quantity - 1) * it.unitPrice } : it))
      .filter(it => it.quantity > 0)
    set({ itens, total: calcTotal(itens) })
  },

  remover: (key) => {
    const itens = get().itens.filter(it => it.key !== key)
    set({ itens, total: calcTotal(itens) })
  },

  limpar: () => set({ itens: [], total: 0 }),
}))
