/**
 * Utilidades multi-tenant: slug, vigencia de prueba, estado de cuenta.
 */

export const DIAS_PRUEBA_FREEMIUM = 5

export interface Cuenta {
  id: string
  nombre_cuenta: string
  slug: string
  fecha_creacion: string
  estado: 'activo' | 'suspendido'
  nombre_admin?: string | null
  apellido_admin?: string | null
  created_at?: string
}

/** Genera un slug válido para URL a partir del nombre de la cuenta (único por BD). */
export function slugFromNombre(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'cuenta'
}

/** Días restantes de prueba (0 = último día, negativo = vencido). */
export function diasRestantesTrial(fechaCreacion: string): number {
  const creado = new Date(fechaCreacion)
  const finTrial = new Date(creado)
  finTrial.setDate(finTrial.getDate() + DIAS_PRUEBA_FREEMIUM)
  const ahora = new Date()
  ahora.setHours(0, 0, 0, 0)
  finTrial.setHours(23, 59, 59, 999)
  const diff = Math.ceil((finTrial.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/** La cuenta está activa si estado === 'activo' y no está vencida la prueba (o superadmin reactivó). */
export function isCuentaActiva(cuenta: Cuenta): boolean {
  if (cuenta.estado !== 'activo') return false
  const dias = diasRestantesTrial(cuenta.fecha_creacion)
  return dias >= 0
}

/** Fecha de vencimiento de la prueba (fin del día 5). */
export function fechaVencimientoTrial(fechaCreacion: string): Date {
  const d = new Date(fechaCreacion)
  d.setDate(d.getDate() + DIAS_PRUEBA_FREEMIUM)
  d.setHours(23, 59, 59, 999)
  return d
}
