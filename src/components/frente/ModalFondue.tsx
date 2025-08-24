'use client'

import { useMemo, useState } from 'react'
import { ProdutoDTO } from '@/types/product'
import { PedidoTopping } from '@/hooks/usePedidoStore'

type Props = {
  produto: ProdutoDTO
  open: boolean
  onClose: () => void
  onConfirm: (args: {
    variation: { id: string; name: string; price: number } | null
    toppings: PedidoTopping[]
  }) => void
}

type Chocolate = 'BRANCO' | 'PRETO' | null

export default function ModalFondue({ produto, open, onClose, onConfirm }: Props) {
  const [chocolate, setChocolate] = useState<Chocolate>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const maxTops = Number.isFinite(produto.quantidadeAcompanhamentos ?? NaN)
    ? (produto.quantidadeAcompanhamentos as number)
    : Infinity

  const selectedCount = selected.size
  const canSelectMore = selectedCount < maxTops

  const selectedToppings = useMemo(
    () => produto.toppings.filter(t => selected.has(t.id)),
    [produto.toppings, selected]
  )

  const extras = useMemo(
    () => selectedToppings.reduce((acc, t) => acc + (t.precoExtra ?? 0), 0),
    [selectedToppings]
  )

  const totalPreview = useMemo(
    () => produto.price + extras, // chocolate sem custo
    [produto.price, extras]
  )

  function toggleTop(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (canSelectMore) next.add(id)
      return next
    })
  }

  function confirm() {
    if (produto.type === 'FONDUE' && !chocolate) {
      alert('Selecione o tipo de chocolate (Branco ou Preto).')
      return
    }
    const variation =
      produto.type === 'FONDUE' && chocolate
        ? { id: chocolate, name: chocolate === 'BRANCO' ? 'Chocolate Branco' : 'Chocolate Preto', price: 0 }
        : null

    const toppings: PedidoTopping[] = selectedToppings.map(t => ({
      id: t.id,
      name: t.name,
      precoExtra: t.precoExtra ?? 0,
    }))

    onConfirm({ variation, toppings })
    onClose()
    setChocolate(null)
    setSelected(new Set())
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <div className="text-lg font-semibold mb-1">{produto.name}</div>
        <div className="text-sm text-zinc-400 mb-4">
          Monte seu fondue • Preço base: R$ {produto.price.toFixed(2)}
        </div>

        {/* 1) Chocolate (sem preço) */}
        <div className="mb-4">
          <div className="font-medium mb-2">Chocolate</div>
          <div className="grid grid-cols-2 gap-2">
            {(['BRANCO', 'PRETO'] as Chocolate[]).map(ch => (
              <label
                key={ch}
                className={`border rounded-xl p-3 cursor-pointer ${
                  chocolate === ch ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="chocolate"
                  className="hidden"
                  checked={chocolate === ch}
                  onChange={() => setChocolate(ch)}
                />
                <div className="flex items-center justify-between">
                  <span>{ch === 'BRANCO' ? 'Chocolate Branco' : 'Chocolate Preto'}</span>
                  {/* sem preço aqui */}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 2) Acompanhamentos (mostra preço só se > 0, sem 'incl.') */}
        <div className="mb-4">
          <div className="font-medium mb-2">
            Acompanhamentos{' '}
            {Number.isFinite(maxTops) && (
              <span className="text-zinc-400 font-normal">
                (até {maxTops}) — selecionados: {selectedCount}
              </span>
            )}
          </div>

          {produto.toppings.length === 0 ? (
            <div className="text-xs text-zinc-400 border border-zinc-800 rounded-xl p-3">
              Nenhum acompanhamento vinculado a este produto.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {produto.toppings.map(t => {
                const checked = selected.has(t.id)
                const disabled = !checked && !canSelectMore
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTop(t.id)}
                    disabled={disabled}
                    className={`text-left border rounded-xl p-3 transition ${
                      checked ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-800 hover:bg-zinc-900'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={disabled ? 'Limite atingido' : checked ? 'Remover' : 'Adicionar'}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{t.name}</span>
                      {t.precoExtra > 0 && (
                        <span className="text-xs opacity-80">+ R$ {t.precoExtra.toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-3">
          <div className="text-sm text-zinc-400">
            Total prévio: <span className="font-semibold text-white">R$ {totalPreview.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800">
              Cancelar
            </button>
            <button
              onClick={confirm}
              disabled={!chocolate}
              title={!chocolate ? 'Escolha o chocolate' : undefined}
              className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95 disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
