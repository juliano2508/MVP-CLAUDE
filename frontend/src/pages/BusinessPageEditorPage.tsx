import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  ApiError,
  DIAS_SEMANA,
  createAvailability,
  createBusinessPage,
  createService,
  deleteAvailability,
  deleteService,
  getBusinessPage,
  listAvailability,
  listServices,
  updateBusinessPage,
  updateService,
  type AvailabilitySlot,
  type BusinessPage,
  type Service,
} from '../lib/api'
import { formatPrice, formatTime } from '../lib/format'

const TEMAS = [
  { valor: 'padrao', rotulo: 'Padrão (roxo)' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'colorido', rotulo: 'Colorido' },
]

export function BusinessPageEditorPage() {
  const { token } = useAuth()
  const [page, setPage] = useState<BusinessPage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getBusinessPage(token)
      .then(setPage)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setPage(null)
        }
      })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="flex justify-center py-24 text-gray-500">Carregando…</div>
  }

  if (!page) {
    return <CreateBusinessPageForm token={token!} onCreated={setPage} />
  }

  return <BusinessPageEditor token={token!} page={page} onPageUpdated={setPage} />
}

function CreateBusinessPageForm({
  token,
  onCreated,
}: {
  token: string
  onCreated: (page: BusinessPage) => void
}) {
  const [nomeNegocio, setNomeNegocio] = useState('')
  const [bio, setBio] = useState('')
  const [tema, setTema] = useState('padrao')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const created = await createBusinessPage(token, { nome_negocio: nomeNegocio, bio, tema })
      onCreated(created)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar sua página.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Vamos criar sua página</h1>
      <p className="mt-1 text-sm text-gray-600">
        Esses dados aparecem para quem for agendar com você.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome do negócio</label>
          <input
            required
            value={nomeNegocio}
            onChange={(e) => setNomeNegocio(e.target.value)}
            placeholder="Ex: Manu Cartomancia"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bio curta</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Conte em poucas linhas o que você faz"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tema</label>
          <select
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {TEMAS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {enviando ? 'Criando…' : 'Criar página'}
        </button>
      </form>
    </div>
  )
}

function BusinessPageEditor({
  token,
  page,
  onPageUpdated,
}: {
  token: string
  page: BusinessPage
  onPageUpdated: (page: BusinessPage) => void
}) {
  const publicUrl = `${window.location.origin}/p/${page.slug}`

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Minha página</h1>

      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-gray-600">Link público:</span>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
          {publicUrl}
        </a>
      </div>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Informações</h2>
        <BusinessInfoForm token={token} page={page} onPageUpdated={onPageUpdated} />
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Serviços</h2>
        <ServicesSection token={token} />
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">Disponibilidade semanal</h2>
        <AvailabilitySection token={token} />
      </section>

      <Link to="/painel" className="mt-8 inline-block text-sm text-brand-700 hover:underline">
        Ir para o painel de agendamentos →
      </Link>
    </div>
  )
}

function BusinessInfoForm({
  token,
  page,
  onPageUpdated,
}: {
  token: string
  page: BusinessPage
  onPageUpdated: (page: BusinessPage) => void
}) {
  const [nomeNegocio, setNomeNegocio] = useState(page.nome_negocio)
  const [bio, setBio] = useState(page.bio ?? '')
  const [tema, setTema] = useState(page.tema)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setSucesso(false)
    setSalvando(true)
    try {
      const updated = await updateBusinessPage(token, { nome_negocio: nomeNegocio, bio, tema })
      onPageUpdated(updated)
      setSucesso(true)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome do negócio</label>
        <input
          required
          value={nomeNegocio}
          onChange={(e) => setNomeNegocio(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio curta</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tema</label>
        <select
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        >
          {TEMAS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {sucesso && <p className="text-sm text-green-600">Salvo com sucesso.</p>}
      <button
        type="submit"
        disabled={salvando}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}

function ServicesSection({ token }: { token: string }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [duracao, setDuracao] = useState('30')
  const [preco, setPreco] = useState('')

  useEffect(() => {
    listServices(token)
      .then(setServices)
      .finally(() => setLoading(false))
  }, [token])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    try {
      const created = await createService(token, {
        nome,
        duracao_minutos: Number(duracao),
        preco: Number(preco),
      })
      setServices((prev) => [...prev, created])
      setNome('')
      setDuracao('30')
      setPreco('')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível adicionar o serviço.')
    }
  }

  async function handleToggleAtivo(service: Service) {
    const updated = await updateService(token, service.id, { ativo: !service.ativo })
    setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)))
  }

  async function handleDelete(service: Service) {
    await deleteService(token, service.id)
    setServices((prev) => prev.filter((s) => s.id !== service.id))
  }

  if (loading) return <p className="mt-4 text-sm text-gray-500">Carregando…</p>

  return (
    <div className="mt-4">
      {services.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum serviço cadastrado ainda.</p>
      )}
      <ul className="divide-y divide-gray-100">
        {services.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className={`font-medium ${s.ativo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                {s.nome}
              </p>
              <p className="text-sm text-gray-500">
                {s.duracao_minutos} min · {formatPrice(s.preco)}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => handleToggleAtivo(s)}
                className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
              >
                {s.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="rounded-md bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"
              >
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Serviço</label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Consulta de Tarô"
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Duração (min)</label>
          <input
            required
            type="number"
            min={1}
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Preço (R$)</label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Adicionar
        </button>
      </form>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  )
}

function AvailabilitySection({ token }: { token: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [diaSemana, setDiaSemana] = useState('0')
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFim, setHoraFim] = useState('18:00')

  useEffect(() => {
    listAvailability(token)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [token])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    try {
      const created = await createAvailability(token, {
        dia_semana: Number(diaSemana),
        hora_inicio: `${horaInicio}:00`,
        hora_fim: `${horaFim}:00`,
      })
      setSlots((prev) =>
        [...prev, created].sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio)),
      )
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível adicionar a disponibilidade.')
    }
  }

  async function handleDelete(slot: AvailabilitySlot) {
    await deleteAvailability(token, slot.id)
    setSlots((prev) => prev.filter((s) => s.id !== slot.id))
  }

  if (loading) return <p className="mt-4 text-sm text-gray-500">Carregando…</p>

  return (
    <div className="mt-4">
      {slots.length === 0 && (
        <p className="text-sm text-gray-500">Nenhuma disponibilidade cadastrada ainda.</p>
      )}
      <ul className="divide-y divide-gray-100">
        {slots.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {DIAS_SEMANA[s.dia_semana]} · {formatTime(s.hora_inicio)} às {formatTime(s.hora_fim)}
            </span>
            <button
              onClick={() => handleDelete(s)}
              className="rounded-md bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700">Dia da semana</label>
          <select
            value={diaSemana}
            onChange={(e) => setDiaSemana(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            {DIAS_SEMANA.map((dia, i) => (
              <option key={dia} value={i}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Das</label>
          <input
            required
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Até</label>
          <input
            required
            type="time"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Adicionar
        </button>
      </form>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  )
}
