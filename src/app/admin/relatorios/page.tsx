'use client'

import { useEffect, useMemo, useState } from 'react'

type PayMethod = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'
type Pagamento = {
  id: string
  value: number
  method: PayMethod
  createdAt: string | Date
  order: { id: string; customerName: string | null; createdAt: string | Date }
  cashRegister: { id: string; number: number | null }
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
}
function dt(d: string | Date) {
  const dd = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dd)
}

export default function RelatoriosPage() {
  const [data, setData] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(false)
  const [caixa, setCaixa] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const url = new URL('/api/pagamentos', window.location.origin)
      if (caixa.trim()) url.searchParams.set('caixa', caixa.trim())
      const r = await fetch(url.toString(), { cache: 'no-store' })
      const j: Pagamento[] = await r.json()
      setData(j)
    } finally {
      setLoading(false)
    }
  }

  // carrega ao abrir
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // aplica filtros de data no cliente
  const filtered = useMemo(() => {
    const f = from ? new Date(from) : null
    const t = to ? new Date(to) : null
    return data.filter((p) => {
      const d = new Date(p.createdAt)
      if (f && d < f) return false
      if (t && d > t) return false
      return true
    })
  }, [data, from, to])

  const totals = useMemo(() => {
    const byMethod: Record<PayMethod, number> = { DINHEIRO: 0, PIX: 0, CREDITO: 0, DEBITO: 0 }
    let total = 0
    for (const p of filtered) {
      byMethod[p.method] += p.value
      total += p.value
    }
    return { byMethod, total }
  }, [filtered])

  async function exportCSV() {
    try {
      setDownloading(true)
      const url = new URL('/api/export/pagamentos', window.location.origin)
      if (caixa.trim()) url.searchParams.set('caixa', caixa.trim())
      const r = await fetch(url.toString())
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'pagamentos.csv'
      a.click()
      URL.revokeObjectURL(a.href)
    } finally { setDownloading(false) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-zinc-600">Caixa (ID opcional)</label>
          <input
            value={caixa}
            onChange={(e) => setCaixa(e.target.value)}
            placeholder="Ex: ckj..."
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-600">De</label>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-zinc-600">Até</label>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="rounded-md bg-zinc-800 text-white px-3 py-2 text-sm hover:bg-zinc-700" disabled={loading}>
            Atualizar
          </button>
          <button onClick={() => { setFrom(''); setTo(''); }} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Limpar datas
          </button>
          <button onClick={exportCSV} disabled={downloading} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Pagamentos</div>
          <div className="text-lg font-semibold">{filtered.length}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Total</div>
          <div className="text-lg font-semibold">{fmt(totals.total)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Dinheiro</div>
          <div className="text-lg font-semibold">{fmt(totals.byMethod.DINHEIRO)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">PIX</div>
          <div className="text-lg font-semibold">{fmt(totals.byMethod.PIX)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-xs text-zinc-500">Cartões</div>
          <div className="text-lg font-semibold">{fmt(totals.byMethod.CREDITO + totals.byMethod.DEBITO)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left">
              <th className="p-3">Data</th>
              <th className="p-3">Pedido</th>
              <th className="p-3">Caixa</th>
              <th className="p-3">Forma</th>
              <th className="p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-zinc-500" colSpan={5}>Carregando…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-4 text-zinc-500" colSpan={5}>Nenhum pagamento encontrado.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-zinc-200">
                  <td className="p-3">{dt(p.createdAt)}</td>
                  <td className="p-3 font-mono">{p.order?.id?.slice(0, 8)}</td>
                  <td className="p-3">#{p.cashRegister?.number ?? '—'}</td>
                  <td className="p-3">{p.method}</td>
                  <td className="p-3 font-semibold">{fmt(p.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
