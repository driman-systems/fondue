'use client'

import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import ModalContasPOS from '@/components/frente/ModalContasPOS'

type Props = {
  isOpen: boolean
  caixaNumber: number | null
  onStatusChanged?: () => void // pai pode recarregar /api/caixa/status
}

function parseBRLToNumber(s: string) {
  if (!s) return 0
  return Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0
}

export default function HeaderPOS({ isOpen, caixaNumber, onStatusChanged }: Props) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [contasOpen, setContasOpen] = useState(false)

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
        onStatusChanged?.()
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
        onStatusChanged?.()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 text-white">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={36} height={36} className="rounded" priority />
          <div className="text-lg font-semibold">Frente de Caixa</div>
          <span
            className={`ml-2 rounded-full px-3 py-1 text-xs ${
              isOpen ? 'bg-green-700/20 text-green-400' : 'bg-zinc-700/30 text-zinc-300'
            }`}
          >
            {isOpen ? `Caixa #${caixaNumber ?? '—'} • ABERTO` : 'Caixa FECHADO'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-300 mr-3">
            Olá, <span className="font-semibold">{session?.user?.name ?? 'Usuário'}</span>
          </div>

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

      <ModalContasPOS open={contasOpen} onClose={() => setContasOpen(false)} />
    </>
  )
}
