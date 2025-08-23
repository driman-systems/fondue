import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Painel Administrativo</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <a href="/admin/usuarios" className="block p-4 bg-white shadow rounded hover:bg-yellow-100 transition">Usuários</a>
        <a href="/admin/produtos" className="block p-4 bg-white shadow rounded hover:bg-yellow-100 transition">Produtos</a>
        <a href="/admin/caixa" className="block p-4 bg-white shadow rounded hover:bg-yellow-100 transition">Caixa</a>
        <a href="/admin/relatorios" className="block p-4 bg-white shadow rounded hover:bg-yellow-100 transition">Relatórios</a>
      </div>
    </main>
  )
}
