import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const produtos = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }, // ordena por nome no banco só pra já vir estável
    include: {
      variations: true,
      productToppings: { include: { topping: true } },
    },
  })

  const data = produtos.map((p) => {
    // Toppings por relação ProductTopping
    const toppingsByRelation = p.productToppings
      .filter((pt) => pt.topping.ativo)
      .map((pt) => ({
        id: pt.topping.id,
        name: pt.topping.name,
        precoExtra: pt.topping.precoExtra,
      }))

    // Fallback: se for FONDUE e não houver relação, usar VARIATIONS como acompanhamentos
    const toppingsByVariation =
      p.type === 'FONDUE'
        ? p.variations.map((v) => ({
            id: v.id,
            name: v.name,
            precoExtra: v.price ?? 0,
          }))
        : []

    const toppings =
      toppingsByRelation.length > 0 ? toppingsByRelation : toppingsByVariation

    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      type: p.type, // 'FONDUE' | 'BEBIDA' | 'OUTRO'
      price: p.price,
      usaChocolate: p.usaChocolate,
      usaAcompanhamentos: p.usaAcompanhamentos,
      quantidadeAcompanhamentos: p.quantidadeAcompanhamentos ?? null,
      variations: p.variations.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
      })),
      toppings,
    }
  })

  // 🔽 AQUI: ordena FONDUE primeiro e, dentro dos grupos, por nome
  const sorted = data.sort((a, b) => {
    const rank = (t: string) => (t === 'FONDUE' ? 0 : 1)
    return rank(a.type) - rank(b.type) || a.name.localeCompare(b.name)
  })

  return NextResponse.json(sorted)
}
