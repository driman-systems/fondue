import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Status do caixa do usuário logado
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ isOpen: false, caixaId: null, caixaNumber: null })
  }

  const c = await prisma.dailyCashRegister.findFirst({
    where: { openedById: session.user.id, closedAt: null },
    select: { id: true, number: true },
  })

  return NextResponse.json({
    isOpen: !!c,
    caixaId: c?.id ?? null,
    caixaNumber: c?.number ?? null,
  })
}

// Abrir um novo caixa (por usuário)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const initialCash = Number(body?.initialCash ?? 0)

    // já existe caixa aberto para este usuário?
    const aberto = await prisma.dailyCashRegister.findFirst({
      where: { openedById: session.user.id, closedAt: null },
      select: { id: true },
    })
    if (aberto) {
      return NextResponse.json(
        { error: 'Você já possui um caixa aberto.' },
        { status: 400 }
      )
    }

    // gera numeração do caixa por usuário (último + 1)
    const last = await prisma.dailyCashRegister.findFirst({
      where: { openedById: session.user.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const nextNumber = (last?.number ?? 0) + 1

    const novoCaixa = await prisma.dailyCashRegister.create({
      data: {
        number: nextNumber,
        initialCash,
        openedById: session.user.id!,
      },
      select: { id: true, number: true, openedAt: true },
    })

    return NextResponse.json({ ok: true, caixa: novoCaixa })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: error?.message ?? 'Falha ao abrir caixa' },
      { status: 500 }
    )
  }
}
