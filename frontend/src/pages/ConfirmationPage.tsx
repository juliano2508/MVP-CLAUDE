import { Link, useLocation, useParams } from 'react-router-dom'
import type { Appointment } from '../lib/api'
import { formatDate, formatTime } from '../lib/format'

interface ConfirmationState {
  appointment: Appointment
  businessName: string
  serviceName: string
}

export function ConfirmationPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const state = location.state as ConfirmationState | null

  if (!state) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-gray-600">Nenhum agendamento recente para mostrar.</p>
        <Link to={`/p/${slug}`} className="mt-4 inline-block text-brand-700 hover:underline">
          Voltar para a página do profissional
        </Link>
      </div>
    )
  }

  const { appointment, businessName, serviceName } = state

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Agendamento confirmado!</h1>
      <p className="mt-2 text-gray-600">
        Você recebeu (ou receberá em breve) um email de confirmação em{' '}
        <strong>{appointment.cliente_email}</strong>.
      </p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-left text-sm">
        <p>
          <span className="text-gray-500">Negócio: </span>
          {businessName}
        </p>
        <p className="mt-1">
          <span className="text-gray-500">Serviço: </span>
          {serviceName}
        </p>
        <p className="mt-1">
          <span className="text-gray-500">Data: </span>
          {formatDate(appointment.data)}
        </p>
        <p className="mt-1">
          <span className="text-gray-500">Horário: </span>
          {formatTime(appointment.hora_inicio)}
        </p>
      </div>

      <Link to={`/p/${slug}`} className="mt-6 inline-block text-brand-700 hover:underline">
        Voltar para a página do profissional
      </Link>
    </div>
  )
}
