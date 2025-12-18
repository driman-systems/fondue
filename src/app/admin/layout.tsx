import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sair from '@/components/sair'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4B1E00] text-yellow-400 p-6 space-y-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-8">Admin</h2>
        <nav className="flex flex-col gap-3">
          <Link href="/admin" className="hover:text-white transition">Dashboard</Link>
          <Link href="/admin/usuarios" className="hover:text-white transition">Usuários</Link>
          <Link href="/admin/produtos" className="hover:text-white transition">Produtos</Link>
          <Link href="/admin/caixa" className="hover:text-white transition">Caixa</Link>
          <Link href="/admin/relatorios" className="hover:text-white transition">Relatórios</Link>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-gray-100">
        {/* Header */}
        <header className="flex items-center justify-between bg-white shadow px-6 py-4">
          <span className="font-bold text-lg">Painel Administrativo</span>
            <Sair />
        </header>

        {/* Main content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

