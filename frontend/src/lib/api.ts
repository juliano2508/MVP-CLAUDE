const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body && !(rest.body instanceof URLSearchParams)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    let message = `Erro ${response.status}`
    try {
      const data = await response.json()
      if (typeof data.detail === 'string') message = data.detail
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// ---- Types ----

export type Plano = 'free' | 'pago'
export type StatusAssinatura = 'trial' | 'ativa' | 'expirada' | 'cancelada'
export type StatusAppointment = 'confirmado' | 'cancelado' | 'concluido'

export const DIAS_SEMANA = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const

export interface User {
  id: number
  nome: string
  email: string
  plano: Plano
  status_assinatura: StatusAssinatura
  trial_fim: string | null
  criado_em: string
}

export interface BusinessPage {
  id: number
  slug: string
  nome_negocio: string
  bio: string | null
  foto_url: string | null
  tema: string
}

export interface Service {
  id: number
  nome: string
  duracao_minutos: number
  preco: number
  ativo: boolean
}

export interface AvailabilitySlot {
  id: number
  dia_semana: number
  hora_inicio: string
  hora_fim: string
}

export interface BlockedSlot {
  id: number
  data: string
  hora_inicio: string
  hora_fim: string
  motivo: string | null
}

export interface Appointment {
  id: number
  service_id: number
  data: string
  hora_inicio: string
  hora_fim: string
  cliente_nome: string
  cliente_telefone: string
  cliente_email: string
  status: StatusAppointment
  criado_em: string
}

export interface PublicBusinessPage {
  nome_negocio: string
  bio: string | null
  foto_url: string | null
  tema: string
  slug: string
  services: Service[]
}

export interface BillingStatus {
  plano: Plano
  status_assinatura: StatusAssinatura
  trial_fim: string | null
  dias_restantes_trial: number | null
  assinatura_ativa: boolean
}

// ---- Auth ----

export function register(nome: string, email: string, senha: string) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, senha }),
  })
}

export async function login(email: string, senha: string) {
  const body = new URLSearchParams({ username: email, password: senha })
  const data = await request<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body,
  })
  return data.access_token
}

export function getMe(token: string) {
  return request<User>('/auth/me', { token })
}

// ---- Business page ----

export function getBusinessPage(token: string) {
  return request<BusinessPage>('/me/business-page', { token })
}

export function createBusinessPage(
  token: string,
  payload: { nome_negocio: string; bio?: string; foto_url?: string; tema?: string },
) {
  return request<BusinessPage>('/me/business-page', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateBusinessPage(
  token: string,
  payload: Partial<{ nome_negocio: string; bio: string; foto_url: string; tema: string }>,
) {
  return request<BusinessPage>('/me/business-page', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

// ---- Services ----

export function listServices(token: string) {
  return request<Service[]>('/me/business-page/services', { token })
}

export function createService(
  token: string,
  payload: { nome: string; duracao_minutos: number; preco: number; ativo?: boolean },
) {
  return request<Service>('/me/business-page/services', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function updateService(
  token: string,
  serviceId: number,
  payload: Partial<{ nome: string; duracao_minutos: number; preco: number; ativo: boolean }>,
) {
  return request<Service>(`/me/business-page/services/${serviceId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteService(token: string, serviceId: number) {
  return request<void>(`/me/business-page/services/${serviceId}`, {
    method: 'DELETE',
    token,
  })
}

// ---- Availability ----

export function listAvailability(token: string) {
  return request<AvailabilitySlot[]>('/me/business-page/availability', { token })
}

export function createAvailability(
  token: string,
  payload: { dia_semana: number; hora_inicio: string; hora_fim: string },
) {
  return request<AvailabilitySlot>('/me/business-page/availability', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteAvailability(token: string, slotId: number) {
  return request<void>(`/me/business-page/availability/${slotId}`, {
    method: 'DELETE',
    token,
  })
}

// ---- Appointments (painel do profissional) ----

export function listAppointments(
  token: string,
  filters: { de?: string; ate?: string; status?: StatusAppointment } = {},
) {
  const params = new URLSearchParams()
  if (filters.de) params.set('de', filters.de)
  if (filters.ate) params.set('ate', filters.ate)
  if (filters.status) params.set('status', filters.status)
  const qs = params.toString()
  return request<Appointment[]>(`/me/business-page/appointments${qs ? `?${qs}` : ''}`, { token })
}

export function cancelAppointment(token: string, appointmentId: number) {
  return request<Appointment>(`/me/business-page/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    token,
  })
}

export function rescheduleAppointment(
  token: string,
  appointmentId: number,
  payload: { data: string; hora_inicio: string },
) {
  return request<Appointment>(`/me/business-page/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

// ---- Blocked slots ----

export function listBlockedSlots(token: string) {
  return request<BlockedSlot[]>('/me/business-page/blocked-slots', { token })
}

export function createBlockedSlot(
  token: string,
  payload: { data: string; hora_inicio: string; hora_fim: string; motivo?: string },
) {
  return request<BlockedSlot>('/me/business-page/blocked-slots', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export function deleteBlockedSlot(token: string, blockedSlotId: number) {
  return request<void>(`/me/business-page/blocked-slots/${blockedSlotId}`, {
    method: 'DELETE',
    token,
  })
}

// ---- Billing (Fluxo 4 - assinatura) ----

export function getBillingStatus(token: string) {
  return request<BillingStatus>('/billing/status', { token })
}

export function createCheckoutSession(token: string) {
  return request<{ checkout_url: string }>('/billing/checkout', { method: 'POST', token })
}

export function cancelSubscription(token: string) {
  return request<BillingStatus>('/billing/cancel', { method: 'POST', token })
}

// ---- Public (cliente final, sem login) ----

export function getPublicBusinessPage(slug: string) {
  return request<PublicBusinessPage>(`/p/${slug}`)
}

export function getAvailableSlots(slug: string, serviceId: number, data: string) {
  const params = new URLSearchParams({ data })
  return request<string[]>(`/p/${slug}/services/${serviceId}/available-slots?${params}`)
}

export function createPublicAppointment(
  slug: string,
  payload: {
    service_id: number
    data: string
    hora_inicio: string
    cliente_nome: string
    cliente_telefone: string
    cliente_email: string
  },
) {
  return request<Appointment>(`/p/${slug}/appointments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
