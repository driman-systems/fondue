import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const pagamento = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        cashRegister: true,
      },
    })

    if (!pagamento) {
      return NextResponse.json({ message: 'Pagamento não encontrado' }, { status: 404 })
    }

    return NextResponse.json(pagamento)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar pagamento' }, { status: 500 })
  }
}
