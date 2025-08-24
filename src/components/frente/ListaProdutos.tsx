'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProdutoDTO } from '@/types/product'
import { usePedidoStore } from '@/hooks/usePedidoStore'
import { useCaixaStore } from '@/hooks/useCaixaStore'
import ModalFondue from './ModalFondue'

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
}

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState<ProdutoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const adicionarItemSimples = usePedidoStore((s) => s.adicionarItemSimples)
  const adicionarItemComOpcoes = usePedidoStore((s) => s.adicionarItemComOpcoes)
  const isOpen = useCaixaStore((s) => s.isOpen)

  const [fondueOpen, setFondueOpen] = useState(false)
  const [produtoSel, setProdutoSel] = useState<ProdutoDTO | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/produtos', { cache: 'no-store' })
        const data: ProdutoDTO[] = await r.json()
        setProdutos(data) // já vem ordenado com FONDUE primeiro
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return produtos
    return produtos.filter((p) => {
      const name = normalize(p.name)
      const desc = normalize(p.description ?? '')
      return name.includes(q) || desc.includes(q)
    })
  }, [produtos, query])

  function handleAdd(p: ProdutoDTO) {
    if (!isOpen) {
      alert('Abra o caixa para lançar produtos.')
      return
    }
    if (p.type === 'FONDUE') {
      setProdutoSel(p)
      setFondueOpen(true)
      return
    }
    adicionarItemSimples(p)
  }

  function confirmFondue({
    variation,
    toppings,
  }: {
    variation: { id: string; name: string; price: number } | null
    toppings: { id: string; name: string; precoExtra: number }[]
  }) {
    if (!produtoSel) return
    adicionarItemComOpcoes(produtoSel, { variation: variation ?? undefined, toppings })
  }

  if (loading) return <div className="text-zinc-400 text-sm">Carregando produtos…</div>

  return (
    <div className="flex flex-col gap-3">
      {/* aviso caixa fechado */}
      {!isOpen && (
        <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/20 text-yellow-300 text-sm px-3 py-2">
          Caixa fechado — abra o caixa para lançar produtos.
        </div>
      )}

      {/* input de busca */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produtos…"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm outline-none focus:border-zinc-600"
        />
        {query && (
          <button
            aria-label="Limpar busca"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700"
          >
            limpar
          </button>
        )}
      </div>

      {/* grid de produtos */}
      {filtered.length === 0 ? (
        <div className="text-zinc-400 text-sm">Nenhum produto encontrado.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const disabled = !isOpen
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p)}
                disabled={disabled}
                title={disabled ? 'Abra o caixa para lançar produtos' : undefined}
                className={`group rounded-2xl border border-zinc-800 p-4 text-left transition
                  ${disabled ? 'bg-zinc-900/30 opacity-50 cursor-not-allowed' : 'bg-zinc-900/40 hover:bg-zinc-900'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">
                    {p.type}
                  </span>
                  <span className="text-sm font-semibold opacity-80">
                    R$ {p.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-base font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.description}</div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Modal FONDUE */}
      {produtoSel && (
        <ModalFondue
          produto={produtoSel}
          open={fondueOpen}
          onClose={() => setFondueOpen(false)}
          onConfirm={confirmFondue}
        />
      )}
    </div>
  )
}
