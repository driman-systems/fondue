'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, ProductType, Variation, Topping } from '@prisma/client'

interface Props {
  produto?: Product & {
    variations: Variation[]
    productToppings: { topping: Topping }[]
  }
  acompanhamentosDisponiveis: Topping[]
}

export default function FormProduto({ produto, acompanhamentosDisponiveis = [] }: Props) {
  const router = useRouter()
  const isEdit = Boolean(produto)

  const [name, setName] = useState(produto?.name || '')
  const [description, setDescription] = useState(produto?.description || '')
  const [type, setType] = useState<ProductType>(produto?.type || 'OUTRO')
  const [price, setPrice] = useState(produto?.price || 0)
  const [isActive, setIsActive] = useState(produto?.isActive ?? true)
  const [usaChocolate, setUsaChocolate] = useState(produto?.usaChocolate ?? false)
  const [usaAcompanhamentos, setUsaAcompanhamentos] = useState(produto?.usaAcompanhamentos ?? false)
  const [quantidadeAcompanhamentos, setQuantidadeAcompanhamentos] = useState(produto?.quantidadeAcompanhamentos || 0)
  const [acompanhamentosSelecionados, setAcompanhamentosSelecionados] = useState<string[]>(
    produto?.productToppings?.map((pt) => pt.topping.id) || []
  )

  const [variations, setVariations] = useState<Variation[]>(produto?.variations || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(isEdit ? `/api/produtos/${produto?.id}` : '/api/produtos', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        type,
        price,
        isActive,
        usaChocolate,
        usaAcompanhamentos,
        quantidadeAcompanhamentos: usaAcompanhamentos ? quantidadeAcompanhamentos : 0,
        acompanhamentosSelecionados,
        variations,
      }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/admin/produtos')
    } else {
      const data = await res.json()
      setError(data.message || 'Erro ao salvar o produto.')
    }
  }

  const toggleAcompanhamento = (id: string) => {
    setAcompanhamentosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleAddVariation = () => {
    setVariations([...variations, { id: '', name: '', price: 0, productId: '' }])
  }

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index))
  }

  const handleVariationChange = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...variations]
    updated[index] = { ...updated[index], [field]: value }
    setVariations(updated)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <label className="font-medium">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div>
        <label className="font-medium">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      <div>
        <label className="font-medium">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ProductType)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="FONDUE">Fondue</option>
          <option value="BEBIDA">Bebida</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      <div>
        <label className="font-medium">Preço</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(parseFloat(e.target.value))}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label className="font-medium">Produto Ativo</label>
      </div>

      {type === 'FONDUE' && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={usaChocolate}
            onChange={(e) => setUsaChocolate(e.target.checked)}
          />
          <label className="font-medium">Usa Chocolate (Branco ou Preto)</label>
        </div>
      )}

      {type === 'FONDUE' && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={usaAcompanhamentos}
            onChange={(e) => setUsaAcompanhamentos(e.target.checked)}
          />
          <label className="font-medium">Permitir Acompanhamentos</label>
        </div>
      )}

      {type === 'FONDUE' && usaAcompanhamentos && (
        <>
          <div>
            <label className="font-medium">Quantidade de Acompanhamentos</label>
            <input
              type="number"
              value={quantidadeAcompanhamentos}
              onChange={(e) => setQuantidadeAcompanhamentos(parseInt(e.target.value))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="font-medium">Selecionar Acompanhamentos</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {acompanhamentosDisponiveis.map((a) => (
                <label key={a.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={acompanhamentosSelecionados.includes(a.id)}
                    onChange={() => toggleAcompanhamento(a.id)}
                  />
                  {a.name} {a.precoExtra > 0 ? `(R$ ${a.precoExtra.toFixed(2)})` : ''}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="font-medium">Acompanhamentos</label>
        {variations.map((v, index) => (
          <div key={index} className="flex items-center gap-3 mb-2">
            <input
              type="text"
              placeholder="Nome"
              value={v.name}
              onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
              className="flex-1 border px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Preço"
              value={v.price}
              onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value))}
              className="w-32 border px-3 py-2 rounded"
            />
            <button type="button" onClick={() => handleRemoveVariation(index)} className="text-red-500">
              Remover
            </button>
          </div>
        ))}
        <button type="button" onClick={handleAddVariation} className="text-blue-600 mt-2 ml-2">
          Adicionar acompanhamento
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#4B1E00] text-yellow-400 px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 font-semibold"
      >
        {loading ? 'Salvando...' : isEdit ? 'Atualizar Produto' : 'Cadastrar Produto'}
      </button>
    </form>
  )
}
