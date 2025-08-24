import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import FormProduto from '@/components/FormProduto'
import type { ProductType, Variation } from '@prisma/client'

type ProdutoComToppings = {
  id: string
  name: string
  description: string | null
  type: ProductType
  price: number
  usaChocolate: boolean
  usaAcompanhamentos: boolean
  quantidadeAcompanhamentos: number | null
  isActive: boolean
  createdAt: Date
  variations: Variation[]
  productToppings: {
    topping: {
      id: string
      name: string
      precoExtra: number
      ativo: boolean
    }
  }[]
}

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {

  const {id} = await params

  const produto = await prisma.product.findUnique({
    where: { id: id },
    include: {
      variations: true,
      productToppings: {
        include: {
          topping: true,
        },
      },
    },
  })

  if (!produto) return notFound()

  const produtoComToppings = produto as ProdutoComToppings

  const acompanhamentosDisponiveis = await prisma.topping.findMany({
    where: { ativo: true },
    orderBy: { name: 'asc' },
  })

  const toppingsSelecionados = produtoComToppings.productToppings.map(
    (pt) => pt.topping.id
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Produto</h1>
      <FormProduto
        produto={produtoComToppings}
        acompanhamentosDisponiveis={acompanhamentosDisponiveis}
        toppingsSelecionados={toppingsSelecionados}
      />
    </div>
  )
}
