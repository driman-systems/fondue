import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import FormUsuario from '@/components/FormUsuario'

type paramsProps = Promise<{id: string}>

export default async function EditarUsuarioPage({ params }: {params: paramsProps}) {

const {id} = await params

  const usuario = await prisma.user.findUnique({
    where: { id: id },
  })

  if (!usuario) return notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar Usuário</h1>
      <FormUsuario usuario={usuario} />
    </div>
  )
}
