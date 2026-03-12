const GRACE_PERIOD_MINUTES = 5

export function calculateBilling(
  entradaReal: Date,
  salida: Date,
  precioHora: number
): { minutosCobrados: number; total: number } {
  const diffMs = salida.getTime() - entradaReal.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  
  // Subtract grace period (first 5 minutes are free)
  const minutosCobrados = Math.max(0, totalMinutes - GRACE_PERIOD_MINUTES)
  
  if (minutosCobrados === 0) {
    return { minutosCobrados: 0, total: 0 }
  }
  
  // Calculate hours (round up to nearest hour for billing)
  const hours = Math.ceil(minutosCobrados / 60)
  const total = hours * precioHora
  
  return { minutosCobrados, total }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}m`
  }
  
  return `${hours}h ${mins}m`
}

export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`
}

export function getElapsedTime(entradaReal: Date): { 
  totalMinutes: number
  billableMinutes: number 
} {
  const now = new Date()
  const diffMs = now.getTime() - entradaReal.getTime()
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const billableMinutes = Math.max(0, totalMinutes - GRACE_PERIOD_MINUTES)
  
  return { totalMinutes, billableMinutes }
}
