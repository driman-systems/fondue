import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0); return x
}
function daysAgo(n: number) {
  const x = new Date(); x.setDate(x.getDate() - n); x.setHours(0,0,0,0); return x
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/')

  // Período: hoje e últimos 7 dias
  const from7 = daysAgo(6)
  const today0 = startOfDay()

  // KPIs
  const [ordersToday, paymentsToday] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today0 } },
      select: { id: true, total: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: today0 } },
      select: { value: true, method: true },
    }),
  ])

  const paidToday = paymentsToday.reduce((a, p) => a + Number(p.value || 0), 0)
  const ordersCountToday = ordersToday.length
  const avgTicketToday = ordersCountToday ? paidToday / ordersCountToday : 0

  // Vendas últimos 7 dias (por dia via payments)
  const payments7 = await prisma.payment.findMany({
    where: { createdAt: { gte: from7 } },
    select: { value: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  const byDay: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = daysAgo(6 - i)
    const key = d.toISOString().slice(0, 10)
    byDay[key] = 0
  }
  for (const p of payments7) {
    const key = new Date(p.createdAt).toISOString().slice(0, 10)
    if (!(key in byDay)) byDay[key] = 0
    byDay[key] += Number(p.value || 0)
  }
  const chartData = Object.entries(byDay).map(([date, total]) => ({ date, total }))
  const maxBar = Math.max(1, ...chartData.map(d => d.total))

  // Top produtos (últimos 7 dias)
  const items7 = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: from7 } } },
    select: { quantity: true, product: { select: { id: true, name: true, price: true } } },
  })
  const topMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const it of items7) {
    const id = it.product.id
    const prev = topMap.get(id) || { name: it.product.name, qty: 0, revenue: 0 }
    prev.qty += it.quantity
    prev.revenue += it.quantity * Number(it.product.price || 0)
    topMap.set(id, prev)
  }
  const topProducts = Array.from(topMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/usuarios" className="rounded-md border px-3 py-2 bg-white hover:bg-zinc-50">Usuários</Link>
          <Link href="/admin/produtos" className="rounded-md border px-3 py-2 bg-white hover:bg-zinc-50">Produtos</Link>
          <Link href="/admin/caixa" className="rounded-md border px-3 py-2 bg-white hover:bg-zinc-50">Caixa</Link>
          <Link href="/admin/relatorios" className="rounded-md border px-3 py-2 bg-white hover:bg-zinc-50">Relatórios</Link>
        </div>
      </div>

      {/* KPIs de hoje */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500">Faturamento (hoje)</div>
          <div className="text-2xl font-semibold">{fmt(paidToday)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500">Pedidos (hoje)</div>
          <div className="text-2xl font-semibold">{ordersCountToday}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500">Ticket médio</div>
          <div className="text-2xl font-semibold">{fmt(avgTicketToday)}</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500">Últimos 7 dias</div>
          <div className="flex items-end gap-1 h-10 mt-1">
            {chartData.map((d) => (
              <div key={d.date} className="flex-1">
                <div
                  title={`${d.date}: ${fmt(d.total)}`}
                  className="w-full bg-yellow-400 rounded"
                  style={{ height: `${Math.max(4, Math.round((d.total / maxBar) * 36))}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produtos */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 font-semibold">Top produtos (7 dias)</div>
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr className="text-left">
                <th className="py-1">Produto</th>
                <th className="py-1">Qtd</th>
                <th className="py-1">Receita</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td className="py-2 text-zinc-500" colSpan={3}>Sem dados.</td></tr>
              ) : (
                topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-zinc-100">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.qty}</td>
                    <td className="py-2">{fmt(p.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Atalhos rápidos */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 font-semibold">Atalhos</div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/contas" className="rounded-lg border border-zinc-300 p-3 hover:bg-zinc-50">Contas do caixa</Link>
            <Link href="/admin/produtos/novo" className="rounded-lg border border-zinc-300 p-3 hover:bg-zinc-50">Novo produto</Link>
            <Link href="/admin/usuarios" className="rounded-lg border border-zinc-300 p-3 hover:bg-zinc-50">Gerenciar usuários</Link>
            <Link href="/admin/relatorios" className="rounded-lg border border-zinc-300 p-3 hover:bg-zinc-50">Relatórios</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
