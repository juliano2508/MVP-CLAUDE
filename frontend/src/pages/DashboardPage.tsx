import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { SubscriptionBanner } from '../components/SubscriptionBanner'
import {
  ApiError,
  cancelAppointment,
  createBlockedSlot,
  deleteBlockedSlot,
  listAppointments,
  listBlockedSlots,
  listServices,
  rescheduleAppointment,
  type Appointment,
  type BlockedSlot,
  type Service,
  type StatusAppointment,
} from '../lib/api'
import { formatDate, formatTime, todayISO } from '../lib/format'

type Filtro = 'proximos' | 'historico' | 'todos'

const STATUS_LABEL: Record<StatusAppointment, string> = {
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
}

const STATUS_CLASS: Record<StatusAppointment, string> = {
  confirmado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  concluido: 'bg-gray-100 text-gray-700',
}

export function DashboardPage() {
  const { token } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Painel de agendamentos</h1>
      <div className="mt-6">
        <SubscriptionBanner />
      </div>
      <AppointmentsSection token={token!} />
      <BlockedSlotsSection token={token!} />
    </div>
  )
}

function AppointmentsSection({ token }: { token: string }) {
  const [filtro, setFiltro] = useState<Filtro>('proximos')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const serviceNames = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.nome])),
    [services],
  )

  useEffect(() => {
    listServices(token).then(setServices)
  }, [token])

  async function carregar() {
    setLoading(true)
    setErro(null)
    try {
      const hoje = todayISO()
      const filtros =
        filtro === 'proximos' ? { de: hoje } : filtro === 'historico' ? { ate: hoje } : {}
      const data = await listAppointments(token, filtros)
      setAppointments(data)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar os agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, token])

  async function handleCancel(appointment: Appointment) {
    await cancelAppointment(token, appointment.id)
    carregar()
  }

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Agendamentos</h2>
        <div className="flex gap-1 rounded-md bg-gray-100 p-1 text-sm">
          {(['proximos', 'historico', 'todos'] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-md px-3 py-1 ${
                filtro === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {f === 'proximos' ? 'Próximos' : f === 'historico' ? 'Histórico' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
      {loading && <p className="mt-4 text-sm text-gray-500">Carregando…</p>}
      {!loading && appointments.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Nenhum agendamento encontrado.</p>
      )}

      <ul className="mt-4 divide-y divide-gray-100">
        {appointments.map((a) => (
          <AppointmentRow
            key={a.id}
            appointment={a}
            serviceName={serviceNames[a.service_id] ?? `Serviço #${a.service_id}`}
            token={token}
            onCancel={() => handleCancel(a)}
            onRescheduled={carregar}
          />
        ))}
      </ul>
    </section>
  )
}

function AppointmentRow({
  appointment,
  serviceName,
  token,
  onCancel,
  onRescheduled,
}: {
  appointment: Appointment
  serviceName: string
  token: string
  onCancel: () => void
  onRescheduled: () => void
}) {
  const [remarcando, setRemarcando] = useState(false)
  const [novaData, setNovaData] = useState(appointment.data)
  const [novaHora, setNovaHora] = useState(formatTime(appointment.hora_inicio))
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleReschedule(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await rescheduleAppointment(token, appointment.id, {
        data: novaData,
        hora_inicio: `${novaHora}:00`,
      })
      setRemarcando(false)
      onRescheduled()
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível remarcar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">
            {formatDate(appointment.data)} às {formatTime(appointment.hora_inicio)} — {serviceName}
          </p>
          <p className="text-sm text-gray-500">
            {appointment.cliente_nome} · {appointment.cliente_telefone} · {appointment.cliente_email}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[appointment.status]}`}>
          {STATUS_LABEL[appointment.status]}
        </span>
      </div>

      {appointment.status === 'confirmado' && (
        <div className="mt-2 flex gap-2 text-sm">
          <button
            onClick={() => setRemarcando((v) => !v)}
            className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
          >
            Remarcar
          </button>
          <button
            onClick={onCancel}
            className="rounded-md bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"
          >
            Cancelar
          </button>
        </div>
      )}

      {remarcando && (
        <form onSubmit={handleReschedule} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Nova data</label>
            <input
              required
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Novo horário</label>
            <input
              required
              type="time"
              value={novaHora}
              onChange={(e) => setNovaHora(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {enviando ? 'Salvando…' : 'Confirmar nova data'}
          </button>
          {erro && <p className="w-full text-sm text-red-600">{erro}</p>}
        </form>
      )}
    </li>
  )
}

function BlockedSlotsSection({ token }: { token: string }) {
  const [slots, setSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [data, setData] = useState(todayISO())
  const [horaInicio, setHoraInicio] = useState('12:00')
  const [horaFim, setHoraFim] = useState('13:00')
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    listBlockedSlots(token)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [token])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setErro(null)
    try {
      const created = await createBlockedSlot(token, {
        data,
        hora_inicio: `${horaInicio}:00`,
        hora_fim: `${horaFim}:00`,
        motivo: motivo || undefined,
      })
      setSlots((prev) => [...prev, created])
      setMotivo('')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível bloquear o horário.')
    }
  }

  async function handleDelete(slot: BlockedSlot) {
    await deleteBlockedSlot(token, slot.id)
    setSlots((prev) => prev.filter((s) => s.id !== slot.id))
  }

  return (
    <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-gray-900">Bloqueios manuais</h2>
      <p className="mt-1 text-sm text-gray-500">
        Use para folgas ou compromissos — o horário some da agenda pública.
      </p>

      {loading && <p className="mt-4 text-sm text-gray-500">Carregando…</p>}
      {!loading && slots.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Nenhum bloqueio cadastrado.</p>
      )}
      <ul className="mt-4 divide-y divide-gray-100">
        {slots.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {formatDate(s.data)} · {formatTime(s.hora_inicio)} às {formatTime(s.hora_fim)}
              {s.motivo ? ` — ${s.motivo}` : ''}
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
          <label className="block text-xs font-medium text-gray-700">Data</label>
          <input
            required
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
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
        <div>
          <label className="block text-xs font-medium text-gray-700">Motivo (opcional)</label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Folga"
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Bloquear
        </button>
      </form>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </section>
  )
}
