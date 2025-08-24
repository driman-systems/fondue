'use client'

import { useState } from 'react'
import { usePedidoStore } from '@/hooks/usePedidoStore'
import { useCaixaStore } from '@/hooks/useCaixaStore'
import ModalCheckout from './ModalCheckout'

export default function PedidoResumo() {
  const itens = usePedidoStore(s => s.itens)
  const total = usePedidoStore(s => s.total)
  const inc = usePedidoStore(s => s.incrementar)
  const dec = usePedidoStore(s => s.decrementar)
  const rm  = usePedidoStore(s => s.remover)
  const isOpen = useCaixaStore(s => s.isOpen)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const disabledFinalizar = itens.length === 0 || !isOpen

  return (
    <div className="flex flex-col gap-3">
      {!isOpen && (
        <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/20 text-yellow-300 text-sm px-3 py-2">
          Caixa fechado — não é possível finalizar pedidos.
        </div>
      )}

      <div className="max-h-[65vh] overflow-auto pr-1">
        {itens.length === 0 && <div className="text-zinc-400 text-sm">Nenhum item na conta…</div>}
        {itens.map((it) => (
          <div key={it.key} className="flex items-center justify-between border border-zinc-800 rounded-xl p-3 mb-2">
            <div className="min-w-0">
              <div className="font-medium truncate">{it.name}</div>
              {it.variationName && <div className="text-xs text-zinc-400">{it.variationName}</div>}
              {it.toppings && it.toppings.length > 0 && (
                <div className="text-xs text-zinc-400 truncate">{it.toppings.map(t => t.name).join(', ')}</div>
              )}
              <div className="text-xs text-zinc-500">R$ {it.unitPrice.toFixed(2)} un.</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => dec(it.key)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">-</button>
              <span className="w-7 text-center">{it.quantity}</span>
              <button onClick={() => inc(it.key)} className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">+</button>
              <div className="w-24 text-right font-semibold">R$ {it.subtotal.toFixed(2)}</div>
              <button onClick={() => rm(it.key)} className="px-2 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white">x</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-zinc-800 pt-3 flex items-center justify-between">
        <div className="text-zinc-400 text-sm">Total</div>
        <div className="text-2xl font-bold">R$ {total.toFixed(2)}</div>
      </div>

      <button
        onClick={() => setCheckoutOpen(true)}
        disabled={disabledFinalizar}
        className="rounded-2xl px-4 py-3 font-semibold bg-yellow-400 text-black hover:brightness-95 disabled:opacity-50"
      >
        Finalizar
      </button>

      <ModalCheckout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  )
}
