'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getEstacionamientosOcupacion } from '@/app/actions'
import { RefreshCw } from 'lucide-react'

type Plaza = { id: string; etiqueta: string; ocupado: boolean }

type EstacionamientoMapaDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSeleccionar?: (id: string, etiqueta: string) => void
  seleccionActual?: string | null
  /** Solo ver libres/ocupados, sin elegir */
  soloConsulta?: boolean
}

export function EstacionamientoMapaDialog({
  open,
  onOpenChange,
  onSeleccionar,
  seleccionActual,
  soloConsulta = false,
}: EstacionamientoMapaDialogProps) {
  const [filas, setFilas] = useState<Plaza[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEstacionamientosOcupacion()
      setFilas(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void refresh()
  }, [open, refresh])

  useEffect(() => {
    if (!open) return
    const t = setInterval(() => void refresh(), 8000)
    return () => clearInterval(t)
  }, [open, refresh])

  const n = filas.length
  const cols = n <= 0 ? 6 : Math.min(12, Math.max(4, Math.ceil(Math.sqrt(n) * 1.5)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100vw-2rem,560px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{soloConsulta ? 'Mapa de estacionamientos' : 'Elegir estacionamiento'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Verde = libre · Rojo = ocupado. Se actualiza al abrir y cada 8 s.
          </p>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        {filas.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground py-2">
            No hay plazas configuradas. El administrador debe definirlas en el panel (Gestión de estacionamientos).
          </p>
        ) : (
          <div
            className="grid gap-2 pt-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {filas.map((p) => {
              const ocupado = p.ocupado
              const seleccionado = seleccionActual === p.id
              const baseClass = `
                    min-h-[44px] rounded-lg border text-sm font-medium transition-colors px-1 flex items-center justify-center
                    ${ocupado
                      ? 'bg-destructive/90 text-destructive-foreground border-destructive'
                      : seleccionado
                        ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30'
                        : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 border-emerald-500/40'}
                  `
              if (soloConsulta) {
                return (
                  <div key={p.id} className={baseClass} title={ocupado ? 'Ocupado' : 'Libre'}>
                    {p.etiqueta}
                  </div>
                )
              }
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={ocupado}
                  onClick={() => {
                    if (!ocupado) onSeleccionar?.(p.id, p.etiqueta)
                  }}
                  className={`${baseClass} ${!ocupado ? 'hover:bg-emerald-500/25' : 'cursor-not-allowed'}`}
                  title={ocupado ? 'Ocupado' : 'Libre — clic para asignar'}
                >
                  {p.etiqueta}
                </button>
              )
            })}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
