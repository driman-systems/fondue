import FormUsuario from '@/components/FormUsuario'

export default function NovoUsuarioPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Cadastrar Novo Usuário</h1>
      <FormUsuario />
    </div>
  )
}


