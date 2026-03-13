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

/**
 * Multiplicadores para abonado por cantidad de meses (base 100: 1→100, 2→190, 3→280, 4→370, 5→460, 6→550).
 * Total = Math.round(precioMensual * multiplicador).
 */
const ABONADO_MULTIPLIERS: number[] = [1, 1.9, 2.8, 3.7, 4.6, 5.5]

/** Total a pagar por abonado según meses (1-6) con descuento aplicado a partir del precio mensual fijado por admin. */
export function calcularTotalAbonado(precioMensual: number, numeroMeses: number): number {
  const n = Math.min(6, Math.max(1, Math.floor(numeroMeses)))
  const mult = ABONADO_MULTIPLIERS[n - 1] ?? ABONADO_MULTIPLIERS[0]
  return Math.round(precioMensual * mult)
}

/** True si el abonado tiene mensualidad vigente (incluye hoy). */
export function abonoVigente(vigencia_abono_hasta: string | null | undefined): boolean {
  if (!vigencia_abono_hasta) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hasta = new Date(vigencia_abono_hasta)
  hasta.setHours(0, 0, 0, 0)
  return hasta >= hoy
}
