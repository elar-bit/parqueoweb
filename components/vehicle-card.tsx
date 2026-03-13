'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Car, DollarSign } from 'lucide-react'
import { formatDuration, getElapsedTime, formatCurrency } from '@/lib/billing'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'

interface VehicleCardProps {
  servicio: ServicioConVehiculo
  configuracion: Configuracion[]
  onValidate: (servicio: ServicioConVehiculo) => void
}

export function VehicleCard({ servicio, configuracion, onValidate }: VehicleCardProps) {
  const [elapsed, setElapsed] = useState({ totalMinutes: 0, billableMinutes: 0 })

  useEffect(() => {
    const update = () => {
      const entradaReal = new Date(servicio.entrada_real)
      setElapsed(getElapsedTime(entradaReal))
    }
    
    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [servicio.entrada_real])

  const tarifa = configuracion.find(c => c.tipo_usuario === servicio.vehiculo.tipo)
  const estimatedCost = tarifa 
    ? Math.ceil(elapsed.billableMinutes / 60) * tarifa.precio_hora 
    : 0

  return (
    <Card className="border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-3 sm:p-4">
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
                  variant={servicio.vehiculo.tipo === 'residente' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {servicio.vehiculo.tipo === 'residente' ? 'Residente' : 'Visitante'}
                </Badge>
              </div>
              {servicio.vehiculo.nombre_propietario && (
                <p className="text-sm text-muted-foreground truncate">
                  {servicio.vehiculo.nombre_propietario}
                </p>
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
  )
}
