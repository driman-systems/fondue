'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ModalContasPOS from '@/components/frente/ModalContasPOS'

type CaixaInfo = { id: string; number: number | null } | null

function parseBRLToNumber(s: string) {
  if (!s) return 0
  return Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0
}

export default function HeaderPOS() {
  const { data: session } = useSession()
  const [caixa, setCaixa] = useState<CaixaInfo>(null)
  const [loading, setLoading] = useState(false)
  const [contasOpen, setContasOpen] = useState(false)

  async function loadStatus() {
    try {
      const r = await fetch('/api/contas?caixaAtual=1', { cache: 'no-store' })
      const j = await r.json()
      setCaixa(j?.caixa ?? null)
    } catch {
      setCaixa(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

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
      const r = await fetch('/api/caixa/close', { method: 'POST' })
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

  const isOpen = Boolean(caixa)

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 text-white">
        {/* Logo + título + status */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={36} height={36} className="rounded" priority />
          <div className="text-lg font-semibold">Frente de Caixa</div>
          <span
            className={`ml-2 rounded-full px-3 py-1 text-xs ${
              isOpen ? 'bg-green-700/20 text-green-400' : 'bg-zinc-700/30 text-zinc-300'
            }`}
          >
            {isOpen ? `Caixa #${caixa?.number ?? '—'} • ABERTO` : 'Caixa FECHADO'}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-300 mr-3">
            Olá, <span className="font-semibold">{session?.user?.name ?? 'Usuário'}</span>
          </div>

          {/* Ver contas (modal) */}
          <button
            onClick={() => setContasOpen(true)}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-sm border border-zinc-700"
            disabled={!isOpen || loading}
            title={!isOpen ? 'Abra um caixa para ver as contas' : 'Ver contas do caixa atual'}
          >
            Ver contas
          </button>

          {isOpen ? (
            <button
              onClick={fecharCaixa}
              className="rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95 px-3 py-2 text-sm"
              disabled={loading}
            >
              Fechar caixa
            </button>
          ) : (
            <button
              onClick={abrirCaixa}
              className="rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95 px-3 py-2 text-sm"
              disabled={loading}
            >
              Abrir caixa
            </button>
          )}
        </div>
      </header>

      {/* Modal de Contas do POS */}
      <ModalContasPOS open={contasOpen} onClose={() => setContasOpen(false)} />
    </>
  )
}
