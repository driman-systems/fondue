import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const produtos = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      variations: true,
      productToppings: { include: { topping: true } },
    },
  })

  const data = produtos.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    type: p.type, // 'FONDUE' | 'BEBIDA' | 'OUTRO'
    price: p.price,
    usaChocolate: p.usaChocolate,
    usaAcompanhamentos: p.usaAcompanhamentos,
    quantidadeAcompanhamentos: p.quantidadeAcompanhamentos ?? null,
    variations: p.variations.map(v => ({ id: v.id, name: v.name, price: v.price })),
    toppings: p.productToppings
      .filter(pt => pt.topping.ativo)
      .map(pt => ({ id: pt.topping.id, name: pt.topping.name, precoExtra: pt.topping.precoExtra })),
  }))

  return NextResponse.json(data)
}
