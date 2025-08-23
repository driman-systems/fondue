import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Obter o caixa aberto atualmente
export async function GET() {
  try {
    const caixaAberto = await prisma.dailyCashRegister.findFirst({
      where: { closedAt: null },
      include: {
        openedBy: true,
        closedBy: true,
        orders: true
      },
      orderBy: { openedAt: 'desc' },
    })

    return NextResponse.json(caixaAberto)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao buscar caixa aberto' }, { status: 500 })
  }
}

// Abrir um novo caixa
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { initialCash } = await req.json()

    const caixaAberto = await prisma.dailyCashRegister.findFirst({ where: { closedAt: null } })
    if (caixaAberto) {
      return NextResponse.json({ message: 'Já existe um caixa aberto.' }, { status: 400 })
    }

    const novoCaixa = await prisma.dailyCashRegister.create({
      data: {
        initialCash,
        openedById: session.user.id!,
      },
    })

    return NextResponse.json(novoCaixa)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao abrir caixa' }, { status: 500 })
  }
}

// Fechar caixa atual
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { finalCash } = await req.json()

    const caixaAberto = await prisma.dailyCashRegister.findFirst({ where: { closedAt: null } })
    if (!caixaAberto) {
      return NextResponse.json({ message: 'Nenhum caixa aberto encontrado.' }, { status: 400 })
    }

    const caixaFechado = await prisma.dailyCashRegister.update({
      where: { id: caixaAberto.id },
      data: {
        closedAt: new Date(),
        finalCash,
        closedById: session.user.id,
      },
    })

    return NextResponse.json(caixaFechado)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao fechar caixa' }, { status: 500 })
  }
}
