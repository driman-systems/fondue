import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // caixa aberto do usuário
  const caixa = await prisma.dailyCashRegister.findFirst({
    where: { openedById: session.user.id, closedAt: null },
    select: { id: true, initialCash: true },
  })
  if (!caixa) {
    return NextResponse.json({ error: 'Nenhum caixa aberto.' }, { status: 400 })
  }

  // soma pagamentos do caixa (se quiser considerar só DINHEIRO no finalCash, ajuste aqui)
  const sum = await prisma.payment.aggregate({
    where: { cashRegisterId: caixa.id },
    _sum: { value: true },
  })
  const totalPayments = Number(sum._sum.value ?? 0)

  const closed = await prisma.dailyCashRegister.update({
    where: { id: caixa.id },
    data: {
      closedAt: new Date(),
      finalCash: caixa.initialCash + totalPayments,
      closedById: session.user.id,
    },
    select: { id: true, finalCash: true, closedAt: true },
  })

  return NextResponse.json({ ok: true, caixa: closed })
}
