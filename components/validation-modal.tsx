'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { calculateBilling, formatCurrency, formatDuration } from '@/lib/billing'
import { actualizarVehiculo, registrarSalida } from '@/app/actions'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'
import { Printer, Check } from 'lucide-react'

function buildTicketTextoWhatsApp(opts: {
  placa: string
  tipo: 'visitante' | 'residente'
  nombreResidente: string | null
  entrada: Date
  salida: Date
  total: number
  refYape: string
}): string {
  const { placa, tipo, nombreResidente, entrada, salida, total, refYape } = opts
  const saludoBase = nombreResidente
    ? `Hola, ${nombreResidente} 👋`
    : 'Hola 👋'
  const lineas = [
    `${saludoBase}, gracias por usar nuestro servicio de parqueo. 🚗`,
    'Compartimos contigo tu ticket generado el día de hoy en nuestra playa de estacionamiento. 🧾',
    '',
    `Placa: ${placa || 'N/A'}`,
    `Tipo: ${tipo === 'residente' ? 'Residente' : 'Visitante'}`,
    `Entrada: ${entrada.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`,
    `Salida: ${salida.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`,
    `Total: ${formatCurrency(total)}`,
  ]
  if (refYape.trim()) lineas.push(`Ref. Yape: ${refYape.trim()}`)
  lineas.push('')
  lineas.push('¡Gracias y que tengas un excelente día! ✨')
  return lineas.join('\n')
}

interface ValidationModalProps {
  servicio: ServicioConVehiculo | null
  configuracion: Configuracion[]
  open: boolean
  onClose: () => void
  onComplete: () => void
}

