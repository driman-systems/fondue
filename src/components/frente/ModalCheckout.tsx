/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePedidoStore } from '@/hooks/usePedidoStore'

type PayMethod = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'

type Payment = {
  id: string
  method: PayMethod
  value: number
}

function parseBRL(input: string): number {
  if (!input) return 0
  const s = input.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}
function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}
function uid() {
  return Math.random().toString(36).slice(2)
}

export default function ModalCheckout({
  open,
  onClose,
}: {
  open: boolean
  onClose: (opts?: { printed?: boolean }) => void
}) {
  const itens = usePedidoStore((s) => s.itens)
  const limpar = usePedidoStore((s) => s.limpar)

  const subtotal = useMemo(
    () => itens.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0),
    [itens]
  )

  // desconto
  const [discountType, setDiscountType] = useState<'valor' | 'percent'>('valor')
  const [discountStr, setDiscountStr] = useState<string>('0')
  const discountValue = useMemo(() => {
    const v = parseBRL(discountStr)
    if (discountType === 'valor') return Math.min(v, subtotal)
    const pct = Math.max(0, Math.min(v, 100))
    return Math.min(subtotal * (pct / 100), subtotal)
  }, [discountStr, discountType, subtotal])

  const finalTotal = Math.max(0, subtotal - discountValue)

  // pagamentos já lançados
  const [payments, setPayments] = useState<Payment[]>([])
  const paid = useMemo(() => payments.reduce((a, p) => a + p.value, 0), [payments])
  const remaining = Math.max(0, finalTotal - paid)

  // input do valor a lançar (fica SEMPRE com o restante e selecionado)
  const [launchStr, setLaunchStr] = useState<string>('0,00')
  const launchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // sempre que total/remaining mudar, atualiza input com o restante
    const v = remaining.toFixed(2).replace('.', ',')
    setLaunchStr(v)
    // seleciona o texto quando o modal está aberto
    if (open && launchRef.current) {
      setTimeout(() => {
        launchRef.current?.focus()
        launchRef.current?.select()
      }, 0)
    }
  }, [remaining, finalTotal, open])

  function addPayment(method: PayMethod) {
    if (remaining <= 0.009) return
    let value = parseBRL(launchStr)
    if (value <= 0) value = remaining
    value = Math.min(value, remaining)

    setPayments((prev) => [...prev, { id: uid(), method, value }])
    // launchStr será atualizado pelo useEffect (com o novo remaining)
  }

  function removePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  const payloadPayments = payments.map((p) => ({
    method: p.method,
    value: p.value,
  }))

  async function finalize() {
    if (itens.length === 0) return
    if (remaining > 0.01) {
      alert('Ainda falta pagar o restante.')
      return
    }
    const payload = {
      items: itens.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        variationName: it.variationName ?? null,
        toppings: it.toppings?.map((t) => t.name) ?? [],
      })),
      discount:
        discountValue > 0
          ? {
              type: discountType,
              value:
                discountType === 'valor'
                  ? parseBRL(discountStr)
                  : Math.max(0, Math.min(parseBRL(discountStr), 100)),
            }
          : null,
      payments: payloadPayments,
      notes: null,
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error ?? 'Falha no checkout')
      }
      limpar()
      alert('Pedido finalizado com sucesso!')
      onClose({ printed: false })
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Não foi possível finalizar.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={() => onClose()} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="text-lg font-semibold mb-1">Checkout</div>
        <div className="text-sm text-zinc-400 mb-4">
          Revise os valores, aplique desconto e informe os pagamentos.
        </div>

        {/* Totais / Desconto / Valor a lançar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">Subtotal</div>
            <div className="text-xl font-semibold">{fmt(subtotal)}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400 mb-1">Desconto</div>

            <div className="grid grid-cols-2 gap-2 items-start">
                <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm"
                title="Tipo do desconto"
                >
                <option value="valor">R$</option>
                <option value="percent">% </option>
                </select>

                <div className="min-w-0">
                <input
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    placeholder={discountType === 'valor' ? '0,00' : '0'}
                    className="h-10 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm"
                />
                <div className="mt-1 text-[10px] leading-none text-right text-zinc-400/40">
                    {discountValue > 0 ? `(-) ${fmt(discountValue)}` : '(-) R$ 0,00'}
                </div>
                </div>
            </div>
            </div>

          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400 mb-1">Total (valor a lançar)</div>
            <input
              ref={launchRef}
              value={launchStr}
              onChange={(e) => setLaunchStr(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-lg font-semibold"
              title="Valor que será lançado ao clicar numa forma de pagamento"
            />
          </div>
        </div>

        {/* Botões das formas de pagamento */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-medium mr-2">Formas de pagamento</span>
          <button
            type="button"
            onClick={() => addPayment('DINHEIRO')}
            className="rounded-lg px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            Dinheiro
          </button>
          <button
            type="button"
            onClick={() => addPayment('PIX')}
            className="rounded-lg px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            PIX
          </button>
          <button
            type="button"
            onClick={() => addPayment('CREDITO')}
            className="rounded-lg px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            Crédito
          </button>
          <button
            type="button"
            onClick={() => addPayment('DEBITO')}
            className="rounded-lg px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            Débito
          </button>
        </div>

        {/* Lista de pagamentos registrados */}
        <div className="space-y-2 mb-4">
          {payments.length === 0 ? (
            <div className="text-sm text-zinc-500">Nenhum pagamento lançado ainda.</div>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-zinc-800 rounded-xl p-3"
              >
                <div className="text-sm">
                  <span className="text-zinc-300 mr-2">{p.method}</span>
                  <span className="font-semibold">{fmt(p.value)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePayment(p.id)}
                  className="px-2 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs"
                  title="Remover"
                >
                  remover
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pago / Falta pagar */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-zinc-400">Pago</div>
          <div className="text-lg font-semibold">{fmt(paid)}</div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-sm ${remaining > 0.009 ? 'text-yellow-400' : 'text-green-400'}`}>
            {remaining > 0.009 ? 'Falta pagar' : 'Quitado'}
          </div>
          <div className={`text-lg font-semibold ${remaining > 0.009 ? '' : 'opacity-60'}`}>
            {fmt(remaining)}
          </div>
        </div>

        {/* Observação (mantido para próxima etapa também) */}
        {/* <div className="mb-4">
          <label className="text-sm text-zinc-300 mb-1 block">Observação do pedido</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
            placeholder="Ex.: Sem gelo na bebida, entregar na mesa 4…"
          />
        </div> */}

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-3">
          <button
            onClick={() => onClose()}
            className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            onClick={finalize}
            disabled={itens.length === 0 || remaining > 0.01}
            className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95 disabled:opacity-50"
            title={remaining > 0.01 ? 'Ainda falta pagar' : undefined}
          >
            Finalizar pedido
          </button>
        </div>
      </div>
    </div>
  )
}
