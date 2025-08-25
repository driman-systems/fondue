// src/app/api/caixa/status/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ isOpen: false })

  const caixa = await prisma.dailyCashRegister.findFirst({
    where: { openedById: session.user.id, closedAt: null },
    select: { id: true, number: true },
    orderBy: { openedAt: 'desc' },
  })

  return NextResponse.json({
    isOpen: !!caixa,
    caixaNumber: caixa?.number ?? null,
  })
}
