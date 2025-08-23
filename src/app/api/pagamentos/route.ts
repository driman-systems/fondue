// GET /api/pagamentos
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const caixaId = searchParams.get('caixa')

    const whereClause = caixaId ? { cashRegisterId: caixaId } : {}

    const pagamentos = await prisma.payment.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            createdAt: true
          }
        },
        cashRegister: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(pagamentos)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar pagamentos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { value, method, orderId, cashRegisterId } = await req.json()

    const pagamento = await prisma.payment.create({
      data: {
        value,
        method,
        orderId,
        cashRegisterId,
      },
    })

    return NextResponse.json(pagamento)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}

