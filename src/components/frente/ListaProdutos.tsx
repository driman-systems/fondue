'use client'

import { useEffect, useState } from 'react'
import { usePedidoStore } from '@/hooks/usePedidoStore'
import { Product } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Loader } from 'lucide-react'

export default function ListaProdutos() {
  const [produtos, setProdutos] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { adicionarItem } = usePedidoStore()

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const res = await fetch('/api/produtos')
        const data = await res.json()
        setProdutos(data)
      } catch (err) {
        console.error('Erro ao buscar produtos', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProdutos()
  }, [])

  const handleAddProduto = (produto: Product) => {
    if (produto.type === 'FONDUE') {
      // Abrir modal para seleção de variações
      console.log('Abrir modal para fondue:', produto.name)
      // Em breve: abrir modal com opções
      return
    }

    adicionarItem({
      productId: produto.id,
      name: produto.name,
      price: produto.price,
      quantity: 1,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {produtos.map((produto) => (
        <Button
          key={produto.id}
          className="p-4 flex flex-col items-center justify-center h-24"
          variant="outline"
          onClick={() => handleAddProduto(produto)}
        >
          <span className="text-sm font-semibold">{produto.name}</span>
          <span className="text-xs text-gray-500">R$ {produto.price.toFixed(2)}</span>
        </Button>
      ))}
    </div>
  )
}
