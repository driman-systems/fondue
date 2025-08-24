import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const {id} = await params
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

    // Atualiza os dados principais do produto
    const updatedProduct = await prisma.product.update({
      where: { id },
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

    // Remove variações antigas
    await prisma.variation.deleteMany({
      where: { productId: id },
    })

    // Cria variações novas
    if (variations && variations.length > 0) {
      await prisma.variation.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: variations.map((v: any) => ({
          name: v.name,
          price: v.price,
          productId: id,
        })),
      })
    }

    // Remove acompanhamentos antigos
    await prisma.productTopping.deleteMany({
      where: { productId: id },
    })

    // Adiciona novos acompanhamentos
    if (acompanhamentosSelecionados && acompanhamentosSelecionados.length > 0) {
      await prisma.productTopping.createMany({
        data: acompanhamentosSelecionados.map((toppingId: string) => ({
          productId: id,
          toppingId,
        })),
      })
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao atualizar produto' }, { status: 500 })
  }
}
