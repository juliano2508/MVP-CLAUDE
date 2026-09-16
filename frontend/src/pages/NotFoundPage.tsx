import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Página não encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-brand-700 hover:underline">
        Voltar para a página inicial
      </Link>
    </div>
  )
}
