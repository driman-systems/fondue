import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type ItemInput = { productId: string; quantity: number }
type PaymentInput = { method: 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'; value: number }

export async function POST(req: Request) {
  try {
    const { customerName, notes, cashRegisterId, items, payments } = (await req.json()) as {
      customerName?: string | null
      notes?: string | null
      cashRegisterId: string
      items: ItemInput[]
      payments: PaymentInput[]
    }

    if (!cashRegisterId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
    }

    // Calcula total simples com base nos produtos atuais
    const productIds = [...new Set(items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    })
    const priceMap = new Map(products.map((p) => [p.id, p.price]))
    const total = items.reduce((acc, it) => acc + (priceMap.get(it.productId) ?? 0) * it.quantity, 0)

    const pedido = await prisma.order.create({
      data: {
        customerName: customerName ?? null,
        notes: notes ?? null,
        cashRegisterId,
        total,
        items: {
          createMany: {
            data: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        payments: {
          createMany: {
            data: (payments ?? []).map((p) => ({
              method: p.method,
              value: Number(p.value || 0),
              cashRegisterId,
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
