/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import ModalFondue from '@/components/frente/ModalFondue'
import { usePedidoStore } from '@/hooks/usePedidoStore'

type Props = { isOpen: boolean }

type ProductDTO = {
  id: string
  name: string
  description?: string | null
  price: number
  type: 'FONDUE' | 'BEBIDA' | 'OUTRO'
  usaChocolate: boolean
  usaAcompanhamentos: boolean
  quantidadeAcompanhamentos?: number | null
  variations?: { id: string; name: string; price: number }[]
  productToppings?: { topping: { id: string; name: string; precoExtra: number } }[]
}

export default function ListaProdutos({ isOpen }: Props) {
  const [all, setAll] = useState<ProductDTO[]>([])
  const [q, setQ] = useState('')
  const [fondue, setFondue] = useState<ProductDTO | null>(null)

  // ação para adicionar itens no carrinho (usa o que existir no store)
  const addToCart =
    usePedidoStore(
      (s: any) => s.addItem || s.adicionar || s.addProduct || s.addItemSimple
    ) ?? (() => {})

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/produtos', { cache: 'no-store' })
      const data: ProductDTO[] = await r.json()

      // FONDUE primeiro
      data.sort((a, b) => {
        if (a.type === 'FONDUE' && b.type !== 'FONDUE') return -1
        if (a.type !== 'FONDUE' && b.type === 'FONDUE') return 1
        return a.name.localeCompare(b.name)
      })

      setAll(data)
    })()
  }, [])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return all
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description ?? '').toLowerCase().includes(s) ||
        String(p.price).includes(s),
    )
  }, [all, q])

  function handleClick(p: ProductDTO) {
    if (!isOpen) return
    if (p.type === 'FONDUE' && (p.usaChocolate || p.usaAcompanhamentos)) {
      setFondue(p)
      return
    }
    // produto simples
    addToCart({
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: 1,
    })
  }

  return (
    <div>
      {!isOpen && (
        <div className="mb-3 rounded-xl border border-amber-700 bg-amber-900/30 px-3 py-2 text-amber-300">
          Caixa fechado — abra o caixa para lançar produtos.
        </div>
      )}

      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => handleClick(p)}
            disabled={!isOpen}
            className={`text-left rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-4 transition ${
              !isOpen ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.type === 'FONDUE'
                    ? 'bg-purple-700/20 text-purple-300'
                    : p.type === 'BEBIDA'
                    ? 'bg-blue-700/20 text-blue-300'
                    : 'bg-zinc-700/30 text-zinc-300'
                }`}
              >
                {p.type}
              </span>
              <span className="text-sm font-semibold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(p.price)}
              </span>
            </div>
            <div className="text-base font-medium">{p.name}</div>
            {p.description ? (
              <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.description}</div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Modal para montar fondue */}
      {fondue && (
        <ModalFondue
          open={!!fondue}
          onClose={() => setFondue(null)}
          produto={fondue as any}
          onConfirm={(payload: any) => {
            // normaliza campos vindos do modal
            addToCart({
              productId: payload.productId ?? fondue.id,
              name: fondue.name,
              unitPrice: payload.unitPrice ?? fondue.price ?? 0,
              quantity: payload.quantity ?? 1,
              variationName:
                payload.variationName ?? payload.chocolate ?? null, // “Chocolate Branco/Preto”
              toppings: payload.toppings ?? [],
            })
            setFondue(null)
          }}
        />
      )}
    </div>
  )
}
