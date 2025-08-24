// src/app/api/contas/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)

    const caixaAtual = searchParams.get('caixaAtual')
    const caixaIdParam = searchParams.get('caixaId')
    const q = (searchParams.get('q') || '').trim()
    const from = searchParams.get('from') // ISO
    const to = searchParams.get('to')     // ISO

    // Resolver qual caixa consultar
    let caixaId: string | null = null
    let caixaNumber: number | null = null
    let openedAt: Date | null = null

    if (caixaAtual === '1') {
      // caixa ABERTO do usuário logado
      if (!session?.user?.id) {
        return NextResponse.json({ caixa: null, orders: [], totals: {} })
      }
      const aberto = await prisma.dailyCashRegister.findFirst({
        where: { openedById: session.user.id, closedAt: null },
        select: { id: true, number: true, openedAt: true },
      })
      if (!aberto) {
        return NextResponse.json({ caixa: null, orders: [], totals: {} })
      }
      caixaId = aberto.id
      caixaNumber = aberto.number
      openedAt = aberto.openedAt
    } else if (caixaIdParam) {
      // caixa específico (histórico / outro usuário)
      const c = await prisma.dailyCashRegister.findUnique({
        where: { id: caixaIdParam },
        select: { id: true, number: true, openedAt: true },
      })
      if (!c) {
        return NextResponse.json({ caixa: null, orders: [], totals: {} })
      }
      caixaId = c.id
      caixaNumber = c.number
      openedAt = c.openedAt
    } else {
      return NextResponse.json({ caixa: null, orders: [], totals: {} })
    }

    // Montar filtros
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { cashRegisterId: caixaId }

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    if (q) {
      where.OR = [
        { id: { contains: q } },
        { customerName: { contains: q, mode: 'insensitive' } },
        {
          items: {
            some: { product: { name: { contains: q, mode: 'insensitive' } } },
          },
        },
      ]
    }

    // Buscar pedidos do caixa
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    })

    // Resumo por forma de pagamento
    const byMethod: Record<string, number> = {
      DINHEIRO: 0,
      PIX: 0,
      CREDITO: 0,
      DEBITO: 0,
    }
    let paidTotal = 0
    for (const o of orders) {
      for (const p of o.payments) {
        byMethod[p.method] = (byMethod[p.method] || 0) + p.value
        paidTotal += p.value
      }
    }

    return NextResponse.json({
      caixa: { id: caixaId, number: caixaNumber, openedAt },
      orders: orders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        total: o.total,
        items: o.items.map((it) => ({
          productName: it.product.name,
          quantity: it.quantity,
          price: it.product.price,
        })),
        payments: o.payments.map((p) => ({ method: p.method, value: p.value })),
        notes: o.notes,
      })),
      totals: {
        paid: paidTotal,
        byMethod,
      },
    })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('/api/contas GET error', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erro ao listar contas' },
      { status: 500 },
    )
  }
}
