'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Product } from '@prisma/client'

type Variation = {
  id: string
  name: string
  price: number
}

type Topping = {
  id: string
  name: string
  precoExtra: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  product: Product
  variations: Variation[]
  toppings: Topping[]
  onConfirm: (variation: Variation, toppings: Topping[]) => void
}

export default function ModalVariacoesFondue({
  isOpen,
  onClose,
  product,
  variations,
  toppings,
  onConfirm
}: Props) {
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null)
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([])

  const toggleTopping = (t: Topping) => {
    setSelectedToppings(prev =>
      prev.some(top => top.id === t.id)
        ? prev.filter(top => top.id !== t.id)
        : [...prev, t]
    )
  }

  const handleConfirm = () => {
    if (!selectedVariation) return
    onConfirm(selectedVariation, selectedToppings)
    onClose()
    setSelectedToppings([])
    setSelectedVariation(null)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" />
      <Dialog.Panel className="bg-white p-6 rounded-lg z-50 max-w-md w-full space-y-4">
        <Dialog.Title className="text-xl font-bold">{product.name}</Dialog.Title>

        <div>
          <h3 className="font-medium">Escolha o chocolate:</h3>
          <div className="flex flex-col gap-2 mt-2">
            {variations.map(v => (
              <button
                key={v.id}
                className={`p-2 border rounded ${selectedVariation?.id === v.id ? 'bg-yellow-300' : ''}`}
                onClick={() => setSelectedVariation(v)}
              >
                {v.name} {v.price > 0 ? `(+R$ ${v.price.toFixed(2)})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium">Acompanhamentos:</h3>
          <div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto">
            {toppings.map(t => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedToppings.some(st => st.id === t.id)}
                  onChange={() => toggleTopping(t)}
                />
                {t.name} {t.precoExtra > 0 ? `(+R$ ${t.precoExtra.toFixed(2)})` : ''}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
          <button
            onClick={handleConfirm}
            disabled={!selectedVariation}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Adicionar
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  )
}
