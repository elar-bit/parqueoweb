import type { Servicio } from '@/lib/types'

/** Etiqueta de plaza guardada en el servicio (ticket / reportes). */
export function etiquetaPlazaServicio(s: Pick<Servicio, 'estacionamiento_etiqueta'>): string {
  const t = (s.estacionamiento_etiqueta ?? '').trim()
  return t || '—'
}
