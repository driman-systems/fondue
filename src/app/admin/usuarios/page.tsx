import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import UsuarioAcoes from '@/components/UsuarioAcoes'

export default async function UsuariosPage() {
  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Link href="/admin/usuarios/novo" className="bg-[#4B1E00] text-yellow-400 px-4 py-2 rounded shadow hover:opacity-90">
          Novo Usuário
        </Link>
      </div>

      <table className="min-w-full bg-white shadow-md rounded">
        <thead className="bg-gray-200 text-gray-700 text-left">
          <tr>
            <th className="p-4">Usuário</th>
            <th className="p-4">Tipo</th>
            <th className="p-4">Criado em</th>
            <th className="p-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-4">{user.username}</td>
              <td className="p-4 capitalize">{user.role}</td>
              <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="p-4 text-center">
                <UsuarioAcoes id={user.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

