'use client'

import { useEffect, useMemo, useState } from 'react'

type OrderDTO = {
  id: string
  createdAt: string | Date
  total: number
  items: { productName: string; quantity: number; price: number }[]
  payments: { method: 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'; value: number }[]
  notes?: string | null
}

type ApiResp = {
  caixa: { id: string; number: number | null; openedAt: string | Date | null } | null
  orders: OrderDTO[]
  totals: { paid?: number; byMethod?: Record<string, number> }
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}
function dt(d: string | Date) {
  const dd = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dd)
}

export default function VerContasPage() {
  const [data, setData] = useState<ApiResp | null>(null)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  // Busca com debounce
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      const url = new URL('/api/contas', window.location.origin)
      url.searchParams.set('caixaAtual', '1')
      if (q.trim()) url.searchParams.set('q', q.trim())

      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json: ApiResp = await res.json()
      setData(json)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  // Mantém 'orders' estável e bem tipado para os hooks abaixo
  const orders: OrderDTO[] = useMemo(() => (data?.orders ? data.orders : []), [data?.orders])

  const byMethod = data?.totals?.byMethod || {}

  const totalPedidos = useMemo(
    () => orders.reduce((a, o) => a + ((o.total as number) || 0), 0),
    [orders]
  )

  function reimprimir(orderId: string) {
    // TODO: integrar com impressão térmica
    alert(`Reimprimir pedido ${orderId} (stub)`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">
          {data?.caixa ? `Contas do Caixa #${data.caixa.number ?? '—'}` : 'Nenhum caixa aberto'}
        </div>
        <input
          placeholder="Buscar por pedido, cliente, produto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-80 max-w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Pedidos</div>
          <div className="text-lg font-semibold">{orders.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Total em pedidos</div>
          <div className="text-lg font-semibold">{fmt(totalPedidos)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Pago (Dinheiro)</div>
          <div className="text-lg font-semibold">{fmt(byMethod.DINHEIRO || 0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Pago (PIX)</div>
          <div className="text-lg font-semibold">{fmt(byMethod.PIX || 0)}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Cartões</div>
          <div className="text-lg font-semibold">
            {fmt((byMethod.CREDITO || 0) + (byMethod.DEBITO || 0))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/60">
            <tr className="text-left">
              <th className="p-3">Pedido</th>
              <th className="p-3">Data</th>
              <th className="p-3">Itens</th>
              <th className="p-3">Total</th>
              <th className="p-3">Pagamentos</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-zinc-400" colSpan={6}>
                  Carregando…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td className="p-4 text-zinc-400" colSpan={6}>
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-800">
                  <td className="p-3 font-mono">{o.id.slice(0, 8)}</td>
                  <td className="p-3">{dt(o.createdAt)}</td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {o.items.map((it, i) => (
                        <div key={i}>
                          {it.quantity}x {it.productName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{fmt(o.total || 0)}</td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {o.payments.map((p, i) => (
                        <div key={i}>
                          {p.method}: <span className="font-medium">{fmt(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => reimprimir(o.id)}
                      className="rounded-md px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700"
                    >
                      Reimprimir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
