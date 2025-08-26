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

  const data = produtos.map((p) => {
    const toppingsByRelation = p.productToppings
      .filter((pt) => pt.topping.ativo)
      .map((pt) => ({
        id: pt.topping.id,
        name: pt.topping.name,
        precoExtra: pt.topping.precoExtra,
      }))

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
      type: p.type,
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

  const sorted = data.sort((a, b) => {
    const rank = (t: string) => (t === 'FONDUE' ? 0 : 1)
    return rank(a.type) - rank(b.type) || a.name.localeCompare(b.name)
  })

  return NextResponse.json(sorted)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      description,
      price,
      type,
      isActive = true,
      usaChocolate = false,
      usaAcompanhamentos = false,
      quantidadeAcompanhamentos = 0,
      acompanhamentosSelecionados = [], // array de IDs de toppings
      variations = [],                  // [{ name, price }]
    } = body

    const created = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price ?? 0),
        type,
        isActive,
        usaChocolate,
        usaAcompanhamentos,
        quantidadeAcompanhamentos: usaAcompanhamentos
          ? Number(quantidadeAcompanhamentos ?? 0)
          : 0,
      },
    })

    if (Array.isArray(variations) && variations.length > 0) {
      await prisma.variation.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: (variations as any[]).map((v) => ({
          name: v.name,
          price: Number(v.price ?? 0),
          productId: created.id,
        })),
      })
    }

    if (Array.isArray(acompanhamentosSelecionados) && acompanhamentosSelecionados.length > 0) {
      await prisma.productTopping.createMany({
        data: acompanhamentosSelecionados.map((toppingId: string) => ({
          productId: created.id,
          toppingId,
        })),
      })
    }

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}

