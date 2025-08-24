import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Abrir um novo caixa
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const initialCash = Number(body?.initialCash ?? 0)

    // já existe caixa aberto?
    const aberto = await prisma.dailyCashRegister.findFirst({
      where: { closedAt: null },
      select: { id: true },
    })
    if (aberto) {
      return NextResponse.json(
        { error: 'Já existe um caixa aberto.' },
        { status: 400 }
      )
    }

    // pega o maior número já usado e incrementa
    const last = await prisma.dailyCashRegister.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true },
    })
    const nextNumber = (last?.number ?? 0) + 1

    const novoCaixa = await prisma.dailyCashRegister.create({
      data: {
        number: nextNumber,                 // ✅ obrigatório no schema
        initialCash,                        // ✅ garante número
        openedById: session.user.id!,       // ✅ usuário que abriu
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
