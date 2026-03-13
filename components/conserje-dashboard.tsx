'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickRegister } from '@/components/quick-register'
import { VehicleCard } from '@/components/vehicle-card'
import { ValidationModal } from '@/components/validation-modal'
import { getServiciosActivos, getConfiguracion } from '@/app/actions'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'
import { Car, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ConserjeDashboard() {
  const [servicios, setServicios] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [selectedServicio, setSelectedServicio] = useState<ServicioConVehiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [serviciosData, configData] = await Promise.all([
        getServiciosActivos(),
        getConfiguracion(),
      ])
      setServicios(serviciosData)
      setConfiguracion(configData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleValidate = (servicio: ServicioConVehiculo) => {
    setSelectedServicio(servicio)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Control de Estacionamiento</h1>
              <p className="text-sm text-muted-foreground">Vista de Conserje</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Inicio</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">Ver Dashboard Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <QuickRegister onRegistered={loadData} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Vehiculos Activos ({servicios.length})
            </h2>
          </div>

          {loading && servicios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando vehiculos...
            </div>
          ) : servicios.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay vehiculos activos en este momento</p>
              <p className="text-sm text-muted-foreground mt-1">
                Use los botones de arriba para registrar un nuevo vehiculo
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {servicios.map((servicio) => (
                <VehicleCard
                  key={servicio.id}
                  servicio={servicio}
                  configuracion={configuracion}
                  onValidate={handleValidate}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ValidationModal
        servicio={selectedServicio}
        configuracion={configuracion}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={loadData}
      />
    </div>
  )
}
