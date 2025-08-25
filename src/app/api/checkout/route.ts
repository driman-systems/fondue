// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Body = {
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    variationName?: string | null
    toppings?: string[]
  }>
  discount: null | { type: 'valor' | 'percent'; value: number }
  payments: Array<{ method: 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'; value: number }>
  notes?: string | null
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = (await req.json()) as Body

    // calcula total
    const subtotal = body.items.reduce((a, it) => a + it.unitPrice * it.quantity, 0)
    const desconto =
      body.discount
        ? body.discount.type === 'valor'
          ? Math.max(0, Math.min(body.discount.value, subtotal))
          : Math.max(0, Math.min(subtotal * (body.discount.value / 100), subtotal))
        : 0
    const total = Math.max(0, subtotal - desconto)

    // caixa aberto do usuário
    const caixa = await prisma.dailyCashRegister.findFirst({
      where: { openedById: session.user.id, closedAt: null },
      orderBy: { openedAt: 'desc' },
      select: { id: true, number: true },
    })
    if (!caixa) {
      return NextResponse.json({ error: 'Nenhum caixa aberto para este usuário.' }, { status: 400 })
    }

    // cria tudo em UMA operação (sem createMany/sem transação longa)
    const created = await prisma.order.create({
      data: {
        customerName: null,
        notes: body.notes ?? null,
        total,
        cashRegisterId: caixa.id,
        items: {
          create: body.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            // guardamos chocolate e acompanhamentos no JSON "details"
            details: {
              chocolate: it.variationName ?? null,
              toppings: it.toppings ?? [],
            },
          })),
        },
        payments: {
          // nested create (não usar createMany aqui)
          create: body.payments.map((p) => ({
            method: p.method,
            value: p.value,
            cashRegisterId: caixa.id, // seu schema exige cashRegisterId no Payment
          })),
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, orderId: created.id })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('checkout error', e)
    return NextResponse.json({ error: e?.message ?? 'Erro no checkout' }, { status: 500 })
  }
}
