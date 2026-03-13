'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickRegister } from '@/components/quick-register'
import { VehicleCard } from '@/components/vehicle-card'
import { ValidationModal } from '@/components/validation-modal'
import { getServiciosActivos, getConfiguracion, logoutAdmin, getAbonadosVencidos, getAbonadosPorVencer, renovarAbono } from '@/app/actions'
import { abonoVigente } from '@/lib/billing'
import type { ServicioConVehiculo, Configuracion, Vehiculo } from '@/lib/types'
import { Car, RefreshCw, LogOut, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ConserjeDashboard() {
  const [servicios, setServicios] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [selectedServicio, setSelectedServicio] = useState<ServicioConVehiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [abonadosVencidos, setAbonadosVencidos] = useState<Vehiculo[]>([])
  const [abonadosPorVencer, setAbonadosPorVencer] = useState<Vehiculo[]>([])

  // Cambio mínimo para forzar diff sin afectar la lógica

  const normalizarTelefonoWhatsApp = (valor: string): string => {
    const digits = valor.replace(/\D/g, '')
    if (digits.length === 9 && digits.startsWith('9')) return '51' + digits
    if (digits.startsWith('51') && digits.length >= 11) return digits.slice(0, 11)
    return digits || ''
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [serviciosData, configData, vencidos, porVencer] = await Promise.all([
        getServiciosActivos(),
        getConfiguracion(),
        getAbonadosVencidos(),
        getAbonadosPorVencer(7),
      ])
      setServicios(serviciosData)
      setConfiguracion(configData)
      setAbonadosVencidos(vencidos)
      setAbonadosPorVencer(porVencer)
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

  const handleSalir = async () => {
    await logoutAdmin()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">Control de Estacionamiento</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Vista de Conserje</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={abonadosVencidos.length > 0 || abonadosPorVencer.length > 0 ? 'destructive' : 'outline'}
                size="sm"
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 flex items-center gap-1"
                onClick={() => {
                  const el = document.getElementById('abonados-alertas-conserje')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">
                  {abonadosVencidos.length + abonadosPorVencer.length > 0
                    ? `Abonados con alerta (${abonadosVencidos.length + abonadosPorVencer.length})`
                    : 'Abonados sin alerta'}
                </span>
                <span className="sm:hidden text-xs">Abonados</span>
              </Button>
              <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button variant="ghost" size="sm" asChild className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <Link href="/">Inicio</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <Link href="/admin">Admin</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSalir} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <QuickRegister onRegistered={loadData} />

        {(abonadosVencidos.length > 0 || abonadosPorVencer.length > 0) && (
          <div
            id="abonados-alertas-conserje"
            className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-3 sm:p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <p className="font-medium text-sm">Alertas de abonados (próximos a vencer o vencidos)</p>
            </div>
            <ul className="space-y-1 text-sm">
              {abonadosPorVencer.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-medium">{v.placa || 'Sin placa'}</span>
                    {(v.nombre_propietario || v.apellido_propietario) && (
                      <span className="text-muted-foreground">
                        {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {v.vigencia_abono_hasta && (
                      <span className="text-xs text-muted-foreground">
                        Vence: {v.vigencia_abono_hasta}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!v.telefono_contacto}
                      onClick={() => {
                        if (!v.telefono_contacto) return
                        const telefono = normalizarTelefonoWhatsApp(v.telefono_contacto)
                        const nombre = [v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')
                        const saludo = nombre ? `Hola, ${nombre}` : 'Hola'
                        const texto = [
                          `${saludo}, te recordamos que tu abono de estacionamiento está próximo a vencer.`,
                          '',
                          v.vigencia_abono_hasta ? `Vence el: ${v.vigencia_abono_hasta}` : '',
                          '',
                          'Por favor acércate a renovar tu mensualidad para seguir usando el estacionamiento sin inconvenientes.',
                        ].join('\n')
                        const url = telefono
                          ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
                          : `https://wa.me/?text=${encodeURIComponent(texto)}`
                        window.open(url, '_blank')
                      }}
                    >
                      Recordar por WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await renovarAbono(v.id)
                          loadData()
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      Registrar pago
                    </Button>
                  </div>
                </li>
              ))}
              {abonadosVencidos.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-medium">{v.placa || 'Sin placa'}</span>
                    {(v.nombre_propietario || v.apellido_propietario) && (
                      <span className="text-muted-foreground">
                        {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {v.vigencia_abono_hasta && (
                      <span className="text-xs text-muted-foreground">
                        Vencido desde: {v.vigencia_abono_hasta}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!v.telefono_contacto}
                      onClick={() => {
                        if (!v.telefono_contacto) return
                        const telefono = normalizarTelefonoWhatsApp(v.telefono_contacto)
                        const nombre = [v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')
                        const saludo = nombre ? `Hola, ${nombre}` : 'Hola'
                        const texto = [
                          `${saludo}, tu abono de estacionamiento se encuentra vencido.`,
                          '',
                          v.vigencia_abono_hasta ? `Venció el: ${v.vigencia_abono_hasta}` : '',
                          '',
                          'Por favor acércate a renovar tu mensualidad para seguir usando el estacionamiento.',
                        ].join('\n')
                        const url = telefono
                          ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
                          : `https://wa.me/?text=${encodeURIComponent(texto)}`
                        window.open(url, '_blank')
                      }}
                    >
                      Avisar por WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await renovarAbono(v.id)
                          loadData()
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                    >
                      Registrar pago
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {servicios.some((s) => s.vehiculo?.tipo === 'abonado' && !abonoVigente(s.vehiculo.vigencia_abono_hasta)) && (
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Hay abonados con mensualidad vencida o sin pagar. Verifique antes de validar la salida.</span>
          </div>
        )}

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
