import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const caixaIdParam = searchParams.get('caixaId')

    let caixaId: string | null = null
    let initialCash = 0

    if (caixaIdParam) {
      const c = await prisma.dailyCashRegister.findUnique({
        where: { id: caixaIdParam },
        select: { id: true, initialCash: true },
      })
      if (!c) return NextResponse.json({ error: 'Caixa nÃ£o encontrado' }, { status: 404 })
      caixaId = c.id
      initialCash = c.initialCash
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) return NextResponse.json({ error: 'NÃ£o autenticado' }, { status: 401 })
      const c = await prisma.dailyCashRegister.findFirst({
        where: { openedById: session.user.id, closedAt: null },
        select: { id: true, initialCash: true },
      })
      if (!c) return NextResponse.json({ error: 'Nenhum caixa aberto' }, { status: 400 })
      caixaId = c.id
      initialCash = c.initialCash
    }

    const pagamentos = await prisma.payment.findMany({
      where: { cashRegisterId: caixaId! },
      select: { value: true, method: true },
    })

    const byMethod: Record<'DINHEIRO'|'PIX'|'CREDITO'|'DEBITO', number> = {
      DINHEIRO: 0, PIX: 0, CREDITO: 0, DEBITO: 0,
    }
    let paid = 0
    for (const p of pagamentos) {
      byMethod[p.method as 'DINHEIRO'|'PIX'|'CREDITO'|'DEBITO'] = (byMethod[p.method as 'DINHEIRO'|'PIX'|'CREDITO'|'DEBITO'] || 0) + Number(p.value || 0)
      paid += Number(p.value || 0)
    }

    return NextResponse.json({
      caixaId,
      initialCash,
      totals: { paid, byMethod },
      theoreticalFinalCash: initialCash + paid,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Falha ao calcular resumo do caixa' }, { status: 500 })
  }
}


