import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PaymentMethod } from '@prisma/client'

type ItemIn = {
  productId: string
  quantity: number
  unitPrice: number
  variationName?: string | null
  toppings?: string[]
}

type PaymentIn = {
  method: 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'
  value: number
}

type DiscountIn = { type: 'valor' | 'percent'; value: number } | null

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    items?: ItemIn[]
    payments?: PaymentIn[]
    discount?: DiscountIn
    notes?: string | null
  }

  const items = body?.items ?? []
  const payments = body?.payments ?? []
  const discount = body?.discount ?? null
  const notes = body?.notes ?? null

  if (items.length === 0) return NextResponse.json({ error: 'Sem itens' }, { status: 400 })
  if (payments.length === 0) return NextResponse.json({ error: 'Sem pagamentos' }, { status: 400 })

  // caixa aberto
  const caixa = await prisma.dailyCashRegister.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: 'desc' },
    select: { id: true },
  })
  if (!caixa) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 })

  // calcula totais no servidor (fonte da verdade)
  const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0)
  let discountValue = 0
  if (discount && discount.value > 0) {
    if (discount.type === 'valor') discountValue = Math.min(discount.value, subtotal)
    else if (discount.type === 'percent') discountValue = Math.min(subtotal * (discount.value / 100), subtotal)
  }
  const finalTotal = Math.max(0, subtotal - discountValue)

  const paid = payments.reduce((acc, p) => acc + (p.value > 0 ? p.value : 0), 0)
  const diff = Math.abs(paid - finalTotal)

  if (diff > 0.01) {
    return NextResponse.json(
      { error: 'Pagamentos não batem com o total final', subtotal, discountValue, finalTotal, paid },
      { status: 400 },
    )
  }

  // cria pedido + pagamentos (transação)
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        notes: notes
          ? notes
          : (discountValue > 0 ? `Desconto aplicado: R$ ${discountValue.toFixed(2)}` : null),
        total: finalTotal, // já com desconto
        cashRegisterId: caixa.id,
        items: {
          create: items.map((it) => ({
            quantity: it.quantity,
            productId: it.productId,
          })),
        },
      },
      select: { id: true },
    })

    // pagamentos
    for (const p of payments) {
      await tx.payment.create({
        data: {
          value: p.value,
          method: p.method as PaymentMethod,
          orderId: created.id,
          cashRegisterId: caixa.id,
        },
      })
    }

    return created
  })

  return NextResponse.json({ ok: true, orderId: order.id, subtotal, discountValue, finalTotal, paid })
}
