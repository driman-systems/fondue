'use client'

import { useEffect, useState } from 'react'
import { FiTrash } from 'react-icons/fi'
import Image from 'next/image'

interface Produto {
  id: string
  name: string
  price: number
  type: string
}

export default function FrenteDeCaixa() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedido, setPedido] = useState<Produto[]>([])
  const [caixaAberto, setCaixaAberto] = useState(false)

  useEffect(() => {
    fetch('/api/produtos')
      .then((res) => res.json())
      .then((data) => setProdutos(data))
  }, [])

  function adicionarProduto(produto: Produto) {
    setPedido([...pedido, produto])
  }

  function removerProduto(index: number) {
    const novoPedido = [...pedido]
    novoPedido.splice(index, 1)
    setPedido(novoPedido)
  }

  function totalPedido() {
    return pedido.reduce((acc, item) => acc + item.price, 0)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <div className="font-bold text-xl">Logo do Sistema</div>
        <div>
          {caixaAberto ? (
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Ver Vendas</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded">Fechar Caixa</button>
            </div>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => setCaixaAberto(true)}
            >
              Abrir Caixa
            </button>
          )}
        </div>
      </header>

      {/* Corpo */}
      <div className="flex flex-1">
        {/* Produtos */}
        <div className="w-3/4 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {produtos.map((produto) => (
            <button
              key={produto.id}
              className="bg-yellow-100 border-2 border-yellow-500 text-yellow-800 rounded p-4 flex flex-col items-center shadow hover:bg-yellow-200"
              onClick={() => adicionarProduto(produto)}
            >
              <Image src="/produto-icon.png" alt="Produto" width={50} height={50} />
              <span className="font-semibold mt-2">{produto.name}</span>
              <span className="text-sm">R$ {produto.price.toFixed(2)}</span>
            </button>
          ))}
        </div>

        {/* Pedido */}
        <div className="w-1/4 bg-gray-50 p-4 border-l">
          <h2 className="font-bold text-lg mb-4">Itens do Pedido</h2>
          {pedido.length === 0 ? (
            <p className="text-gray-500">Nenhum item adicionado</p>
          ) : (
            <ul className="space-y-2">
              {pedido.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-white p-2 rounded shadow"
                >
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">R$ {item.price.toFixed(2)}</span>
                    <button onClick={() => removerProduto(index)}>
                      <FiTrash className="text-red-500" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t mt-4 pt-4 text-right font-bold text-lg">
            Total: R$ {totalPedido().toFixed(2)}
          </div>

          {/* Formas de pagamento */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Forma de Pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Dinheiro', 'Pix', 'Crédito', 'Débito'].map((forma) => (
                <button
                  key={forma}
                  className="bg-[#4B1E00] text-yellow-400 px-4 py-2 rounded"
                >
                  {forma}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
