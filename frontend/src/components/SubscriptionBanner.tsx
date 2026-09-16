import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getBillingStatus, type BillingStatus } from '../lib/api'

export function SubscriptionBanner() {
  const { token } = useAuth()
  const [status, setStatus] = useState<BillingStatus | null>(null)

  useEffect(() => {
    if (!token) return
    getBillingStatus(token)
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [token])

  if (!status) return null

  if (!status.assinatura_ativa) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        <span>Sua assinatura está inativa — sua página pública está indisponível para clientes.</span>
        <Link to="/painel/assinatura" className="font-medium underline">
          Assinar agora
        </Link>
      </div>
    )
  }

  if (status.status_assinatura === 'trial' && status.dias_restantes_trial !== null && status.dias_restantes_trial <= 5) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <span>
          Faltam {status.dias_restantes_trial} dia(s) do seu período de teste grátis.
        </span>
        <Link to="/painel/assinatura" className="font-medium underline">
          Assinar agora
        </Link>
      </div>
    )
  }

  return null
}
