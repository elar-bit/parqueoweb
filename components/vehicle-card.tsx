'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Clock, Car, DollarSign, AlertTriangle, ImageIcon } from 'lucide-react'
import { formatDuration, getElapsedTime, formatCurrency } from '@/lib/billing'
import { abonoVigente } from '@/lib/billing'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'

interface VehicleCardProps {
  servicio: ServicioConVehiculo
  configuracion: Configuracion[]
  onValidate: (servicio: ServicioConVehiculo) => void
}

export function VehicleCard({ servicio, configuracion, onValidate }: VehicleCardProps) {
  const [elapsed, setElapsed] = useState({ totalMinutes: 0, billableMinutes: 0 })
  const [verCapturaUrl, setVerCapturaUrl] = useState<string | null>(null)

  useEffect(() => {
    const update = () => {
      const entradaReal = new Date(servicio.entrada_real)
      setElapsed(getElapsedTime(entradaReal))
    }
    
    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [servicio.entrada_real])

  const esAbonado = servicio.vehiculo.tipo === 'abonado'
  const tarifa = esAbonado ? null : configuracion.find(c => c.tipo_usuario === servicio.vehiculo.tipo)
  const estimatedCost = tarifa 
    ? Math.ceil(elapsed.billableMinutes / 60) * tarifa.precio_hora 
    : 0

  const abonadoVencido = esAbonado && !abonoVigente(servicio.vehiculo.vigencia_abono_hasta)

  return (
    <>
    <Card className={`border-border hover:border-primary/50 transition-colors ${abonadoVencido ? 'border-amber-500/60 bg-amber-500/5' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        {abonadoVencido && (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm mb-3 px-2 py-1.5 rounded bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Mensualidad no pagada o vencida</span>
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-semibold text-foreground">
                  {servicio.vehiculo.placa || 'Sin Placa'}
                </span>
                <Badge 
                  variant={servicio.vehiculo.tipo === 'residente' ? 'secondary' : servicio.vehiculo.tipo === 'abonado' ? 'outline' : 'default'}
                  className="text-xs"
                >
                  {servicio.vehiculo.tipo === 'residente' ? 'Residente' : servicio.vehiculo.tipo === 'abonado' ? 'Abonado' : 'Visitante'}
                </Badge>
              </div>
              {servicio.vehiculo.nombre_propietario && (
                <p className="text-sm text-muted-foreground truncate">
                  {servicio.vehiculo.nombre_propietario}
                </p>
              )}
              {esAbonado && (servicio.vehiculo.ref_pago_abono || servicio.vehiculo.captura_pago_abono) && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {servicio.vehiculo.ref_pago_abono && (
                    <span className="text-xs text-muted-foreground">Ref: {servicio.vehiculo.ref_pago_abono}</span>
                  )}
                  {servicio.vehiculo.captura_pago_abono && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setVerCapturaUrl(servicio.vehiculo.captura_pago_abono ?? null)}>
                      <ImageIcon className="h-3.5 w-3.5 mr-1" />
                      Ver captura
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Tiempo</span>
              </div>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                {formatDuration(elapsed.totalMinutes)}
              </p>
              {elapsed.billableMinutes > 0 && (
                <p className="text-xs text-muted-foreground">
                  Cobrable: {formatDuration(elapsed.billableMinutes)}
                </p>
              )}
            </div>
            
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Estimado</span>
              </div>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                {elapsed.billableMinutes > 0 ? formatCurrency(estimatedCost) : 'Gratis'}
              </p>
            </div>
            
            <Button onClick={() => onValidate(servicio)} className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
              Validar Salida
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={!!verCapturaUrl} onOpenChange={(open) => !open && setVerCapturaUrl(null)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Captura del pago (abonado)</DialogTitle>
        </DialogHeader>
        {verCapturaUrl && (
          <div className="flex justify-center bg-muted/30 rounded-lg p-2">
            <img src={verCapturaUrl} alt="Captura del pago" className="max-w-full max-h-[70vh] object-contain rounded" />
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
