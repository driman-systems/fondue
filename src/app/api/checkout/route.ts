// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Tipos esperados do front (o ModalCheckout.tsx que você tem)
type PayMethod = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO'
type IncomingBody = {
  items: {
    productId: string
    quantity: number
    unitPrice: number
    variationName?: string | null
    toppings?: string[]
  }[]
  discount: null | { type: 'valor' | 'percent'; value: number }
  payments: { method: PayMethod; value: number }[]
  notes: string | null
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: IncomingBody
  try {
    body = (await req.json()) as IncomingBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // validações mínimas
  if (!body.items?.length) {
    return NextResponse.json({ error: 'Pedido sem itens' }, { status: 400 })
  }
  if (!body.payments?.length) {
    return NextResponse.json({ error: 'Informe ao menos um pagamento' }, { status: 400 })
  }

  // localiza o caixa ABERTO do usuário logado
  const caixa = await prisma.dailyCashRegister.findFirst({
    where: { openedById: session.user.id, closedAt: null },
    select: { id: true },
  })
  if (!caixa) {
    return NextResponse.json({ error: 'Nenhum caixa aberto para o usuário' }, { status: 400 })
  }

  // calcula subtotal e total (usando unitPrice que veio do front)
  const subtotal = body.items.reduce(
    (acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0),
    0,
  )
  let total = subtotal
  if (body.discount) {
    if (body.discount.type === 'valor') {
      total = Math.max(0, subtotal - Math.max(0, Number(body.discount.value) || 0))
    } else {
      const pct = Math.max(0, Math.min(Number(body.discount.value) || 0, 100))
      total = Math.max(0, subtotal - subtotal * (pct / 100))
    }
  }

  // opcional: garante consistência com pagamentos
  const sumPayments = body.payments.reduce((a, p) => a + (Number(p.value) || 0), 0)
  if (Math.abs(sumPayments - total) > 0.01) {
    // não bloqueio, mas você pode bloquear se preferir
    // return NextResponse.json({ error: 'Pagamentos não fecham com total' }, { status: 400 })
  }

  // cria pedido, itens e pagamentos
  // (OrderItem do seu schema não tem unitPrice; gravamos só productId/quantity.
  //  total fica no Order; qualquer detalhe de variações/toppings pode ir em notes.)
  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerName: null,
          notes: body.notes,
          total,
          cashRegisterId: caixa.id,
          items: {
            create: body.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              details: {
              chocolate: it.variationName ?? null,
              toppings: it.toppings ?? [],
            },
            })),
          },
        },
        select: { id: true },
      })

      // grava pagamentos vinculados ao pedido e ao caixa
      if (body.payments.length) {
        await tx.payment.createMany({
          data: body.payments.map((p) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            method: p.method as any, // enum do schema
            value: Number(p.value) || 0,
            orderId: created.id,
            cashRegisterId: caixa.id,
          })),
        })
      }

      return created
    })

    return NextResponse.json({ ok: true, orderId: order.id })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('checkout error', e)
    return NextResponse.json(
      { error: e?.message ?? 'Falha ao finalizar pedido' },
      { status: 500 },
    )
  }
}
