'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

function parseBRLToNumber(s: string) {
  if (!s) return 0
  return Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0
}

export default function CaixaAdminPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [caixaNumber, setCaixaNumber] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<null | {
    caixaId: string
    initialCash: number
    theoreticalFinalCash: number
    totals: { paid: number; byMethod: Record<string, number> }
  }>(null)

  async function loadStatus() {
    try {
      const r = await fetch('/api/caixa/status', { cache: 'no-store' })
      const j = await r.json()
      setIsOpen(!!j.isOpen)
      setCaixaNumber(j.caixaNumber ?? null)
    } catch {
      setIsOpen(false)
      setCaixaNumber(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (isOpen) loadSummary()
  }, [isOpen])

  async function loadSummary() {
    try {
      const r = await fetch('/api/caixa/summary', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        setSummary(j)
      } else {
        setSummary(null)
      }
    } catch {
      setSummary(null)
    }
  }

  async function abrirCaixa() {
    const v = prompt('Valor inicial do caixa (R$):', '0,00')
    if (v == null) return
    const initialCash = parseBRLToNumber(v)

    setLoading(true)
    try {
      const r = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCash }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => null)
        alert(e?.error ?? 'Não foi possível abrir o caixa.')
      } else {
        await loadStatus()
      }
    } finally {
      setLoading(false)
    }
  }

  async function fecharCaixa() {
    if (!confirm('Fechar o caixa atual?')) return
    setLoading(true)
    try {
      const r = await fetch('/api/caixa/close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countedCash: countedTotal }) })
      if (!r.ok) {
        const e = await r.json().catch(() => null)
        alert(e?.error ?? 'Não foi possível fechar o caixa.')
      } else {
        await loadStatus()
      }
    } finally {
      setLoading(false)
    }
  }

  // Contagem de dinheiro (conferência)
  const notes = [200,100,50,20,10,5,2,1,0.5,0.25,0.1,0.05]
  const [counts, setCounts] = useState<Record<string, number>>({})
  const countedTotal = useMemo(() => notes.reduce((a, v) => a + v * (counts[String(v)] || 0), 0), [counts])

  function setCount(v: number, c: number) {
    setCounts(prev => ({ ...prev, [String(v)]: Math.max(0, Math.floor(c || 0)) }))
  }

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Caixa</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/contas"
            className="rounded-md bg-zinc-800 text-white px-3 py-2 text-sm hover:bg-zinc-700"
          >
            Ver contas
          </Link>
          {isOpen ? (
            <button
              onClick={fecharCaixa}
              disabled={loading}
              className="rounded-md bg-yellow-400 text-black font-semibold px-3 py-2 text-sm hover:brightness-95 disabled:opacity-50"
            >
              Fechar caixa
            </button>
          ) : (
            <button
              onClick={abrirCaixa}
              disabled={loading}
              className="rounded-md bg-yellow-400 text-black font-semibold px-3 py-2 text-sm hover:brightness-95 disabled:opacity-50"
            >
              Abrir caixa
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-600">Status</div>
            <div className="mt-1 text-lg font-semibold">
              {isOpen ? `ABERTO (Caixa #${caixaNumber ?? '—'})` : 'FECHADO'}
            </div>
          </div>
          <Link href="/admin/contas" className="rounded-md border px-3 py-2 bg-white hover:bg-zinc-50 text-sm">Ver contas</Link>
        </div>

        {isOpen && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumo do caixa */}
            <div>
              <div className="mb-2 font-semibold">Resumo</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-xs text-zinc-500">Abertura</div>
                  <div className="text-lg font-semibold">{fmt(summary?.initialCash || 0)}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-xs text-zinc-500">Pago (total)</div>
                  <div className="text-lg font-semibold">{fmt(summary?.totals?.paid || 0)}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-xs text-zinc-500">Teórico (final)</div>
                  <div className="text-lg font-semibold">{fmt(summary?.theoreticalFinalCash || 0)}</div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="text-xs text-zinc-500">Dinheiro (pagamentos)</div>
                  <div className="text-lg font-semibold">{fmt(summary?.totals?.byMethod?.DINHEIRO || 0)}</div>
                </div>
              </div>
            </div>

            {/* Conferência de dinheiro */}
            <div>
              <div className="mb-2 font-semibold">Conferência (dinheiro contado)</div>
              <div className="grid grid-cols-3 gap-2">
                {notes.map((v) => (
                  <div key={v} className="flex items-center gap-2 text-sm">
                    <div className="min-w-[80px] text-right">{v >= 1 ? fmt(v) : v.toFixed(2).replace('.', ',')}</div>
                    <input
                      type="number"
                      min={0}
                      value={counts[String(v)] || 0}
                      onChange={(e) => setCount(v, parseInt(e.target.value || '0'))}
                      className="w-20 rounded-md border border-zinc-300 px-2 py-1"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm text-zinc-600">Total contado: <span className="font-semibold">{fmt(countedTotal)}</span></div>
              <div className="text-sm text-zinc-600">Diferença vs teórico: <span className={`font-semibold ${((countedTotal - (summary?.theoreticalFinalCash || 0))||0) === 0 ? '' : 'text-amber-600'}`}>
                {fmt(countedTotal - (summary?.theoreticalFinalCash || 0))}
              </span></div>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-zinc-500">
          Use os botões acima para abrir/fechar o caixa. Você pode consultar as contas do caixa atual em{' '}
          <Link href="/admin/contas" className="underline">Admin → Contas</Link>.
        </div>
      </div>
    </div>
  )
}
