// src/app/api/caixa/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caixa = await prisma.dailyCashRegister.findUnique({
      where: { id: params.id },
      include: {
        openedBy: true,
        closedBy: true,
        orders: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    })

    if (!caixa) {
      return NextResponse.json({ message: 'Caixa não encontrado' }, { status: 404 })
    }

    return NextResponse.json(caixa)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar caixa por ID' }, { status: 500 })
  }
}
