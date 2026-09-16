import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getPublicBusinessPage, type PublicBusinessPage } from '../lib/api'
import { formatPrice } from '../lib/format'

const TEMA_HEADER_CLASS: Record<string, string> = {
  padrao: 'bg-brand-600',
  escuro: 'bg-gray-900',
  colorido: 'bg-gradient-to-r from-pink-500 via-brand-500 to-amber-500',
}

export function PublicBusinessPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<PublicBusinessPage | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    getPublicBusinessPage(slug)
      .then(setPage)
      .catch((err) => setErro(err instanceof ApiError ? err.message : 'Página não encontrada.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-24 text-gray-500">Carregando…</div>

  if (erro || !page) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-gray-600">{erro ?? 'Página não encontrada.'}</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    )
  }

  const headerClass = TEMA_HEADER_CLASS[page.tema] ?? TEMA_HEADER_CLASS.padrao
  const servicosAtivos = page.services.filter((s) => s.ativo)

  return (
    <div>
      <div className={`${headerClass} px-4 py-16 text-center text-white`}>
        {page.foto_url && (
          <img
            src={page.foto_url}
            alt={page.nome_negocio}
            className="mx-auto mb-4 h-24 w-24 rounded-full border-4 border-white object-cover"
          />
        )}
        <h1 className="text-3xl font-bold">{page.nome_negocio}</h1>
        {page.bio && <p className="mx-auto mt-2 max-w-xl text-white/90">{page.bio}</p>}
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h2 className="text-lg font-semibold text-gray-900">Serviços</h2>
        {servicosAtivos.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">Nenhum serviço disponível no momento.</p>
        )}
        <ul className="mt-4 space-y-3">
          {servicosAtivos.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{s.nome}</p>
                <p className="text-sm text-gray-500">
                  {s.duracao_minutos} min · {formatPrice(s.preco)}
                </p>
              </div>
              <Link
                to={`/p/${page.slug}/agendar/${s.id}`}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Agendar
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
