import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET /api/usuarios/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 })
  return NextResponse.json(user)
}

// PUT /api/usuarios/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const { username, password, role } = await req.json()

    if (!username || !role) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
    }

    const dataToUpdate: {
      username: string
      role: string
      password?: string
    } = { username, role }

    if (password?.trim()) {
      dataToUpdate.password = await hash(password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    })

    return NextResponse.json({ message: 'Usuário atualizado com sucesso.' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao atualizar usuário.' }, { status: 500 })
  }
}

// DELETE /api/usuarios/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: 'Usuário excluído com sucesso.' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao excluir usuário.' }, { status: 500 })
  }
}

