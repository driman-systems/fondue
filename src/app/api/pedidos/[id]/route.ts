import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {

  const {id} = await params

  try {
    const pedido = await prisma.order.findUnique({
      where: { id: id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        cashRegister: true,
      },
    })

    if (!pedido) {
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 })
    }

    return NextResponse.json(pedido)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar pedido' }, { status: 500 })
  }
}
