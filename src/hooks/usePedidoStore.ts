import { create } from 'zustand'

type PedidoItem = {
  productId: string
  name: string
  price: number
  quantity: number
  variation?: {
    id: string
    name: string
    price: number
  }
  toppings?: {
    id: string
    name: string
    precoExtra: number
  }[]
}

type PedidoState = {
  items: PedidoItem[]
  adicionarItem: (item: PedidoItem) => void
  removerItem: (productId: string) => void
  limparPedido: () => void
  calcularTotal: () => number
}

export const usePedidoStore = create<PedidoState>((set, get) => ({
  items: [],
  adicionarItem: (item) => {
    const existente = get().items.find(i =>
      i.productId === item.productId &&
      JSON.stringify(i.variation) === JSON.stringify(item.variation)
    )

    if (existente) {
      set({
        items: get().items.map(i =>
          i === existente ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      })
    } else {
      set({ items: [...get().items, item] })
    }
  },
  removerItem: (productId) => {
    set({ items: get().items.filter(i => i.productId !== productId) })
  },
  limparPedido: () => set({ items: [] }),
  calcularTotal: () =>
    get().items.reduce((acc, item) => {
      const variationPrice = item.variation?.price ?? 0
      const toppingsPrice = item.toppings?.reduce((sum, t) => sum + t.precoExtra, 0) ?? 0
      return acc + (item.price + variationPrice + toppingsPrice) * item.quantity
    }, 0),
}))
