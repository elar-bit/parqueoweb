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
  /** Si es true, el tenant puede operar fuera del período de prueba (p. ej. reactivado por superadmin). */
  acceso_pagado?: boolean | null
  /** Días de prueba freemium desde fecha_creacion; null/undefined usa DIAS_PRUEBA_FREEMIUM. */
  dias_prueba_freemium?: number | null
  nombre_admin?: string | null
  apellido_admin?: string | null
  created_at?: string
  /** Opciones UI (default true en BD). */
  ui_banner_noticias?: boolean | null
  ui_btn_visitante?: boolean | null
  ui_btn_residente?: boolean | null
  ui_btn_abonado?: boolean | null
}

export type CuentaOpcionesUi = {
  bannerNoticias: boolean
  btnVisitante: boolean
  btnResidente: boolean
  btnAbonado: boolean
}

/** Valores efectivos para la UI (null/undefined en cuenta = encendido). */
export function opcionesUiDesdeCuenta(c: Cuenta | null | undefined): CuentaOpcionesUi {
  return {
    bannerNoticias: c?.ui_banner_noticias !== false,
    btnVisitante: c?.ui_btn_visitante !== false,
    btnResidente: c?.ui_btn_residente !== false,
    btnAbonado: c?.ui_btn_abonado !== false,
  }
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

/** Resuelve días de prueba: valor de cuenta o default 5, acotado a [1, 3650]. */
export function diasPruebaEfectivos(diasPrueba?: number | null): number {
  const raw = diasPrueba == null || !Number.isFinite(Number(diasPrueba)) ? DIAS_PRUEBA_FREEMIUM : Math.floor(Number(diasPrueba))
  if (raw < 1) return DIAS_PRUEBA_FREEMIUM
  return Math.min(raw, 3650)
}

/** Días restantes de prueba (0 = último día, negativo = vencido). */
export function diasRestantesTrial(fechaCreacion: string, diasPrueba?: number | null): number {
  const dias = diasPruebaEfectivos(diasPrueba)
  const creado = new Date(fechaCreacion)
  const finTrial = new Date(creado)
  finTrial.setDate(finTrial.getDate() + dias)
  const ahora = new Date()
  ahora.setHours(0, 0, 0, 0)
  finTrial.setHours(23, 59, 59, 999)
  const diff = Math.ceil((finTrial.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/** La cuenta está activa si estado === 'activo' y (prueba vigente o acceso autorizado tras pago/reactivación). */
export function isCuentaActiva(cuenta: Cuenta): boolean {
  if (cuenta.estado !== 'activo') return false
  if (cuenta.acceso_pagado) return true
  const dias = diasRestantesTrial(cuenta.fecha_creacion, cuenta.dias_prueba_freemium)
  return dias >= 0
}

/** Fecha de vencimiento de la prueba (fin del último día del plazo). */
export function fechaVencimientoTrial(fechaCreacion: string, diasPrueba?: number | null): Date {
  const dias = diasPruebaEfectivos(diasPrueba)
  const d = new Date(fechaCreacion)
  d.setDate(d.getDate() + dias)
  d.setHours(23, 59, 59, 999)
  return d
}
