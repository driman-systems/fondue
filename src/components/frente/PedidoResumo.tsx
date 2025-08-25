'use client'

import { useState } from 'react'
import ModalCheckout from '@/components/frente/ModalCheckout'
import { usePedidoStore, type PedidoItem } from '@/hooks/usePedidoStore'

type Props = { isOpen: boolean }

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}

export default function PedidoResumo({ isOpen }: Props) {
  // 🔒 pegue tudo do store com os nomes reais
  const itens = usePedidoStore((s) => s.itens)
  const total = usePedidoStore((s) => s.total)
  const limpar = usePedidoStore((s) => s.limpar)
  const incrementar = usePedidoStore((s) => s.incrementar)
  const decrementar = usePedidoStore((s) => s.decrementar)
  const remover = usePedidoStore((s) => s.remover)

  const [checkoutOpen, setCheckoutOpen] = useState(false)

  function abrirCheckout() {
    if (!isOpen) return
    if (!itens.length) return
    setCheckoutOpen(true)
  }

  return (
    <div>
      {!isOpen && (
        <div className="mb-3 rounded-xl border border-amber-700 bg-amber-900/30 px-3 py-2 text-amber-300">
          Caixa fechado — não é possível finalizar pedidos.
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="p-4 text-sm text-zinc-400 border-b border-zinc-800">
          {itens.length ? 'Itens selecionados:' : 'Nenhum item na conta...'}
        </div>

        {itens.length > 0 && (
          <div className="max-h-[52vh] overflow-auto divide-y divide-zinc-800">
            {itens.map((it: PedidoItem) => (
              <div key={it.key} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="mr-2">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-zinc-400">
                      {it.variationName ? `Chocolate: ${it.variationName}. ` : ''}
                      {it.toppings?.length
                        ? `Acomp.: ${it.toppings.map((t) => t.name).join(', ')}`
                        : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{fmt(it.subtotal)}</div>
                    <div className="text-[11px] text-zinc-400">{fmt(it.unitPrice)} un.</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => decrementar(it.key)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
                    >
                      −
                    </button>
                    <span className="min-w-[24px] text-center">{it.quantity}</span>
                    <button
                      onClick={() => incrementar(it.key)}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remover(it.key)}
                    className="text-xs px-2 py-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-zinc-400">Total</div>
            <div className="text-lg font-semibold">{fmt(total)}</div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => limpar()}
              disabled={!itens.length}
              className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              onClick={abrirCheckout}
              disabled={!isOpen || !itens.length}
              className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95 disabled:opacity-50"
              title={!isOpen ? 'Abra um caixa para finalizar' : undefined}
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <ModalCheckout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      )}
    </div>
  )
}
