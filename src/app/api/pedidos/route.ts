import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { customerName, notes, cashRegisterId, items, payments } = await req.json()

    const pedido = await prisma.order.create({
      data: {
        customerName,
        notes,
        cashRegisterId,
        items: {
          createMany: {
            data: items.map((item: { productId: string; quantity: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        payments: {
          createMany: {
            data: payments.map((p: { method: string; amount: number }) => ({
              method: p.method,
              amount: p.amount,
            })),
          },
        },
      },
      include: {
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(pedido)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao registrar pedido' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const pedidos = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        cashRegister: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
