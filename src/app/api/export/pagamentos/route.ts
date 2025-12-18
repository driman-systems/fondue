import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toCSVRow(arr: (string|number|null|undefined)[]) {
  return arr.map((v) => {
    const s = v == null ? '' : String(v)
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }).join(';')
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const caixaId = searchParams.get('caixa')
    const where = caixaId ? { cashRegisterId: caixaId } : {}

    const pagamentos = await prisma.payment.findMany({
      where,
      include: {
        order: { select: { id: true, createdAt: true } },
        cashRegister: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const header = ['data', 'pedido', 'caixa', 'forma', 'valor']
    const rows = pagamentos.map((p) => [
      p.createdAt.toISOString(),
      p.order?.id ?? '',
      p.cashRegister?.number ?? '',
      p.method,
      String(p.value).replace('.', ','),
    ])

    const csv = [header, ...rows].map(toCSVRow).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pagamentos.csv"',
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  }
}

