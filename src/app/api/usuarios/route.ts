import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ message: 'Usuário já existe.' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
    })

    return NextResponse.json({ message: 'Usuário criado com sucesso.' }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
