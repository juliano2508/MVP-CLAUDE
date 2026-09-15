export function formatTime(time: string) {
  return time.slice(0, 5)
}

export function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
