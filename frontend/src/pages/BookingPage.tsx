import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  createPublicAppointment,
  getAvailableSlots,
  getPublicBusinessPage,
  type PublicBusinessPage,
  type Service,
} from '../lib/api'
import { formatDate, formatPrice, formatTime, todayISO } from '../lib/format'

export function BookingPage() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>()
  const navigate = useNavigate()

  const [page, setPage] = useState<PublicBusinessPage | null>(null)
  const [erroPagina, setErroPagina] = useState<string | null>(null)

  const [data, setData] = useState(todayISO())
  const [horarios, setHorarios] = useState<string[]>([])
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null)
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroAgendamento, setErroAgendamento] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    getPublicBusinessPage(slug)
      .then(setPage)
      .catch((err) => setErroPagina(err instanceof ApiError ? err.message : 'Página não encontrada.'))
  }, [slug])

  useEffect(() => {
    if (!slug || !serviceId) return
    setHorarioSelecionado(null)
    setCarregandoHorarios(true)
    getAvailableSlots(slug, Number(serviceId), data)
      .then(setHorarios)
      .catch(() => setHorarios([]))
      .finally(() => setCarregandoHorarios(false))
  }, [slug, serviceId, data])

  if (erroPagina) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-gray-600">{erroPagina}</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    )
  }

  if (!page) return <div className="flex justify-center py-24 text-gray-500">Carregando…</div>

  const service: Service | undefined = page.services.find((s) => s.id === Number(serviceId))

  if (!service) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-gray-600">Serviço não encontrado.</p>
        <Link to={`/p/${slug}`} className="mt-4 inline-block text-brand-700 hover:underline">
          Voltar para {page.nome_negocio}
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!slug || !serviceId || !horarioSelecionado) return
    setErroAgendamento(null)
    setEnviando(true)
    try {
      const appointment = await createPublicAppointment(slug, {
        service_id: Number(serviceId),
        data,
        hora_inicio: horarioSelecionado,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        cliente_email: clienteEmail,
      })
      navigate(`/p/${slug}/confirmado`, {
        state: { appointment, businessName: page!.nome_negocio, serviceName: service!.nome },
      })
    } catch (err) {
      setErroAgendamento(
        err instanceof ApiError ? err.message : 'Não foi possível concluir o agendamento.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link to={`/p/${slug}`} className="text-sm text-brand-700 hover:underline">
        ← {page.nome_negocio}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900">Agendar {service.nome}</h1>
      <p className="text-sm text-gray-500">
        {service.duracao_minutos} min · {formatPrice(service.preco)}
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700">Escolha a data</label>
        <input
          type="date"
          min={todayISO()}
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Horários livres em {formatDate(data)}
        </label>
        {carregandoHorarios && <p className="mt-2 text-sm text-gray-500">Carregando horários…</p>}
        {!carregandoHorarios && horarios.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">Nenhum horário livre nesta data.</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {horarios.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorarioSelecionado(h)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                horarioSelecionado === h
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:border-brand-400'
              }`}
            >
              {formatTime(h)}
            </button>
          ))}
        </div>
      </div>

      {horarioSelecionado && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Seu nome</label>
            <input
              required
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              required
              value={clienteTelefone}
              onChange={(e) => setClienteTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              required
              type="email"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            />
          </div>
          {erroAgendamento && <p className="text-sm text-red-600">{erroAgendamento}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {enviando ? 'Confirmando…' : `Confirmar agendamento às ${formatTime(horarioSelecionado)}`}
          </button>
        </form>
      )}
    </div>
  )
}
