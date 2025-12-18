'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@prisma/client'

interface Props {
  usuario?: User
}

export default function FormUsuario({ usuario }: Props) {
  const [username, setUsername] = useState(usuario?.username || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(usuario?.role || 'user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isEdit = Boolean(usuario)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: Record<string, string> = {
      username,
      role,
    }

    // Apenas envia a senha se foi preenchida
    if (!isEdit || password.trim() !== '') {
      body.password = password
    }

    const res = await fetch(isEdit ? `/api/usuarios/${usuario?.id}` : '/api/usuarios', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/admin/usuarios')
    } else {
      const { error } = await res.json()
      setError(error || 'Erro ao salvar.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block font-medium">Usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="block font-medium">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? 'Deixe em branco para manter a atual' : ''}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={loading}
          required={!isEdit}
        />
      </div>

      <div>
        <label className="block font-medium">Tipo</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          disabled={loading}
        >
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-[#4B1E00] text-yellow-400 px-4 py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}
      </button>
    </form>
  )
}

