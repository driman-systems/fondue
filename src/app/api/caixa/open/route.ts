import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0); return x
}
function endOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(23,59,59,999); return x
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // já existe caixa aberto?
  const already = await prisma.dailyCashRegister.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: 'desc' },
    select: { id: true, number: true },
  })
  if (already) {
    return NextResponse.json(
      { error: 'Já existe um caixa aberto', caixaId: already.id, caixaNumber: already.number },
      { status: 409 }
    )
  }

  // valor inicial (por enquanto opcional; se não vier, 0)
  let initialCash = 0
  try {
    const body = await req.json().catch(() => null)
    if (body?.initialCash != null) initialCash = Number(body.initialCash) || 0
  } catch {}

  // próximo número do dia
  const countToday = await prisma.dailyCashRegister.count({
    where: { openedAt: { gte: startOfDay(), lte: endOfDay() } },
  })
  const nextNumber = countToday + 1

  const caixa = await prisma.dailyCashRegister.create({
    data: {
      number: nextNumber,
      initialCash,
      openedAt: new Date(),
      openedById: session.user.id as string,
    },
    select: { id: true, number: true },
  })

  return NextResponse.json({ ok: true, caixaId: caixa.id, caixaNumber: caixa.number })
}
