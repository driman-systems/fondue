'use client'

import { usePedidoStore } from '@/hooks/usePedidoStore'
import { formatarPreco } from '@/utils/formatarPreco'

export default function PedidoResumo({ onFinalizar }: { onFinalizar: () => void }) {
  const { items, total, removeItem } = usePedidoStore()

  return (
    <div className="flex flex-col h-full p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Pedido Atual</h2>

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 && <p className="text-gray-500">Nenhum item no pedido.</p>}

        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-2">
            <div className="flex justify-between">
              <span>{item.name}</span>
              <span>{item.quantity}x</span>
            </div>
            {item.variation && (
              <div className="text-sm text-gray-600">Var: {item.variation.name}</div>
            )}
            {item.toppings && item.toppings?.length > 0 && (
              <div className="text-sm text-gray-600">
                {item.toppings.map(t => t.name).join(', ')}
              </div>
            )}
            <div className="text-right text-sm text-green-600 font-bold">
              {formatarPreco(
                (item.price +
                  (item.variation?.price ?? 0) +
                  (item.toppings?.reduce((acc, t) => acc + t.precoExtra, 0) ?? 0)) *
                  item.quantity
              )}
            </div>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-xs text-red-500 mt-1"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4 flex justify-between items-center">
        <span className="text-lg font-semibold">Total:</span>
        <span className="text-xl font-bold text-green-600">{formatarPreco(total())}</span>
      </div>

      <button
        onClick={onFinalizar}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Finalizar Pedido
      </button>
    </div>
  )
}
