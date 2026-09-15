import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  ApiError,
  cancelSubscription,
  createCheckoutSession,
  getBillingStatus,
  type BillingStatus,
} from '../lib/api'
import { formatDate } from '../lib/format'

const STATUS_LABEL: Record<BillingStatus['status_assinatura'], string> = {
  trial: 'Período de teste',
  ativa: 'Assinatura ativa',
  expirada: 'Assinatura expirada',
  cancelada: 'Assinatura cancelada',
}

export function BillingPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)

  const [sucesso] = useState(() => searchParams.get('sucesso') === '1')
  const [cancelado] = useState(() => searchParams.get('cancelado') === '1')
  const [modoDemo] = useState(() => searchParams.get('modo') === 'demo')

  async function carregar() {
    setCarregando(true)
    try {
      const data = await getBillingStatus(token!)
      setStatus(data)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível carregar a assinatura.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (sucesso || cancelado) {
      const next = new URLSearchParams(searchParams)
      next.delete('sucesso')
      next.delete('cancelado')
      next.delete('modo')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAssinar() {
    setErro(null)
    setProcessando(true)
    try {
      const { checkout_url } = await createCheckoutSession(token!)
      window.location.href = checkout_url
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível iniciar a assinatura.')
      setProcessando(false)
    }
  }

  async function handleCancelar() {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    setErro(null)
    setProcessando(true)
    try {
      const updated = await cancelSubscription(token!)
      setStatus(updated)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível cancelar a assinatura.')
    } finally {
      setProcessando(false)
    }
  }

  if (carregando) {
    return <div className="flex justify-center py-24 text-gray-500">Carregando…</div>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Assinatura</h1>

      {sucesso && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Assinatura ativada com sucesso!{modoDemo ? ' (modo demonstração)' : ''}
        </p>
      )}
      {cancelado && (
        <p className="mt-4 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-600">
          Você voltou sem concluir a assinatura.
        </p>
      )}
      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      {status && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{STATUS_LABEL[status.status_assinatura]}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                status.assinatura_ativa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {status.assinatura_ativa ? 'Página pública ativa' : 'Página pública indisponível'}
            </span>
          </div>

          {status.status_assinatura === 'trial' && status.dias_restantes_trial !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {status.dias_restantes_trial > 0
                ? `Faltam ${status.dias_restantes_trial} dia(s) de teste grátis.`
                : 'Seu período de teste terminou.'}
              {status.trial_fim && ` Termina em ${formatDate(status.trial_fim.slice(0, 10))}.`}
            </p>
          )}

          {!status.assinatura_ativa && (
            <p className="mt-2 text-sm text-red-600">
              Sua página pública está indisponível para clientes até você assinar.
            </p>
          )}

          <div className="mt-4 flex gap-3">
            {status.status_assinatura !== 'ativa' && (
              <button
                onClick={handleAssinar}
                disabled={processando}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {processando ? 'Processando…' : 'Assinar agora — R$ 39,90/mês'}
              </button>
            )}
            {status.status_assinatura === 'ativa' && (
              <button
                onClick={handleCancelar}
                disabled={processando}
                className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {processando ? 'Processando…' : 'Cancelar assinatura'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
