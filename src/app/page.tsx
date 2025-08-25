'use client'
import { useEffect, useState } from 'react'
import HeaderPOS from '@/components/frente/HeaderPOS'
import ListaProdutos from '@/components/frente/ListaProdutos'
import PedidoResumo from '@/components/frente/PedidoResumo'

export default function HomePOS() {
  const [isOpen, setIsOpen] = useState(false)
  const [caixaNumber, setCaixaNumber] = useState<number | null>(null)

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <HeaderPOS isOpen={isOpen} caixaNumber={caixaNumber} onStatusChanged={loadStatus} />
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto p-4">
        <section>
          <ListaProdutos isOpen={isOpen} />
        </section>
        <aside>
          <PedidoResumo isOpen={isOpen} />
        </aside>
      </main>
    </div>
  )
}
