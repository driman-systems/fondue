'use client'

import { useEffect, useMemo, useState } from 'react'

type OrderRow = {
  id: string
  createdAt: string | Date
  total: number
  items: { productName: string; quantity: number; price: number }[]
  payments: { method: 'DINHEIRO'|'PIX'|'CREDITO'|'DEBITO'; value: number }[]
  notes?: string | null
}
type ApiResp = {
  caixa: { id: string; number: number | null; openedAt: string | Date | null } | null
  orders: OrderRow[]
  totals: { paid?: number; byMethod?: Record<string, number> }
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}
function dt(d: string | Date) {
  const dd = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dd)
}

export default function ModalContasPOS({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const t = setTimeout(async () => {
      const url = new URL('/api/contas', window.location.origin)
      url.searchParams.set('caixaAtual', '1')
      if (q.trim()) url.searchParams.set('q', q.trim())
      const r = await fetch(url, { cache: 'no-store' })
      const j: ApiResp = await r.json()
      setData(j)
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [open, q])

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])
  const byMethod = data?.totals?.byMethod || {}
  const totalPedidos = useMemo(
    () => orders.reduce((a, o) => a + (o.total || 0), 0),
    [orders]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">
            {data?.caixa ? `Contas do Caixa #${data.caixa.number ?? 'â€”'}` : 'Nenhum caixa aberto'}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pedido/produto/clienteâ€¦"
            className="w-72 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm"
          />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">Pedidos</div>
            <div className="text-lg font-semibold">{orders.length}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">Total em pedidos</div>
            <div className="text-lg font-semibold">{fmt(totalPedidos)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">Dinheiro</div>
            <div className="text-lg font-semibold">{fmt(byMethod.DINHEIRO || 0)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">PIX</div>
            <div className="text-lg font-semibold">{fmt(byMethod.PIX || 0)}</div>
          </div>
          <div className="rounded-xl border border-zinc-800 p-3">
            <div className="text-xs text-zinc-400">CartÃµes</div>
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
                    Carregandoâ€¦
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
                        onClick={() =>
                          window.open(`/comanda/${o.id}?auto=1`, '_blank', 'width=420,height=600')
                        }
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

        <div className="mt-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