export function ValidationModal({
  servicio,
  configuracion,
  open,
  onClose,
  onComplete,
}: ValidationModalProps) {
  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState<'visitante' | 'residente'>('visitante')
  const [refYape, setRefYape] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [billing, setBilling] = useState({ minutosCobrados: 0, total: 0 })
  const [salidaTicket, setSalidaTicket] = useState<Date | null>(null)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (servicio) {
      setPlaca(servicio.vehiculo.placa || '')
      setTipo(servicio.vehiculo.tipo)
      setRefYape('')
      setShowTicket(false)
      setSalidaTicket(null)
      
      const entradaReal = new Date(servicio.entrada_real)
      const salida = new Date()
      const tarifa = configuracion.find(c => c.tipo_usuario === servicio.vehiculo.tipo)
      
      if (tarifa) {
        setBilling(calculateBilling(entradaReal, salida, tarifa.precio_hora))
      }
    }
  }, [servicio, configuracion])

  useEffect(() => {
    if (servicio) {
      const tarifa = configuracion.find(c => c.tipo_usuario === tipo)
      const entradaReal = new Date(servicio.entrada_real)
      const salida = new Date()
      
      if (tarifa) {
        setBilling(calculateBilling(entradaReal, salida, tarifa.precio_hora))
      }
    }
  }, [tipo, servicio, configuracion])

  const handleConfirm = async () => {
    if (!servicio) return
    
    setLoading(true)
    try {
      // Update vehicle info if changed
      if (placa !== servicio.vehiculo.placa || tipo !== servicio.vehiculo.tipo) {
        await actualizarVehiculo(servicio.vehiculo.id, { placa, tipo })
      }
      
      const tarifa = configuracion.find(c => c.tipo_usuario === tipo)
      
      // Register exit
      await registrarSalida(
        servicio.id,
        billing.total,
        tarifa?.precio_hora || 0,
        refYape || undefined
      )
      
      setSalidaTicket(new Date())
      setShowTicket(true)
    } catch (error) {
      console.error('Error processing exit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (ticketRef.current) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ticket de Estacionamiento</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  padding: 20px; 
                  max-width: 300px; 
                  margin: 0 auto;
                }
                .header { text-align: center; margin-bottom: 20px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-size: 1.2em; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 0.9em; }
              </style>
            </head>
            <body>
              ${ticketRef.current.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleEnviarWhatsApp = () => {
    if (!servicio) return
    const nombreResidente =
      servicio.vehiculo?.tipo === 'residente' &&
      (servicio.vehiculo.nombre_propietario || servicio.vehiculo.apellido_propietario)
        ? [servicio.vehiculo.nombre_propietario, servicio.vehiculo.apellido_propietario].filter(Boolean).join(' ')
        : null
    const salida = salidaTicket ?? new Date()
    const texto = buildTicketTextoWhatsApp({
      placa,
      tipo,
      nombreResidente,
      entrada: new Date(servicio.entrada_real),
      salida,
      total: billing.total,
      refYape: refYape.trim(),
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const handleClose = () => {
    if (showTicket) {
      onComplete()
    }
    onClose()
  }

  if (!servicio) return null

  const entradaReal = new Date(servicio.entrada_real)
  const salida = salidaTicket ?? new Date()
  const tarifa = configuracion.find(c => c.tipo_usuario === tipo)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!showTicket ? (
          <>
            <DialogHeader>
              <DialogTitle>Validar Salida</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa del Vehiculo</Label>
                <Input
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Usuario</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as 'visitante' | 'residente')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitante">Visitante</SelectItem>
                    <SelectItem value="residente">Residente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrada:</span>
                  <span>{entradaReal.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Salida:</span>
                  <span>{salida.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo cobrable:</span>
                  <span>{formatDuration(billing.minutosCobrados)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa:</span>
                  <span>{tarifa ? formatCurrency(tarifa.precio_hora) + '/hora' : 'N/A'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total a Pagar:</span>
                  <span className="text-primary">{formatCurrency(billing.total)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yape">Referencia Yape (opcional)</Label>
                <Input
                  id="yape"
                  value={refYape}
                  onChange={(e) => setRefYape(e.target.value)}
                  placeholder="Codigo de referencia"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar Pago'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Pago Completado
              </DialogTitle>
            </DialogHeader>
            
            <div ref={ticketRef} className="bg-background border rounded-lg p-4 font-mono text-sm">
              <div className="header text-center mb-4">
                <h3 className="font-bold text-lg">ESTACIONAMIENTO</h3>
                <p className="text-muted-foreground">Ticket de Salida</p>
              </div>
              
              <div className="divider border-t border-dashed my-3" />
              
              <div className="space-y-1">
                <div className="row flex justify-between">
                  <span>Placa:</span>
                  <span className="font-bold">{placa || 'N/A'}</span>
                </div>
                <div className="row flex justify-between">
                  <span>Tipo:</span>
                  <span>{tipo === 'residente' ? 'Residente' : 'Visitante'}</span>
                </div>
              </div>
              
              <div className="divider border-t border-dashed my-3" />
              
              <div className="space-y-1">
                <div className="row flex justify-between">
                  <span>Entrada:</span>
                  <span>{entradaReal.toLocaleString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })}</span>
                </div>
                <div className="row flex justify-between">
                  <span>Salida:</span>
                  <span>{salida.toLocaleString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })}</span>
                </div>
                <div className="row flex justify-between">
                  <span>Tiempo:</span>
                  <span>{formatDuration(billing.minutosCobrados)}</span>
                </div>
              </div>
              
              <div className="divider border-t border-dashed my-3" />
              
              <div className="total flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>{formatCurrency(billing.total)}</span>
              </div>
              
              {refYape && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Ref. Yape: {refYape}
                </div>
              )}
              
              <div className="footer text-center mt-4 text-xs text-muted-foreground">
                <p>Gracias por su visita</p>
                <p>{new Date().toLocaleDateString('es-PE')}</p>
              </div>
            </div>
            
            <DialogFooter className="gap-2 flex-wrap">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleEnviarWhatsApp}>
                Enviar por WhatsApp
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
