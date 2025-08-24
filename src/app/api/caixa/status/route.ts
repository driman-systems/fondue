import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' // ajuste o path se for diferente

export const revalidate = 0

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ isOpen: false, caixaId: null, caixaNumber: null })
  }

  const caixa = await prisma.dailyCashRegister.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: 'desc' },
    select: { id: true, number: true },
  })

  return NextResponse.json({
    isOpen: !!caixa,
    caixaId: caixa?.id ?? null,
    caixaNumber: caixa?.number ?? null,
  })
}
