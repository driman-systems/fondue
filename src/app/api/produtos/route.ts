import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const {
      name,
      description,
      price,
      type,
      isActive,
      usaChocolate,
      usaAcompanhamentos,
      quantidadeAcompanhamentos,
      acompanhamentosSelecionados,
      variations,
    } = data

    // Cria o produto principal
    const produto = await prisma.product.create({
      data: {
        name,
        description,
        price,
        type,
        isActive,
        usaChocolate,
        usaAcompanhamentos,
        quantidadeAcompanhamentos: usaAcompanhamentos ? quantidadeAcompanhamentos : 0,
      },
    })

    // Cria as variações (se houver)
    if (variations && variations.length > 0) {
      await prisma.variation.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: variations.map((v: any) => ({
          name: v.name,
          price: v.price,
          productId: produto.id,
        })),
      })
    }

    // Cria os acompanhamentos selecionados (se houver)
    if (acompanhamentosSelecionados && acompanhamentosSelecionados.length > 0) {
      await prisma.productTopping.createMany({
        data: acompanhamentosSelecionados.map((toppingId: string) => ({
          productId: produto.id,
          toppingId,
        })),
      })
    }

    return NextResponse.json({ success: true, produto })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao criar produto' }, { status: 500 })
  }
}
