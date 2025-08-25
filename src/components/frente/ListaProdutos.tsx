'use client'

import { useEffect, useMemo, useState } from 'react'
import ModalFondue from '@/components/frente/ModalFondue'
import { usePedidoStore } from '@/hooks/usePedidoStore'
import type { ProdutoDTO } from '@/types/product'

type Props = { isOpen: boolean }

export default function ListaProdutos({ isOpen }: Props) {
  const [all, setAll] = useState<ProdutoDTO[]>([])
  const [q, setQ] = useState('')
  const [fondue, setFondue] = useState<ProdutoDTO | null>(null)

  const adicionarItemSimples = usePedidoStore((s) => s.adicionarItemSimples)
  const adicionarItemComOpcoes = usePedidoStore((s) => s.adicionarItemComOpcoes)

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/produtos', { cache: 'no-store' })
      const data: ProdutoDTO[] = await r.json()

      // Deixa FONDUE no topo, depois ordena por nome
      data.sort((a, b) => {
        if (a.type === 'FONDUE' && b.type !== 'FONDUE') return -1
        if (a.type !== 'FONDUE' && b.type === 'FONDUE') return 1
        return a.name.localeCompare(b.name)
      })

      setAll(data)
    })()
  }, [])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return all
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description ?? '').toLowerCase().includes(s) ||
        String(p.price).includes(s),
    )
  }, [all, q])

  function handleClick(p: ProdutoDTO) {
    if (!isOpen) return
    // Para fondue com opções, abre o modal; demais produtos entram direto
    if (p.type === 'FONDUE' && (p.usaChocolate || p.usaAcompanhamentos)) {
      setFondue(p)
      return
    }
    adicionarItemSimples(p)
  }

  return (
    <div>
      {!isOpen && (
        <div className="mb-3 rounded-xl border border-amber-700 bg-amber-900/30 px-3 py-2 text-amber-300">
          Caixa fechado — abra o caixa para lançar produtos.
        </div>
      )}

      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => handleClick(p)}
            disabled={!isOpen}
            className={`text-left rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-4 transition ${
              !isOpen ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.type === 'FONDUE'
                    ? 'bg-purple-700/20 text-purple-300'
                    : p.type === 'BEBIDA'
                    ? 'bg-blue-700/20 text-blue-300'
                    : 'bg-zinc-700/30 text-zinc-300'
                }`}
              >
                {p.type}
              </span>
              <span className="text-sm font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
              </span>
            </div>
            <div className="text-base font-medium">{p.name}</div>
            {p.description ? (
              <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.description}</div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Modal para montar fondue */}
      {fondue && (
        <ModalFondue
          open={!!fondue}
          onClose={() => setFondue(null)}
          produto={fondue}
          onConfirm={({ variation, toppings }) => {
            // Aqui repassamos exatamente o que o modal retorna:
            //  - variation: { id: 'BRANCO' | 'PRETO', name: 'Chocolate ...', price: 0 } | null
            //  - toppings: [{ id, name, precoExtra }]
            adicionarItemComOpcoes(fondue, { variation, toppings })
            setFondue(null)
          }}
        />
      )}
    </div>
  )
}
