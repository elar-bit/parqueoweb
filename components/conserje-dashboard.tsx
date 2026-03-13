'use client'

import { useState, useEffect, useCallback } from 'react'
import { QuickRegister } from '@/components/quick-register'
import { VehicleCard } from '@/components/vehicle-card'
import { ValidationModal } from '@/components/validation-modal'
import { getServiciosActivos, getConfiguracion, logoutAdmin, getAbonadosVencidos, getAbonadosPorVencer, renovarAbono, getServiciosPagadosHoy } from '@/app/actions'
import { abonoVigente, formatCurrency } from '@/lib/billing'
import type { ServicioConVehiculo, Configuracion, Vehiculo } from '@/lib/types'
import { Car, RefreshCw, LogOut, AlertTriangle, Info, CalendarCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import Link from 'next/link'

export function ConserjeDashboard() {
  const [servicios, setServicios] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [selectedServicio, setSelectedServicio] = useState<ServicioConVehiculo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [abonadosVencidos, setAbonadosVencidos] = useState<Vehiculo[]>([])
  const [abonadosPorVencer, setAbonadosPorVencer] = useState<Vehiculo[]>([])
  const [serviciosHoy, setServiciosHoy] = useState<ServicioConVehiculo[]>([])
  const [servicioDetalle, setServicioDetalle] = useState<ServicioConVehiculo | null>(null)
  const [filtroPlacaApellido, setFiltroPlacaApellido] = useState('')
  const [renovarAbonoDialog, setRenovarAbonoDialog] = useState<Vehiculo | null>(null)
  const [renovarNumeroMeses, setRenovarNumeroMeses] = useState<number>(1)
  const [renovarRefPago, setRenovarRefPago] = useState('')
  const [renovarCapturaFile, setRenovarCapturaFile] = useState<File | null>(null)
  const [renovandoAbonoId, setRenovandoAbonoId] = useState<string | null>(null)

  const normalizarTelefonoWhatsApp = (valor: string): string => {
    const digits = valor.replace(/\D/g, '')
    if (digits.length === 9 && digits.startsWith('9')) return '51' + digits
    if (digits.startsWith('51') && digits.length >= 11) return digits.slice(0, 11)
    return digits || ''
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [serviciosData, configData, vencidos, porVencer, pagadosHoy] = await Promise.all([
        getServiciosActivos(),
        getConfiguracion(),
        getAbonadosVencidos(),
        getAbonadosPorVencer(7),
        getServiciosPagadosHoy(),
      ])
      setServicios(serviciosData)
      setConfiguracion(configData)
      setAbonadosVencidos(vencidos)
      setAbonadosPorVencer(porVencer)
      setServiciosHoy(pagadosHoy)
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

  const buildTicketTexto = (servicio: ServicioConVehiculo): string => {
    const esResidente = servicio.vehiculo?.tipo === 'residente'
    const esAbonado = servicio.vehiculo?.tipo === 'abonado'
    const nombreResidente =
      esResidente && (servicio.vehiculo.nombre_propietario || servicio.vehiculo.apellido_propietario)
        ? [servicio.vehiculo.nombre_propietario, servicio.vehiculo.apellido_propietario].filter(Boolean).join(' ')
        : ''
    const placa = servicio.vehiculo?.placa || 'Sin placa'
    const entrada = new Date(servicio.entrada_real).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
    let salida = '—'
    if (esAbonado && servicio.vehiculo?.vigencia_abono_hasta) {
      salida = new Date(servicio.vehiculo.vigencia_abono_hasta).toLocaleDateString('es-PE')
    } else if (servicio.salida) {
      salida = new Date(servicio.salida).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    }
    const total = formatCurrency(servicio.total_pagar ?? 0)

    const saludoBase = nombreResidente
      ? `Hola, ${nombreResidente}`
      : 'Hola'

    const lineas = [
      `${saludoBase}, gracias por usar nuestro servicio de parqueo.`,
      'Compartimos contigo tu ticket generado el día de hoy en nuestra playa de estacionamiento.',
      '',
      `Placa: ${placa}`,
      `Tipo: ${esAbonado ? 'Abonado' : esResidente ? 'Residente' : 'Visitante'}`,
      `Entrada: ${entrada}`,
      `Salida: ${salida}`,
      `Total: ${total}`,
    ]

    if (servicio.ref_pago_yape) {
      lineas.push(`Ref. Yape: ${servicio.ref_pago_yape}`)
    }

    lineas.push('')
    lineas.push('¡Gracias y que tengas un excelente día!')

    return lineas.join('\n')
  }

  const filtroNorm = filtroPlacaApellido.trim().toLowerCase()
  // Filtro solo aplicado a la sección de servicios pagados (histórico), no a vehículos activos.
  const serviciosHoyFiltrados =
    !filtroNorm
      ? serviciosHoy
      : serviciosHoy.filter((s) => {
          const placa = (s.vehiculo?.placa ?? '').toLowerCase()
          const apellido = (s.vehiculo?.apellido_propietario ?? '').toLowerCase()
          const nombre = (s.vehiculo?.nombre_propietario ?? '').toLowerCase()
          return placa.includes(filtroNorm) || apellido.includes(filtroNorm) || nombre.includes(filtroNorm)
        })

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
        <QuickRegister onRegistered={loadData} configuracion={configuracion} />

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
                      Enviar recordatorio
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={renovandoAbonoId === v.id}
                      onClick={() => {
                        setRenovarAbonoDialog(v)
                        setRenovarNumeroMeses(1)
                        setRenovarRefPago('')
                        setRenovarCapturaFile(null)
                      }}
                    >
                      {renovandoAbonoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-1" />}
                      {renovandoAbonoId === v.id ? 'Guardando...' : 'Registrar pago'}
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
                      Enviar recordatorio
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={renovandoAbonoId === v.id}
                      onClick={() => {
                        setRenovarAbonoDialog(v)
                        setRenovarNumeroMeses(1)
                        setRenovarRefPago('')
                        setRenovarCapturaFile(null)
                      }}
                    >
                      {renovandoAbonoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-1" />}
                      {renovandoAbonoId === v.id ? 'Guardando...' : 'Registrar pago'}
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

        {/* Servicios pagados hoy (solo consulta) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              Servicios pagados hoy ({serviciosHoyFiltrados.length}{serviciosHoy.length !== serviciosHoyFiltrados.length ? ` de ${serviciosHoy.length}` : ''})
            </h2>
            {serviciosHoy.length > 0 && (
              <Input
                type="text"
                placeholder="Filtrar por placa o apellido..."
                value={filtroPlacaApellido}
                onChange={(e) => setFiltroPlacaApellido(e.target.value)}
                className="max-w-xs"
              />
            )}
          </div>
          {serviciosHoy.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay servicios pagados el día de hoy.
            </p>
          ) : serviciosHoyFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún registro coincide con la búsqueda</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto overflow-x-hidden">
              {serviciosHoyFiltrados.map((servicio) => {
                const nombreResidente =
                  servicio.vehiculo?.tipo === 'residente' &&
                  (servicio.vehiculo.nombre_propietario || servicio.vehiculo.apellido_propietario)
                    ? [servicio.vehiculo.nombre_propietario, servicio.vehiculo.apellido_propietario].filter(Boolean).join(' ')
                    : null
                return (
                  <div
                    key={servicio.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono font-medium text-foreground truncate">
                            {servicio.vehiculo?.placa || 'Sin Placa'}
                          </p>
                          {servicio.vehiculo?.tipo === 'abonado' && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Abonado
                            </Badge>
                          )}
                          {nombreResidente && (
                            <Badge variant="secondary" className="text-xs font-normal shrink-0">
                              {nombreResidente}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {servicio.vehiculo?.tipo === 'residente'
                            ? 'Residente'
                            : servicio.vehiculo?.tipo === 'abonado'
                              ? 'Abonado'
                              : 'Visitante'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-foreground text-sm">
                          {formatCurrency(servicio.total_pagar || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {servicio.salida &&
                            new Date(servicio.salida).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setServicioDetalle(servicio)}
                        title="Ver ticket, imprimir o enviar por WhatsApp"
                        className="border-primary text-primary hover:bg-primary/5 min-h-[36px]"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline text-xs font-medium">Ver ticket</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Detalle de servicio pagado (ticket) */}
      <Dialog open={!!servicioDetalle} onOpenChange={(open) => !open && setServicioDetalle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalle del servicio
            </DialogTitle>
          </DialogHeader>
          {servicioDetalle && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Placa</span>
                <span className="font-mono font-medium">{servicioDetalle.vehiculo?.placa || '—'}</span>
                <span className="text-muted-foreground">Tipo</span>
                <span>
                  {servicioDetalle.vehiculo?.tipo === 'residente'
                    ? 'Residente'
                    : servicioDetalle.vehiculo?.tipo === 'abonado'
                      ? 'Abonado'
                      : 'Visitante'}
                </span>
                {(servicioDetalle.vehiculo?.nombre_propietario || servicioDetalle.vehiculo?.apellido_propietario) && (
                  <>
                    <span className="text-muted-foreground">Nombre</span>
                    <span>
                      {[servicioDetalle.vehiculo.nombre_propietario, servicioDetalle.vehiculo.apellido_propietario]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </>
                )}
                {servicioDetalle.vehiculo?.numero_oficina_dep && (
                  <>
                    <span className="text-muted-foreground">Oficina / Depto.</span>
                    <span>{servicioDetalle.vehiculo.numero_oficina_dep}</span>
                  </>
                )}
                <span className="text-muted-foreground">Entrada</span>
                <span>
                  {new Date(servicioDetalle.entrada_real).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
                <span className="text-muted-foreground">Salida</span>
                <span>
                  {servicioDetalle.vehiculo?.tipo === 'abonado' && servicioDetalle.vehiculo.vigencia_abono_hasta
                    ? new Date(servicioDetalle.vehiculo.vigencia_abono_hasta).toLocaleDateString('es-PE')
                    : servicioDetalle.salida
                      ? new Date(servicioDetalle.salida).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                </span>
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(servicioDetalle.total_pagar ?? 0)}</span>
                {servicioDetalle.ref_pago_yape && (
                  <>
                    <span className="text-muted-foreground">Ref. Yape</span>
                    <span className="font-mono text-xs break-all">{servicioDetalle.ref_pago_yape}</span>
                  </>
                )}
                <span className="text-muted-foreground">Teléfono (WhatsApp)</span>
                <span className="font-mono text-xs">{servicioDetalle.vehiculo?.telefono_contacto || '—'}</span>
              </div>
              <DialogFooter className="gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const ticket = buildTicketTexto(servicioDetalle).replace(/\n/g, '<br/>')
                    const ventana = window.open('', '_blank')
                    if (!ventana) return
                    ventana.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8" />
                          <title>Ticket de servicio</title>
                          <style>
                            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; font-size: 14px; }
                            h1 { font-size: 18px; margin-bottom: 12px; }
                            .ticket { border: 1px dashed #ccc; padding: 16px 20px; border-radius: 8px; max-width: 360px; }
                          </style>
                        </head>
                        <body>
                          <div class="ticket">
                            <h1>Ticket de servicio</h1>
                            <p>${ticket}</p>
                          </div>
                        </body>
                      </html>
                    `)
                    ventana.document.close()
                    ventana.onload = () => {
                      ventana.print()
                      ventana.onafterprint = () => ventana.close()
                    }
                  }}
                >
                  Imprimir ticket
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const texto = buildTicketTexto(servicioDetalle)
                    const telefono = servicioDetalle.vehiculo?.telefono_contacto
                      ? normalizarTelefonoWhatsApp(servicioDetalle.vehiculo.telefono_contacto)
                      : ''
                    const url = telefono
                      ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
                      : `https://wa.me/?text=${encodeURIComponent(texto)}`
                    window.open(url, '_blank')
                  }}
                >
                  Enviar por WhatsApp
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo registrar pago abonado (meses 1-6) */}
      <Dialog open={!!renovarAbonoDialog} onOpenChange={(open) => !open && (setRenovarAbonoDialog(null), setRenovarCapturaFile(null))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago de mensualidad</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {renovarAbonoDialog && `${renovarAbonoDialog.placa || 'Sin placa'}. Elija cantidad de meses (precio fijado por admin).`}
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Cantidad de meses (1 a 6)</Label>
              <Select
                value={String(renovarNumeroMeses)}
                onValueChange={(val) => setRenovarNumeroMeses(Number(val))}
                disabled={!!renovandoAbonoId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? 'mes' : 'meses'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conserje-renovar-ref">Nº operación Yape / Transferencia (opcional)</Label>
              <Input
                id="conserje-renovar-ref"
                value={renovarRefPago}
                onChange={(e) => setRenovarRefPago(e.target.value)}
                placeholder="Ej. 123456789"
                disabled={!!renovandoAbonoId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conserje-renovar-captura">Captura del pago (opcional)</Label>
              <Input
                id="conserje-renovar-captura"
                type="file"
                accept="image/*"
                onChange={(e) => setRenovarCapturaFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
                disabled={!!renovandoAbonoId}
              />
              {renovarCapturaFile && <p className="text-xs text-muted-foreground">{renovarCapturaFile.name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenovarAbonoDialog(null)} disabled={!!renovandoAbonoId}>
              Cancelar
            </Button>
            <Button
              disabled={!!renovandoAbonoId}
              onClick={async () => {
                if (!renovarAbonoDialog) return
                setRenovandoAbonoId(renovarAbonoDialog.id)
                try {
                  let capturaDataUrl: string | null = null
                  if (renovarCapturaFile) {
                    capturaDataUrl = await new Promise<string>((resolve, reject) => {
                      const r = new FileReader()
                      r.onload = () => resolve(r.result as string)
                      r.onerror = () => reject(new Error('Error al leer la imagen'))
                      r.readAsDataURL(renovarCapturaFile!)
                    })
                  }
                  await renovarAbono(renovarAbonoDialog.id, {
                    numeroMeses: renovarNumeroMeses,
                    refPagoAbono: renovarRefPago.trim() || null,
                    capturaPagoAbono: capturaDataUrl,
                  })
                  setRenovarAbonoDialog(null)
                  setRenovarRefPago('')
                  setRenovarCapturaFile(null)
                  setRenovarNumeroMeses(1)
                  loadData()
                } catch (e) {
                  console.error(e)
                } finally {
                  setRenovandoAbonoId(null)
                }
              }}
            >
              {renovandoAbonoId === renovarAbonoDialog?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
