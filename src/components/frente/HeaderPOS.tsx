'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useCaixaStore } from '@/hooks/useCaixaStore'

type CaixaStatus = {
  isOpen: boolean
  caixaNumber: number | null
}

export default function HeaderPOS() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<CaixaStatus>({ isOpen: false, caixaNumber: null })
  const [userName, setUserName] = useState<string>('')

  // store global do caixa
  const setCaixaStatus = useCaixaStore((s) => s.setStatus)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/caixa/status', { cache: 'no-store' })
      const data: CaixaStatus = await res.json()
      setStatus(data)
      setCaixaStatus({
        isOpen: data.isOpen,
        caixaNumber: data.caixaNumber ?? null,
        loading: false,
      })
    } catch (e) {
      console.error('Falha ao carregar status do caixa', e)
      setCaixaStatus({ isOpen: false, caixaNumber: null, loading: false })
    } finally {
      setLoading(false)
    }
  }, [setCaixaStatus])

  async function openCaixa() {
    setLoading(true)
    try {
      const valor = typeof window !== 'undefined'
        ? window.prompt('Valor inicial do caixa (R$):', '0')
        : '0'
      const initialCash = Number((valor ?? '0').replace(',', '.')) || 0

      const res = await fetch('/api/caixa/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCash }),
      })
      if (!res.ok) throw new Error('Falha ao abrir caixa')
      await fetchStatus()
    } catch (e) {
      console.error(e)
      alert('Não foi possível abrir o caixa.')
    } finally {
      setLoading(false)
    }
  }

  async function closeCaixa() {
    if (!confirm('Tem certeza que deseja fechar o caixa?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/caixa/close', { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao fechar caixa')
      await fetchStatus()
    } catch (e) {
      console.error(e)
      alert('Não foi possível fechar o caixa.')
    } finally {
      setLoading(false)
    }
  }

  function verContas() {
    const num = status.caixaNumber ?? ''
    window.location.href = `/admin/contas?caixaAtual=${num}`
  }

  useEffect(() => {
    fetchStatus()
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' })
        if (r.ok) {
          const u = await r.json()
          setUserName(u?.name || '')
        }
      } catch {}
    })()
  }, [fetchStatus])

  return (
    <header className="w-full border-b border-zinc-800 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="rounded" />
          <div className="text-lg font-semibold">Frente de Caixa</div>

          {status.isOpen ? (
            <span className="ml-3 rounded-full px-3 py-1 text-xs bg-green-600/20 border border-green-500/40">
              Caixa #{status.caixaNumber ?? '—'} • ABERTO
            </span>
          ) : (
            <span className="ml-3 rounded-full px-3 py-1 text-xs bg-yellow-600/20 border border-yellow-500/40">
              Caixa FECHADO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="text-sm text-zinc-300 mr-2">Olá, {userName}</span>
          )}

          {!status.isOpen ? (
            <button
              onClick={openCaixa}
              disabled={loading}
              className="rounded-xl px-4 py-2 bg-yellow-400 text-black font-semibold hover:brightness-95 disabled:opacity-50"
            >
              {loading ? 'Abrindo...' : 'Abrir caixa'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={verContas}
                className="rounded-xl px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
              >
                Ver contas
              </button>
              <button
                onClick={closeCaixa}
                disabled={loading}
                className="rounded-xl px-4 py-2 bg-red-500 text-white font-semibold hover:brightness-95 disabled:opacity-50"
              >
                {loading ? 'Fechando...' : 'Fechar caixa'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
