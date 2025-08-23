'use client'

import { FiEdit, FiTrash } from 'react-icons/fi'
import Link from 'next/link'

interface UsuarioAcoesProps {
  id: string
}

export default function UsuarioAcoes({ id }: UsuarioAcoesProps) {
  const excluir = async () => {
    const confirm = window.confirm('Deseja realmente excluir este usuário?')
    if (!confirm) return

    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    location.reload()
  }

  return (
    <div className="flex justify-center gap-4">
      <Link href={`/admin/usuarios/${id}/editar`} title="Editar">
        <FiEdit className="text-blue-600 hover:text-blue-800 cursor-pointer text-lg" />
      </Link>
      <button onClick={excluir} title="Excluir">
        <FiTrash className="text-red-600 hover:text-red-800 cursor-pointer text-lg" />
      </button>
    </div>
  )
}
