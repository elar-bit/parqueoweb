'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getServiciosActivos,
  getIngresosFiltrados,
  getIngresosFiltradosConTipo,
  getServiciosPagadosFiltrados,
  getMesesConServicios,
  getConfiguracion,
  updateConfiguracion,
  logoutAdmin,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  suspenderUsuario,
  reactivarUsuario,
  resetearPasswordUsuario,
  eliminarServicio,
  actualizarVehiculo,
  getAbonadosVencidos,
  getAbonadosPorVencer,
  renovarAbono,
  cancelarAbono,
  getEstacionamientos,
  guardarEstacionamientosCorrelativo,
  guardarEstacionamientosManuales,
  type FiltrosAdmin,
  type UsuarioRow,
  type EstacionamientoRow,
} from '@/app/actions'
import type { ServicioConVehiculo, Configuracion, Vehiculo } from '@/lib/types'
import { formatCurrency, formatMesAno, montoServicioParaMostrar, tiempoRestanteAbono } from '@/lib/billing'
import { etiquetaPlazaServicio } from '@/lib/plaza'
import { Car, DollarSign, RefreshCw, BarChart3, LogOut, Settings, Loader2, Users, UserPlus, Pencil, Trash2, Key, FileSpreadsheet, FileText, Info, CalendarCheck, AlertTriangle, Star, XCircle, UserX, UserCheck, MapPin, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IncomeChart } from '@/components/income-chart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EstacionamientoMapaDialog } from '@/components/estacionamiento-mapa-dialog'
import { NoticiasPeruTicker } from '@/components/noticias-peru-ticker'
import type { CuentaOpcionesUi } from '@/lib/tenant'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Precarga modo correlativo vs manual según la lista guardada (1..N vs etiquetas libres). */
function valoresFormularioDesdeLista(lista: EstacionamientoRow[]): {
  modo: 'correlativo' | 'manual'
  cantidad: string
  textoManual: string
} {
  const sorted = [...lista].sort((a, b) => a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta))
  const n = sorted.length
  const esCorrelativo = n > 0 && sorted.every((row, i) => row.etiqueta.trim() === String(i + 1))
  if (esCorrelativo) {
    return { modo: 'correlativo', cantidad: String(n), textoManual: '' }
  }
  return { modo: 'manual', cantidad: '20', textoManual: sorted.map((r) => r.etiqueta).join('\n') }
}

type AdminDashboardProps = {
  currentUserId?: string | null
  trialDiasRestantes?: number
  slug?: string
  opcionesUi?: CuentaOpcionesUi
}

export function AdminDashboard({ currentUserId, trialDiasRestantes, slug, opcionesUi }: AdminDashboardProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const uiBtnVisitante = opcionesUi?.btnVisitante !== false
  const uiBtnResidente = opcionesUi?.btnResidente !== false
  const uiBtnAbonado = opcionesUi?.btnAbonado !== false

  const [activeCount, setActiveCount] = useState(0)
  const [chartData, setChartData] = useState<{ fecha: string; total: number }[]>([])
  const [chartDataConTipo, setChartDataConTipo] = useState<{ fecha: string; visitantes: number; residentes: number }[]>([])
  const [serviciosList, setServiciosList] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)
  const [salirLoading, setSalirLoading] = useState(false)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'visitante' | 'residente' | 'abonado' | ''>('')
  const [filtroPeriodoReportes, setFiltroPeriodoReportes] = useState<string>('')
  const [abonadosVencidos, setAbonadosVencidos] = useState<Vehiculo[]>([])
  const [abonadosPorVencer, setAbonadosPorVencer] = useState<Vehiculo[]>([])

  // Cambio mínimo sin impacto funcional para forzar diff

  const [renovandoAbonoId, setRenovandoAbonoId] = useState<string | null>(null)
  const [cancelandoAbono, setCancelandoAbono] = useState<Vehiculo | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('')
  const [motivoCancelacionOtro, setMotivoCancelacionOtro] = useState<string>('')
  const [renovarAbonoDialog, setRenovarAbonoDialog] = useState<Vehiculo | null>(null)
  const [renovarRefPago, setRenovarRefPago] = useState('')
  const [renovarCapturaFile, setRenovarCapturaFile] = useState<File | null>(null)
  const [verCapturaUrl, setVerCapturaUrl] = useState<string | null>(null)

  const [tarifaVisitante, setTarifaVisitante] = useState('')
  const [tarifaResidente, setTarifaResidente] = useState('')
  const [tarifaAbonado, setTarifaAbonado] = useState('')
  const [savingTarifas, setSavingTarifas] = useState(false)
  const [tarifaMsg, setTarifaMsg] = useState('')
  const [filtroPlacaApellido, setFiltroPlacaApellido] = useState('')
  const [filtroTipoServicios, setFiltroTipoServicios] = useState<'visitante' | 'residente' | 'abonado' | ''>('')
  const [filtroPeriodoServicios, setFiltroPeriodoServicios] = useState<string>('')
  const [renovarNumeroMeses, setRenovarNumeroMeses] = useState<number>(1)
  const [reportesExpandido, setReportesExpandido] = useState(false)
  const [listaEstacionamientos, setListaEstacionamientos] = useState<EstacionamientoRow[]>([])
  const [modoPlazas, setModoPlazas] = useState<'correlativo' | 'manual'>('correlativo')
  const [cantidadPlazasCorr, setCantidadPlazasCorr] = useState('20')
  const [textoPlazasManual, setTextoPlazasManual] = useState('')
  const [savingPlazas, setSavingPlazas] = useState(false)
  const [plazaMsg, setPlazaMsg] = useState('')
  const [editandoPlazas, setEditandoPlazas] = useState(false)
  const [alertaModificarPlazasOpen, setAlertaModificarPlazasOpen] = useState(false)
  const [filtroMesServicios, setFiltroMesServicios] = useState<string>('')
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([])
  /** Evita "sin servicios" antes de que exista un mes efectivo para el fetch. */
  const [mesesServiciosMetaListos, setMesesServiciosMetaListos] = useState(false)
  /** Petición de lista del mes en curso (incluye actualización en segundo plano). */
  const [cargandoServiciosMes, setCargandoServiciosMes] = useState(false)
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [serviciosParaReportes, setServiciosParaReportes] = useState<ServicioConVehiculo[]>([])

  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [nombreUser, setNombreUser] = useState('')
  const [apellidoUser, setApellidoUser] = useState('')
  const [usuarioUser, setUsuarioUser] = useState('')
  const [passwordUser, setPasswordUser] = useState('')
  const [rolUser, setRolUser] = useState<'admin' | 'conserje'>('conserje')
  const [savingUser, setSavingUser] = useState(false)
  const [usuarioMsg, setUsuarioMsg] = useState('')

  const [editingUser, setEditingUser] = useState<UsuarioRow | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editApellido, setEditApellido] = useState('')
  const [editUsuario, setEditUsuario] = useState('')
  const [editRol, setEditRol] = useState<'admin' | 'conserje'>('conserje')
  const [savingEdit, setSavingEdit] = useState(false)

  const [resetPasswordUser, setResetPasswordUser] = useState<UsuarioRow | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingReset, setSavingReset] = useState(false)

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [suspendingUser, setSuspendingUser] = useState<UsuarioRow | null>(null)
  const [deletingServicioId, setDeletingServicioId] = useState<string | null>(null)
  const [servicioDetalle, setServicioDetalle] = useState<ServicioConVehiculo | null>(null)
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [whatsappOpcion, setWhatsappOpcion] = useState<'guardado' | 'nuevo'>('guardado')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappSaving, setWhatsappSaving] = useState(false)
  const [mapaPlazasOpen, setMapaPlazasOpen] = useState(false)

  const hasConserjeActivo = useMemo(() => {
    return usuarios.some((u) => u.rol === 'conserje' && !u.suspendido)
  }, [usuarios])

  /** Primera carga de datos del panel (evita mostrar "sin conserje" o filtros antes de tiempo). */
  const panelDatosListos = !loading

  const esRegistroReciente = searchParams.get('registrado') === '1'
  const [onboardingInicialOpen, setOnboardingInicialOpen] = useState(false)

  useEffect(() => {
    if (
      esRegistroReciente &&
      (!hasConserjeActivo || listaEstacionamientos.length === 0)
    ) {
      setOnboardingInicialOpen(true)
    }
  }, [esRegistroReciente, hasConserjeActivo, listaEstacionamientos.length])

  useEffect(() => {
    if (
      onboardingInicialOpen &&
      hasConserjeActivo &&
      listaEstacionamientos.length > 0
    ) {
      setOnboardingInicialOpen(false)
      router.replace(pathname)
    }
  }, [
    onboardingInicialOpen,
    hasConserjeActivo,
    listaEstacionamientos.length,
    router,
    pathname,
  ])

  const scrollToUsuarios = () => {
    const el = document.getElementById('usuarios-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToEstacionamientos = () => {
    const el = document.getElementById('estacionamientos-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const closeOnboarding = () => {
    setOnboardingInicialOpen(false)
    router.replace(pathname)
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
      const d = new Date(servicio.vehiculo.vigencia_abono_hasta)
      salida = d.toLocaleDateString('es-PE')
    } else if (servicio.salida) {
      salida = new Date(servicio.salida).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    }
    const total = formatCurrency(montoServicioParaMostrar(servicio))

    const saludoBase = nombreResidente
      ? `Hola, ${nombreResidente}`
      : 'Hola'

    const lineas = [
      `${saludoBase}, gracias por usar nuestro servicio de parqueo.`,
      'Compartimos contigo tu ticket generado el día de hoy en nuestra playa de estacionamiento.',
      '',
      `Placa: ${placa}`,
      `Estacionamiento: ${etiquetaPlazaServicio(servicio)}`,
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

  const handleImprimirServicioDetalle = () => {
    if (!servicioDetalle) return
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
  }

  const normalizarTelefonoWhatsApp = (valor: string): string => {
    const digits = valor.replace(/\D/g, '')
    if (digits.length === 9 && digits.startsWith('9')) return '51' + digits
    if (digits.startsWith('51') && digits.length >= 11) return digits.slice(0, 11)
    return digits || ''
  }

  const buildMensajeDespedidaAbonado = (v: { nombre_propietario?: string | null; apellido_propietario?: string | null }): string => {
    const nombre = [v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ').trim()
    const saludo = nombre ? `Hola, ${nombre}.` : 'Hola.'
    return `${saludo} Su suscripción como abonado fue cancelada. Puede reactivarla en cualquier momento acercándose al conserje del edificio. Que tenga un excelente día. Esperamos tenerlo nuevamente pronto como suscriptor.`
  }

  const handleEnviarMensajeDespedida = () => {
    const v = servicioDetalle?.vehiculo
    if (!v || v.tipo !== 'abonado' || !v.abono_cancelado) return
    const texto = buildMensajeDespedidaAbonado(v)
    const telefono = v.telefono_contacto ? normalizarTelefonoWhatsApp(v.telefono_contacto) : ''
    const url = telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  const handleAbrirWhatsApp = () => {
    if (!servicioDetalle) return
    const guardado = servicioDetalle.vehiculo?.telefono_contacto?.trim()
    if (guardado) {
      setWhatsappOpcion('guardado')
      setWhatsappPhone(guardado)
    } else {
      setWhatsappOpcion('nuevo')
      setWhatsappPhone('')
    }
    setWhatsappOpen(true)
  }

  const handleEnviarWhatsAppServicio = async () => {
    if (!servicioDetalle?.vehiculo) return
    const numero = whatsappOpcion === 'guardado' && servicioDetalle.vehiculo.telefono_contacto
      ? normalizarTelefonoWhatsApp(servicioDetalle.vehiculo.telefono_contacto)
      : normalizarTelefonoWhatsApp(whatsappPhone)
    setWhatsappSaving(true)
    try {
      if (numero && whatsappOpcion === 'nuevo') {
        const r = await actualizarVehiculo(servicioDetalle.vehiculo.id, { telefono_contacto: numero })
        if (!r.ok) {
          setUsuarioMsg(r.error ?? 'No se pudo guardar el teléfono.')
          return
        }
      }
      const texto = buildTicketTexto(servicioDetalle)
      const url = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
        : `https://wa.me/?text=${encodeURIComponent(texto)}`
      window.open(url, '_blank')
      setWhatsappOpen(false)
      loadData()
    } finally {
      setWhatsappSaving(false)
    }
  }

  const [tipoGrafico, setTipoGrafico] = useState<'bar' | 'pie'>('bar')

  const filtrosReportes: FiltrosAdmin = {
    fechaDesde: filtroFechaDesde || null,
    fechaHasta: filtroFechaHasta || null,
    tipo: filtroTipo === '' ? null : (filtroTipo as 'visitante' | 'residente' | 'abonado'),
  }

  /** Mismo criterio que el Select (mes guardado o primer mes disponible). */
  const mesServiciosEfectivo = useMemo(() => {
    if (filtroMesServicios && /^\d{4}-\d{2}$/.test(filtroMesServicios)) return filtroMesServicios
    return mesesDisponibles[0] ?? ''
  }, [filtroMesServicios, mesesDisponibles])

  const rangoMesServicios = useMemo(() => {
    const key = mesServiciosEfectivo
    if (!key || !/^\d{4}-\d{2}$/.test(key)) {
      return { fechaDesde: '', fechaHasta: '' }
    }
    const [y, m] = key.split('-').map(Number)
    const ultimoDia = new Date(y, m, 0).getDate()
    return {
      fechaDesde: `${key}-01`,
      fechaHasta: `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
    }
  }, [mesServiciosEfectivo])

  useEffect(() => {
    getMesesConServicios()
      .then((meses) => {
        setMesesDisponibles(meses)
        if (meses.length > 0) {
          setFiltroMesServicios((prev) => {
            const actual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            if (prev && meses.includes(prev)) return prev
            if (meses.includes(actual)) return actual
            return meses[0]
          })
        }
      })
      .finally(() => setMesesServiciosMetaListos(true))
  }, [])

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) setLoading(true)
    const hayConsultaMes = !!rangoMesServicios.fechaDesde
    if (hayConsultaMes) setCargandoServiciosMes(true)
    try {
      const serviciosPromise = hayConsultaMes
        ? getServiciosPagadosFiltrados({
            fechaDesde: rangoMesServicios.fechaDesde,
            fechaHasta: rangoMesServicios.fechaHasta,
          })
        : Promise.resolve([])
      const [activos, servicios, config, users, vencidos, porVencer, plazas] = await Promise.all([
        getServiciosActivos(),
        serviciosPromise,
        getConfiguracion(),
        getUsuarios(),
        getAbonadosVencidos(),
        getAbonadosPorVencer(7),
        getEstacionamientos(),
      ])
      setActiveCount(activos.length)
      setServiciosList(servicios)
      setConfiguracion(config)
      setUsuarios(users)
      setAbonadosVencidos(vencidos)
      setAbonadosPorVencer(porVencer)
      const visitante = config.find((c) => c.tipo_usuario === 'visitante')
      const residente = config.find((c) => c.tipo_usuario === 'residente')
      const abonado = config.find((c) => c.tipo_usuario === 'abonado')
      setListaEstacionamientos(plazas)
      setTarifaVisitante(visitante ? String(visitante.precio_hora) : '')
      setTarifaResidente(residente ? String(residente.precio_hora) : '')
      setTarifaAbonado(abonado ? String(abonado.precio_hora) : '')
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      if (hayConsultaMes) setCargandoServiciosMes(false)
      if (!silent) setLoading(false)
    }
  }, [rangoMesServicios.fechaDesde, rangoMesServicios.fechaHasta])

  const loadReportesData = useCallback(async () => {
    setLoadingReportes(true)
    try {
      if (filtroTipo === '') {
        const [ingresosConTipo, servicios] = await Promise.all([
          getIngresosFiltradosConTipo({ ...filtrosReportes, tipo: null }),
          getServiciosPagadosFiltrados({ ...filtrosReportes, tipo: null }),
        ])
        const chartDiario = ingresosConTipo.map(({ fecha, visitantes, residentes }) => ({ fecha, total: visitantes + residentes }))
        setChartData(chartDiario)
        setChartDataConTipo(ingresosConTipo)
        setServiciosParaReportes(servicios)
      } else {
        const [ingresos, servicios] = await Promise.all([
          getIngresosFiltrados(filtrosReportes),
          getServiciosPagadosFiltrados(filtrosReportes),
        ])
        let serviciosFiltrados = servicios
        if (filtroTipo === 'abonado' && filtroPeriodoReportes) {
          const n = Number(filtroPeriodoReportes)
          serviciosFiltrados = servicios.filter((s) => (s.vehiculo?.ultimo_numero_meses_abono ?? 0) === n)
        }
        let chartAbonado = ingresos
        if (filtroTipo === 'abonado' && filtroPeriodoReportes) {
          const grouped: Record<string, number> = {}
          serviciosFiltrados.forEach((s) => {
            if (s.salida) {
              const dateKey = new Date(s.salida).toISOString().split('T')[0]
              grouped[dateKey] = (grouped[dateKey] || 0) + montoServicioParaMostrar(s)
            }
          })
          chartAbonado = Object.entries(grouped).map(([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha))
        }
        setChartData(chartAbonado)
        setChartDataConTipo([])
        setServiciosParaReportes(serviciosFiltrados)
      }
    } catch (error) {
      console.error('Error loading reportes data:', error)
    } finally {
      setLoadingReportes(false)
    }
  }, [filtroFechaDesde, filtroFechaHasta, filtroTipo, filtroPeriodoReportes])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const id = setInterval(() => {
      void loadData({ silent: true })
    }, 60_000)
    return () => clearInterval(id)
  }, [loadData])

  useEffect(() => {
    if (reportesExpandido) loadReportesData()
  }, [reportesExpandido, loadReportesData])

  const totalFiltradoReportes = serviciosParaReportes.reduce((sum, s) => sum + montoServicioParaMostrar(s), 0)
  const totalDiarioReportes = serviciosParaReportes
    .filter((s) => s.vehiculo?.tipo === 'visitante' || s.vehiculo?.tipo === 'residente')
    .reduce((sum, s) => sum + montoServicioParaMostrar(s), 0)
  const totalAbonadosReportes = serviciosParaReportes
    .filter((s) => s.vehiculo?.tipo === 'abonado')
    .reduce((sum, s) => sum + montoServicioParaMostrar(s), 0)
  const serviciosCountReportes = serviciosParaReportes.length
  const filtroPlacaApellidoNorm = filtroPlacaApellido.trim().toLowerCase()
  const serviciosListFiltrados = (() => {
    let list = serviciosList
    if (filtroTipoServicios) {
      list = list.filter((s) => s.vehiculo?.tipo === filtroTipoServicios)
      if (filtroTipoServicios === 'abonado' && filtroPeriodoServicios) {
        const n = Number(filtroPeriodoServicios)
        list = list.filter((s) => (s.vehiculo?.ultimo_numero_meses_abono ?? 0) === n)
      }
    }
    if (!filtroPlacaApellidoNorm) return list
    return list.filter((s) => {
      const placa = (s.vehiculo?.placa ?? '').toLowerCase()
      const apellido = (s.vehiculo?.apellido_propietario ?? '').toLowerCase()
      const nombre = (s.vehiculo?.nombre_propietario ?? '').toLowerCase()
      return placa.includes(filtroPlacaApellidoNorm) || apellido.includes(filtroPlacaApellidoNorm) || nombre.includes(filtroPlacaApellidoNorm)
    })
  })()
  const serviciosCount = serviciosListFiltrados.length

  const cargaInicialListaServicios =
    !mesesServiciosMetaListos ||
    loading ||
    (cargandoServiciosMes && serviciosList.length === 0)

  const leyendaDatos =
    filtroTipo === 'visitante'
      ? 'Solo visitantes'
      : filtroTipo === 'residente'
        ? 'Solo residentes'
        : filtroTipo === 'abonado'
          ? 'Solo abonados (sin ingreso por uso)'
          : 'Todos los tipos (visitantes y residentes)'
  const textoPeriodo =
    filtroFechaDesde || filtroFechaHasta
      ? `Período: ${filtroFechaDesde || '...'} a ${filtroFechaHasta || '...'}`
      : 'Sin filtro de fechas'

  const handleGuardarTarifas = async () => {
    const v = parseFloat(tarifaVisitante)
    const r = parseFloat(tarifaResidente)
    const a = parseFloat(tarifaAbonado)
    if (isNaN(v) || isNaN(r) || v < 0 || r < 0) {
      setTarifaMsg('Ingrese valores numéricos válidos para visitante y residente.')
      return
    }
    if (tarifaAbonado.trim() !== '' && (isNaN(a) || a < 0)) {
      setTarifaMsg('El precio mensual del abonado debe ser un número válido.')
      return
    }
    setSavingTarifas(true)
    setTarifaMsg('')
    try {
      const [resV, resR] = await Promise.all([
        updateConfiguracion('visitante', v),
        updateConfiguracion('residente', r),
      ])
      if (!resV.ok || !resR.ok) {
        setTarifaMsg(resV.error || resR.error || 'Error al guardar')
        return
      }
      if (tarifaAbonado.trim() !== '') {
        const resA = await updateConfiguracion('abonado', a)
        if (!resA.ok) {
          setTarifaMsg(resA.error || 'Error al guardar precio abonado')
          return
        }
      }
      setTarifaMsg('Tarifas actualizadas correctamente.')
    } catch {
      setTarifaMsg('Error al guardar')
    } finally {
      setSavingTarifas(false)
    }
  }

  const handleGuardarPlazasCorrelativo = async () => {
    const n = parseInt(cantidadPlazasCorr, 10)
    if (isNaN(n) || n < 1) {
      setPlazaMsg('Indique una cantidad entre 1 y 500.')
      return
    }
    setSavingPlazas(true)
    setPlazaMsg('')
    try {
      const r = await guardarEstacionamientosCorrelativo(n)
      if (r.ok) {
        setPlazaMsg('Estacionamientos guardados (numeración 1, 2, 3…).')
        setEditandoPlazas(false)
        loadData()
      } else setPlazaMsg(r.error || 'Error')
    } finally {
      setSavingPlazas(false)
    }
  }

  const handleGuardarPlazasManual = async () => {
    const partes = textoPlazasManual.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    setSavingPlazas(true)
    setPlazaMsg('')
    try {
      const r = await guardarEstacionamientosManuales(partes)
      if (r.ok) {
        setPlazaMsg('Estacionamientos guardados.')
        setTextoPlazasManual('')
        setEditandoPlazas(false)
        loadData()
      } else setPlazaMsg(r.error || 'Error')
    } finally {
      setSavingPlazas(false)
    }
  }

  const aplicarListaAFormularioPlazas = useCallback(() => {
    const v = valoresFormularioDesdeLista(listaEstacionamientos)
    setModoPlazas(v.modo)
    setCantidadPlazasCorr(v.cantidad)
    setTextoPlazasManual(v.textoManual)
  }, [listaEstacionamientos])

  const confirmarModificarPlazas = () => {
    aplicarListaAFormularioPlazas()
    setEditandoPlazas(true)
    setAlertaModificarPlazasOpen(false)
    setPlazaMsg('')
  }

  const cancelarEdicionPlazas = () => {
    aplicarListaAFormularioPlazas()
    setEditandoPlazas(false)
    setPlazaMsg('')
  }

  const handleLogout = async () => {
    setSalirLoading(true)
    try {
      await logoutAdmin()
      window.location.reload()
    } catch (e) {
      console.error('Logout:', e)
      setSalirLoading(false)
    }
  }

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsuarioMsg('')
    setSavingUser(true)
    try {
      const result = await crearUsuario(nombreUser, apellidoUser, usuarioUser, passwordUser, rolUser)
      if (result.ok) {
        setNombreUser('')
        setApellidoUser('')
        setUsuarioUser('')
        setPasswordUser('')
        setUsuarioMsg('Usuario creado correctamente.')
        const users = await getUsuarios()
        setUsuarios(users)
      } else {
        setUsuarioMsg(result.error || 'Error al crear usuario')
      }
    } catch (err) {
      console.error('handleCrearUsuario:', err)
      setUsuarioMsg(
        err instanceof Error ? err.message : 'Error de conexión. Compruebe su red e inténtelo de nuevo.'
      )
    } finally {
      setSavingUser(false)
    }
  }

  const openEditUser = (u: UsuarioRow) => {
    setEditingUser(u)
    setEditNombre(u.nombre)
    setEditApellido(u.apellido)
    setEditUsuario(u.usuario)
    setEditRol(u.rol)
  }

  const handleGuardarEdicionUsuario = async () => {
    if (!editingUser) return
    setSavingEdit(true)
    try {
      const result = await actualizarUsuario(editingUser.id, {
        nombre: editNombre.trim(),
        apellido: editApellido.trim(),
        usuario: editUsuario.trim().toLowerCase(),
        rol: editRol,
      })
      if (result.ok) {
        setEditingUser(null)
        const users = await getUsuarios()
        setUsuarios(users)
      } else {
        setUsuarioMsg(result.error || 'Error al actualizar')
      }
    } catch (err) {
      console.error('handleGuardarEdicionUsuario:', err)
      setUsuarioMsg(
        err instanceof Error ? err.message : 'Error de conexión. Compruebe su red e inténtelo de nuevo.'
      )
    } finally {
      setSavingEdit(false)
    }
  }

  const openResetPassword = (u: UsuarioRow) => {
    setResetPasswordUser(u)
    setNewPassword('')
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUser || newPassword.trim().length < 4) return
    setSavingReset(true)
    try {
      const result = await resetearPasswordUsuario(resetPasswordUser.id, newPassword.trim())
      if (result.ok) {
        setResetPasswordUser(null)
        setNewPassword('')
      } else {
        setUsuarioMsg(result.error || 'Error al resetear')
      }
    } catch (err) {
      console.error('handleResetPassword:', err)
      setUsuarioMsg(
        err instanceof Error ? err.message : 'Error de conexión. Compruebe su red e inténtelo de nuevo.'
      )
    } finally {
      setSavingReset(false)
    }
  }

  const handleEliminarUsuario = async (id: string) => {
    const result = await eliminarUsuario(id)
    setDeletingUserId(null)
    if (result.ok) {
      const users = await getUsuarios()
      setUsuarios(users)
    } else {
      setUsuarioMsg(result.error || 'Error al eliminar')
    }
  }

  const handleEliminarServicio = async (id: string) => {
    const result = await eliminarServicio(id)
    setDeletingServicioId(null)
    if (result.ok) {
      loadData()
    } else {
      setUsuarioMsg(result.error || 'Error al eliminar servicio')
    }
  }

  const exportarExcel = () => {
    const titulo = 'Reporte de ingresos - Estacionamiento'
    const filtrosLinea = `Datos: ${leyendaDatos}. ${textoPeriodo}`
    const headers = ['Fecha de creación', 'Placa', 'Estacionamiento', 'Tipo', 'Período', 'Nombre', 'Oficina/Depto', 'Teléfono (WhatsApp)', 'Entrada', 'Salida', 'Total (S/)', 'Ref. Yape o Transferencia', 'Motivo cancelación']
    const rows = serviciosParaReportes.map((s) => {
      const nombre = (s.vehiculo?.tipo === 'residente' || s.vehiculo?.tipo === 'abonado') && (s.vehiculo.nombre_propietario || s.vehiculo.apellido_propietario)
        ? [s.vehiculo.nombre_propietario, s.vehiculo.apellido_propietario].filter(Boolean).join(' ')
        : ''
      const refPago = (s.ref_pago_yape ?? s.vehiculo?.ref_pago_abono ?? '') as string
      const esAbonado = s.vehiculo?.tipo === 'abonado'
      const periodoStr = esAbonado && s.vehiculo?.ultimo_numero_meses_abono ? `${s.vehiculo.ultimo_numero_meses_abono} ${s.vehiculo.ultimo_numero_meses_abono === 1 ? 'mes' : 'meses'}` : ''
      const fechaCreacion = s.entrada_real ? new Date(s.entrada_real).toLocaleDateString('es-PE') : ''
      const salidaStr = esAbonado && s.vehiculo?.vigencia_abono_hasta
        ? new Date(s.vehiculo.vigencia_abono_hasta + 'T23:59:59').toLocaleString('es-PE')
        : s.salida ? new Date(s.salida).toLocaleString('es-PE') : ''
      const motivoCancel = s.vehiculo?.tipo === 'abonado' && s.vehiculo?.abono_cancelado ? (s.vehiculo?.motivo_cancelacion_abono ?? '') : ''
      return [
        fechaCreacion,
        s.vehiculo?.placa || 'Sin placa',
        etiquetaPlazaServicio(s),
        s.vehiculo?.tipo === 'residente' ? 'Residente' : s.vehiculo?.tipo === 'abonado' ? (s.vehiculo?.abono_cancelado ? 'Abonado - Cancelado' : 'Abonado') : 'Visitante',
        periodoStr,
        nombre,
        s.vehiculo?.numero_oficina_dep ?? '',
        s.vehiculo?.telefono_contacto ?? '',
        s.entrada_real ? new Date(s.entrada_real).toLocaleString('es-PE') : '',
        salidaStr,
        String(montoServicioParaMostrar(s)),
        refPago,
        motivoCancel,
      ]
    })
    const csv = [
      `"${titulo}"`,
      `"${filtrosLinea.replace(/"/g, '""')}"`,
      '"Generado: ' + new Date().toLocaleString('es-PE') + '"',
      '',
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-ingresos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportarPDF = () => {
    const ventana = window.open('', '_blank')
    if (!ventana) return
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Reporte de ingresos</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            h1 { font-size: 18px; }
            .fecha { color: #666; font-size: 12px; margin-top: 8px; }
            .leyenda { font-size: 14px; margin-top: 4px; font-weight: 500; }
          </style>
        </head>
        <body>
          <h1>Reporte de ingresos - Estacionamiento</h1>
          <p class="leyenda">Datos: ${leyendaDatos}. ${textoPeriodo}</p>
          <p class="fecha">Generado: ${new Date().toLocaleString('es-PE')}</p>
          <table>
            <thead><tr>
              <th>Fecha de creación</th><th>Placa</th><th>Estacionamiento</th><th>Tipo</th><th>Período</th><th>Nombre</th><th>Oficina/Depto</th><th>Teléfono (WhatsApp)</th>
              <th>Entrada</th><th>Salida</th><th>Total (S/)</th><th>Ref. Yape o Transferencia</th><th>Motivo cancelación</th>
            </tr></thead>
            <tbody>
              ${serviciosParaReportes.map((s) => {
                const nombre = (s.vehiculo?.tipo === 'residente' || s.vehiculo?.tipo === 'abonado') && (s.vehiculo.nombre_propietario || s.vehiculo.apellido_propietario)
                  ? [s.vehiculo.nombre_propietario, s.vehiculo.apellido_propietario].filter(Boolean).join(' ')
                  : ''
                const refPago = s.ref_pago_yape ?? s.vehiculo?.ref_pago_abono ?? ''
                const esc = (v: string) => (v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                const esAbonado = s.vehiculo?.tipo === 'abonado'
                const periodoStr = esAbonado && s.vehiculo?.ultimo_numero_meses_abono ? s.vehiculo.ultimo_numero_meses_abono + (s.vehiculo.ultimo_numero_meses_abono === 1 ? ' mes' : ' meses') : ''
                const fechaCreacion = s.entrada_real ? new Date(s.entrada_real).toLocaleDateString('es-PE') : ''
                const salidaStr = esAbonado && s.vehiculo?.vigencia_abono_hasta ? new Date(s.vehiculo.vigencia_abono_hasta + 'T23:59:59').toLocaleString('es-PE') : (s.salida ? new Date(s.salida).toLocaleString('es-PE') : '')
                return `
                <tr>
                  <td>${fechaCreacion}</td>
                  <td>${esc(s.vehiculo?.placa || 'Sin placa')}</td>
                  <td>${esc(etiquetaPlazaServicio(s))}</td>
                  <td>${s.vehiculo?.tipo === 'residente' ? 'Residente' : s.vehiculo?.tipo === 'abonado' ? (s.vehiculo?.abono_cancelado ? 'Abonado - Cancelado' : 'Abonado') : 'Visitante'}</td>
                  <td>${esc(periodoStr)}</td>
                  <td>${esc(nombre)}</td>
                  <td>${esc(s.vehiculo?.numero_oficina_dep ?? '')}</td>
                  <td>${esc(s.vehiculo?.telefono_contacto ?? '')}</td>
                  <td>${s.entrada_real ? new Date(s.entrada_real).toLocaleString('es-PE') : ''}</td>
                  <td>${salidaStr}</td>
                  <td>${montoServicioParaMostrar(s)}</td>
                  <td>${esc(refPago)}</td>
                  <td>${esc(esAbonado && s.vehiculo?.abono_cancelado ? (s.vehiculo?.motivo_cancelacion_abono ?? '') : '')}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
          <p class="fecha" style="margin-top: 16px;">Total: S/ ${totalFiltradoReportes.toFixed(2)} (${serviciosCountReportes} servicios)</p>
        </body>
      </html>
    `
    ventana.document.write(html)
    ventana.document.close()
    ventana.onload = () => {
      ventana.print()
      ventana.onafterprint = () => ventana.close()
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {onboardingInicialOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-lg p-4 sm:p-6 space-y-4">
            {!hasConserjeActivo ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Paso 1 de 2
                    </p>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">
                      Configuración inicial — Conserje
                    </h2>
                    <p className="text-sm text-muted-foreground break-words mt-1">
                      Para empezar a registrar entradas de vehículos, primero debes crear al menos un usuario{' '}
                      <strong>Conserje</strong>.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Paso a paso</p>
                  <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                    <li>Crea un usuario con rol <strong>Conserje</strong> en “Gestión de usuarios”.</li>
                    <li>Luego haz clic en <strong>Conserje</strong> (arriba a la derecha) e inicia sesión con ese usuario.</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeOnboarding()
                      scrollToUsuarios()
                    }}
                  >
                    Ir a Gestión de usuarios
                  </Button>
                  <Button onClick={closeOnboarding}>Entendido</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Paso 2 de 2
                    </p>
                    <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">
                      Plazas de estacionamiento
                    </h2>
                    <p className="text-sm text-muted-foreground break-words mt-1">
                      Indica cuántas plazas (o cómo se llaman) para que el conserje pueda asignar una{' '}
                      <strong>libre</strong> al registrar cada entrada. Sin plazas configuradas no tendrás mapa ni
                      asignación ordenada por estacionamiento.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Paso a paso</p>
                  <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                    <li>
                      En la sección <strong>Estacionamientos</strong> (más abajo en este panel), define la cantidad con
                      numeración 1, 2, 3… o escribe etiquetas manualmente (A-1, Sótano 2…).
                    </li>
                    <li>
                      Pulsa <strong>Guardar</strong>. Este aviso se cerrará solo cuando haya al menos una plaza
                      guardada.
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeOnboarding()
                      scrollToEstacionamientos()
                    }}
                  >
                    Ir a Estacionamientos
                  </Button>
                  <Button onClick={closeOnboarding}>Entendido</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={onboardingInicialOpen ? 'pointer-events-none select-none grayscale opacity-40' : ''}>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">Dashboard Administrativo</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Control de Estacionamiento</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={abonadosVencidos.length > 0 || abonadosPorVencer.length > 0 ? 'destructive' : 'outline'}
                size="sm"
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 flex items-center gap-1"
                disabled={loading}
                onClick={() => {
                  // Abrimos el card desplazándonos a la sección de abonados; por simplicidad, solo hacemos scroll al main.
                  const el = document.getElementById('abonados-alertas')
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                disabled={loading}
                onClick={() => setMapaPlazasOpen(true)}
              >
                <MapPin className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Plazas</span>
              </Button>
              {loading || !hasConserjeActivo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled
                  className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 opacity-50 cursor-not-allowed"
                  id="admin-link-conserje"
                  title={
                    loading
                      ? 'Cargando datos del panel…'
                      : 'Cree primero un usuario con rol Conserje en la sección Usuarios.'
                  }
                >
                  Conserje
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0" id="admin-link-conserje">
                  <Link href={slug ? `/${slug}/conserje` : '/conserje'}>Conserje</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={salirLoading}
                aria-busy={salirLoading}
                aria-label={salirLoading ? 'Cerrando sesión' : 'Salir'}
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
              >
                {salirLoading ? (
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4 sm:mr-2" aria-hidden />
                )}
                <span className="hidden sm:inline">{salirLoading ? 'Cerrando sesión…' : 'Salir'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {opcionesUi?.bannerNoticias !== false && <NoticiasPeruTicker />}

      {trialDiasRestantes !== undefined && trialDiasRestantes >= 1 && trialDiasRestantes <= 2 && (
        <div className="container mx-auto px-3 sm:px-4 pt-3">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Su prueba gratuita vence en {trialDiasRestantes} día{trialDiasRestantes !== 1 ? 's' : ''}. Contacte al administrador del sistema para activar su suscripción.
            </p>
          </div>
        </div>
      )}

      {panelDatosListos && !hasConserjeActivo && (
        <div className="container mx-auto px-3 sm:px-4 pt-3">
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Users className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 break-words">
                  No hay conserje activo en esta cuenta.
                </p>
                <p className="text-sm text-blue-900/80 dark:text-blue-100/80 break-words">
                  Para registrar entradas de vehículos necesitas crear (o reactivar) un usuario con rol <strong>Conserje</strong>.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button variant="outline" onClick={scrollToUsuarios} className="border-blue-600/40 text-blue-700 hover:bg-blue-500/10">
                Crear conserje
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled
                className="text-blue-700 opacity-60 cursor-not-allowed"
                title="Cree primero un usuario con rol Conserje en la sección Usuarios."
              >
                Ir a login Conserje
              </Button>
            </div>
          </div>
        </div>
      )}

      {panelDatosListos && hasConserjeActivo && listaEstacionamientos.length === 0 && (
        <div className="container mx-auto px-3 sm:px-4 pt-3">
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 overflow-hidden">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <MapPin className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 break-words">
                  Aún no hay plazas de estacionamiento configuradas.
                </p>
                <p className="text-sm text-blue-900/80 dark:text-blue-100/80 break-words">
                  Define la cantidad o las etiquetas de tus plazas en <strong>Estacionamientos</strong> para que el conserje
                  asigne una libre al registrar cada vehículo.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={scrollToEstacionamientos} className="border-blue-600/40 text-blue-700 hover:bg-blue-500/10 flex-shrink-0">
              Ir a Estacionamientos
            </Button>
          </div>
        </div>
      )}

      <main
        className={cn(
          'container mx-auto min-w-0 px-3 sm:px-4 py-5 sm:py-8 relative',
          loading && 'min-h-[50vh]'
        )}
      >
        {loading && (
          <div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-[1px] border border-border/50 shadow-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" aria-hidden />
            <p className="text-sm font-medium text-muted-foreground">Cargando panel…</p>
          </div>
        )}
        <div className={cn('flex flex-col gap-12 sm:gap-16', loading && 'pointer-events-none select-none')}>
        {/* 1. Alertas de abonados */}
        {(abonadosVencidos.length > 0 || abonadosPorVencer.length > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5 overflow-hidden" id="abonados-alertas">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <span className="break-words">Alertas de abonados</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground break-words mt-1">
                    Abonados con mensualidad vencida o que vence en los próximos 7 días.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => void loadData()}
                  disabled={loading}
                  title="Actualizar alertas y datos del panel"
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-hidden px-3 sm:px-6">
              <ul className="space-y-2">
                {abonadosPorVencer.map((v) => (
                  <li key={v.id} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 p-2 rounded-lg bg-background/80 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-1">
                      <span className="font-mono font-medium truncate max-w-[120px] sm:max-w-none">{v.placa || 'Sin placa'}</span>
                      {(v.nombre_propietario || v.apellido_propietario) && (
                        <span className="text-sm text-muted-foreground truncate min-w-0 max-w-[140px] sm:max-w-none">
                          {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {v.vigencia_abono_hasta && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Vence: {v.vigencia_abono_hasta}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
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
                            'Por favor acércate a renovar tu mensualidad para seguir disfrutando del servicio sin inconvenientes.',
                          ].join('\n')
                          const url = telefono
                            ? `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
                            : `https://wa.me/?text=${encodeURIComponent(texto)}`
                          window.open(url, '_blank')
                        }}
                        disabled={!v.telefono_contacto}
                      >
                        Enviar recordatorio
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={renovandoAbonoId === v.id}
                        onClick={() => {
                          setRenovarAbonoDialog(v)
                          setRenovarRefPago('')
                          setRenovarCapturaFile(null)
                          setRenovarNumeroMeses(1)
                        }}
                      >
                        {renovandoAbonoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-1" />}
                        {renovandoAbonoId === v.id ? 'Guardando...' : 'Registrar pago'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground border-dashed"
                        onClick={() => setCancelandoAbono(v)}
                        title="Cancelar suscripción: ya no renovará; se quita de la lista pero se conserva el registro"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar suscripción
                      </Button>
                    </div>
                  </li>
                ))}
                {abonadosVencidos.map((v) => (
                  <li key={v.id} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 p-2 rounded-lg bg-background/80 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 flex-1">
                      <span className="font-mono font-medium truncate max-w-[120px] sm:max-w-none">{v.placa || 'Sin placa'}</span>
                      {(v.nombre_propietario || v.apellido_propietario) && (
                        <span className="text-sm text-muted-foreground truncate min-w-0 max-w-[140px] sm:max-w-none">
                          {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {v.vigencia_abono_hasta && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Vencía: {v.vigencia_abono_hasta}</span>
                      )}
                      {v.captura_pago_abono && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary shrink-0" onClick={() => setVerCapturaUrl(v.captura_pago_abono ?? null)}>
                          Ver captura
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
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
                        disabled={!v.telefono_contacto}
                      >
                        Enviar recordatorio
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={renovandoAbonoId === v.id}
                        onClick={() => {
                          setRenovarAbonoDialog(v)
                          setRenovarRefPago('')
                          setRenovarCapturaFile(null)
                          setRenovarNumeroMeses(1)
                        }}
                      >
                        {renovandoAbonoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-1" />}
                        {renovandoAbonoId === v.id ? 'Guardando...' : 'Registrar pago'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground border-dashed"
                        onClick={() => setCancelandoAbono(v)}
                        title="Cancelar suscripción: ya no renovará; se quita de la lista pero se conserva el registro"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar suscripción
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 2. Lista de servicios */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Servicios</CardTitle>
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 overflow-hidden">
              <div className="space-y-1 min-w-0 w-full sm:w-auto">
                <Label className="text-xs text-muted-foreground">Mes</Label>
                <Select
                  value={filtroMesServicios || (mesesDisponibles[0] ?? '__vacio__')}
                  onValueChange={(v) => v !== '__vacio__' && setFiltroMesServicios(v)}
                  disabled={mesesDisponibles.length === 0}
                >
                  <SelectTrigger className="w-full min-w-0 sm:w-[180px]">
                    <SelectValue placeholder="Mes - Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDisponibles.length === 0 ? (
                      <SelectItem value="__vacio__" disabled>No hay meses con datos</SelectItem>
                    ) : (
                      mesesDisponibles.map((ym) => (
                        <SelectItem key={ym} value={ym}>
                          {formatMesAno(ym)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-0 w-full sm:w-auto">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filtroTipoServicios || 'todos'} onValueChange={(v) => { setFiltroTipoServicios(v === 'todos' ? '' : v as 'visitante' | 'residente' | 'abonado'); if (v !== 'abonado') setFiltroPeriodoServicios('') }}>
                  <SelectTrigger className="w-full min-w-0 sm:w-[130px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="visitante">Visitante</SelectItem>
                    <SelectItem value="residente">Residente</SelectItem>
                    <SelectItem value="abonado">Abonado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filtroTipoServicios === 'abonado' && (
                <div className="space-y-1 min-w-0 w-full sm:w-auto">
                  <Label className="text-xs text-muted-foreground">Período</Label>
                  <Select value={filtroPeriodoServicios || 'todos'} onValueChange={(v) => setFiltroPeriodoServicios(v === 'todos' ? '' : v)}>
                    <SelectTrigger className="w-full min-w-0 sm:w-[120px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'mes' : 'meses'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1 min-w-0 flex-1 sm:flex-initial w-full sm:max-w-xs">
                <Label className="text-xs text-muted-foreground">Filtrar por placa o apellido</Label>
                <Input
                  type="text"
                  placeholder="Placa o apellido..."
                  value={filtroPlacaApellido}
                  onChange={(e) => setFiltroPlacaApellido(e.target.value)}
                  className="w-full min-w-0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground block opacity-0 select-none pointer-events-none">Leyenda</Label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground shrink-0 h-9 items-center">
                  {uiBtnVisitante && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-200" aria-hidden />
                      Visitantes
                    </span>
                  )}
                  {uiBtnResidente && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" aria-hidden />
                      Residentes
                    </span>
                  )}
                  {uiBtnAbonado && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-200" aria-hidden />
                      Abonados
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cargaInicialListaServicios ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" aria-hidden />
                <span className="text-sm">Cargando servicios del mes…</span>
              </div>
            ) : mesesDisponibles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay meses con servicios registrados aún.</p>
            ) : serviciosList.length === 0 && !cargandoServiciosMes ? (
              <p className="text-muted-foreground text-center py-8">No hay servicios con los filtros aplicados</p>
            ) : !cargandoServiciosMes && serviciosList.length > 0 && serviciosListFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ningún registro coincide con la búsqueda</p>
            ) : (
              <div className="relative">
                {cargandoServiciosMes ? (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/75 backdrop-blur-[1px]"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary shrink-0" aria-hidden />
                    <span className="text-sm text-muted-foreground">Actualizando lista…</span>
                  </div>
                ) : null}
                <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
                {serviciosListFiltrados.map((servicio) => {
                  const tipo = servicio.vehiculo?.tipo
                  const nombreResidente = tipo === 'residente' &&
                    (servicio.vehiculo?.nombre_propietario || servicio.vehiculo?.apellido_propietario)
                    ? [servicio.vehiculo.nombre_propietario, servicio.vehiculo.apellido_propietario].filter(Boolean).join(' ')
                    : null
                  const nombreAbonado = tipo === 'abonado' &&
                    (servicio.vehiculo?.nombre_propietario || servicio.vehiculo?.apellido_propietario)
                    ? [servicio.vehiculo.nombre_propietario, servicio.vehiculo.apellido_propietario].filter(Boolean).join(' ')
                    : null
                  const iconColor = tipo === 'abonado' ? 'bg-sky-100 text-sky-600' : tipo === 'residente' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  return (
                    <div
                      key={servicio.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                          <Car className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono font-medium text-foreground truncate">
                              {servicio.vehiculo?.placa || 'Sin Placa'}
                            </p>
                            {tipo === 'abonado' && (
                              <>
                                <Badge variant="outline" className="text-xs shrink-0 border-sky-300 text-sky-700 bg-sky-50">
                                  <Star className="h-3 w-3 mr-0.5 fill-current" />
                                  {nombreAbonado || 'Abonado'}
                                </Badge>
                                {servicio.vehiculo?.abono_cancelado && (
                                  <Badge variant="secondary" className="text-xs shrink-0 bg-muted text-muted-foreground">
                                    Cancelado
                                  </Badge>
                                )}
                              </>
                            )}
                            {nombreResidente && (
                              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                {nombreResidente}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Plaza: {etiquetaPlazaServicio(servicio)}
                            {' · '}
                            {tipo === 'residente'
                              ? 'Residente'
                              : tipo === 'abonado'
                                ? servicio.vehiculo?.abono_cancelado
                                  ? `Abonado - Cancelado${servicio.vehiculo?.motivo_cancelacion_abono ? ` (${servicio.vehiculo.motivo_cancelacion_abono})` : ''}`
                                  : `Abonado${servicio.vehiculo?.ultimo_numero_meses_abono ? ` (${servicio.vehiculo.ultimo_numero_meses_abono} ${servicio.vehiculo.ultimo_numero_meses_abono === 1 ? 'mes' : 'meses'})` : ''} - Tiempo restante: ${tiempoRestanteAbono(servicio.vehiculo?.vigencia_abono_hasta)}`
                                : 'Visitante'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-foreground text-sm">
                            {formatCurrency(montoServicioParaMostrar(servicio))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {servicio.salida &&
                              new Date(servicio.salida).toLocaleString('es-PE', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
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
                          <Button variant="ghost" size="sm" onClick={() => setDeletingServicioId(servicio.id)} title="Eliminar registro" className="text-destructive hover:text-destructive shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Gestión de usuarios */}
        <Card className="border-border" id="usuarios-section">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de usuarios
            </CardTitle>
            <p className="text-sm text-muted-foreground">Agregar administradores o conserjes (nombre, apellido, usuario y contraseña).</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={nombreUser}
                    onChange={(e) => setNombreUser(e.target.value)}
                    placeholder="Juan"
                    required
                    disabled={savingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input
                    value={apellidoUser}
                    onChange={(e) => setApellidoUser(e.target.value)}
                    placeholder="Pérez"
                    required
                    disabled={savingUser}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuario (inicio de sesión)</Label>
                  <Input
                    value={usuarioUser}
                    onChange={(e) => setUsuarioUser(e.target.value)}
                    placeholder="jperez"
                    required
                    disabled={savingUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordUser}
                    onChange={(e) => setPasswordUser(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    required
                    minLength={4}
                    disabled={savingUser}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={rolUser} onValueChange={(v) => setRolUser(v as 'admin' | 'conserje')} disabled={savingUser}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="conserje">Conserje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={savingUser}>
                  {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Agregar usuario
                </Button>
              </div>
              {usuarioMsg && (
                <p className={`text-sm ${usuarioMsg.includes('correctamente') ? 'text-green-600' : 'text-destructive'}`}>
                  {usuarioMsg}
                </p>
              )}
            </form>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Usuarios registrados</h4>
              {usuarios.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay usuarios aún.</p>
              ) : (
                <>
                <div className="border border-border rounded-lg overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Usuario</th>
                        <th className="text-left p-3 font-medium">Rol</th>
                        <th className="text-right p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="p-3">{u.nombre} {u.apellido}</td>
                          <td className="p-3 font-mono">{u.usuario}</td>
                          <td className="p-3">
                            <span className={u.rol === 'admin' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                              {u.rol === 'admin' ? 'Administrador' : 'Conserje'}
                            </span>
                            {u.suspendido && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">Suspendido</Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              {u.usuario === 'admin' && currentUserId !== u.id ? (
                                <span className="text-xs text-muted-foreground">Solo editable por el propio usuario</span>
                              ) : (
                                <>
                                  {(u.usuario !== 'admin' || currentUserId === u.id) && (
                                    <>
                                      <Button variant="ghost" size="sm" onClick={() => openEditUser(u)} title="Editar">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => openResetPassword(u)} title="Resetear contraseña">
                                        <Key className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {u.usuario !== 'admin' && (
                                    <>
                                      {u.suspendido ? (
                                        <Button variant="ghost" size="sm" onClick={async () => { const r = await reactivarUsuario(u.id); if (r.ok) { const users = await getUsuarios(); setUsuarios(users) } else { setUsuarioMsg(r.error || 'Error') } }} title="Reactivar usuario">
                                          <UserCheck className="h-4 w-4 text-green-600" />
                                        </Button>
                                      ) : currentUserId !== u.id ? (
                                        <Button variant="ghost" size="sm" onClick={() => setSuspendingUser(u)} title="Suspender usuario" className="text-amber-600 hover:text-amber-600">
                                          <UserX className="h-4 w-4" />
                                        </Button>
                                      ) : null}
                                      {currentUserId !== u.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeletingUserId(u.id)}
                                          title="Eliminar"
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Editar usuario */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                  <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Editar usuario</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} disabled={savingEdit} />
                        </div>
                        <div className="space-y-2">
                          <Label>Apellido</Label>
                          <Input value={editApellido} onChange={(e) => setEditApellido(e.target.value)} disabled={savingEdit} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Usuario (inicio de sesión)</Label>
                        <Input value={editUsuario} onChange={(e) => setEditUsuario(e.target.value)} disabled={savingEdit} className="font-mono" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={editRol} onValueChange={(v) => setEditRol(v as 'admin' | 'conserje')} disabled={savingEdit}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="conserje">Conserje</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingUser(null)} disabled={savingEdit}>Cancelar</Button>
                      <Button onClick={handleGuardarEdicionUsuario} disabled={savingEdit || !editNombre.trim() || !editApellido.trim() || !editUsuario.trim()}>
                        {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Guardar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Resetear contraseña */}
                <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
                  <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Resetear contraseña</DialogTitle>
                      {resetPasswordUser && (
                        <p className="text-sm text-muted-foreground">Nueva contraseña para {resetPasswordUser.nombre} {resetPasswordUser.apellido} ({resetPasswordUser.usuario})</p>
                      )}
                    </DialogHeader>
                    <div className="py-4">
                      <Label>Nueva contraseña (mínimo 4 caracteres)</Label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-2" disabled={savingReset} minLength={4} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResetPasswordUser(null)} disabled={savingReset}>Cancelar</Button>
                      <Button onClick={handleResetPassword} disabled={savingReset || newPassword.trim().length < 4}>
                        {savingReset ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Guardar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Confirmar eliminar usuario */}
                <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
                  <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="break-words">¿Eliminar usuario?</AlertDialogTitle>
                      <AlertDialogDescription className="break-words">
                        Esta acción es irreversible. El usuario perderá el acceso al sistema de forma permanente y será eliminado de la base de datos. No podrá volver a iniciar sesión. ¿Está seguro de que desea continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletingUserId && handleEliminarUsuario(deletingUserId)} className="bg-destructive text-white hover:bg-destructive/90 hover:text-white">
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Confirmar suspender usuario */}
                <AlertDialog open={!!suspendingUser} onOpenChange={(open) => !open && setSuspendingUser(null)}>
                  <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="break-words">¿Suspender usuario?</AlertDialogTitle>
                      <AlertDialogDescription className="break-words">
                        El usuario no podrá iniciar sesión hasta que un administrador lo reactive desde esta misma vista. El registro se conserva. ¿Continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (suspendingUser) {
                            const r = await suspenderUsuario(suspendingUser.id)
                            setSuspendingUser(null)
                            if (r.ok) {
                              const users = await getUsuarios()
                              setUsuarios(users)
                            } else {
                              setUsuarioMsg(r.error || 'Error al suspender')
                            }
                          }
                        }}
                        className="bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
                      >
                        Sí, suspender
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>


        {/* 4. Estacionamientos */}
        <Card className="border-border" id="estacionamientos-section">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Estacionamientos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Defina cuántas plazas gestiona el edificio. Puede usar números correlativos (1, 2, 3…) o etiquetas manuales (A-1, Sótano 2…). El conserje asignará una plaza libre al registrar cada entrada.
            </p>
            <p className="text-sm font-medium text-foreground">
              Plazas configuradas: {listaEstacionamientos.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {listaEstacionamientos.length > 0 && !editandoPlazas ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Configuración fijada</span>
                  <Badge variant="secondary" className="font-normal">
                    {valoresFormularioDesdeLista(listaEstacionamientos).modo === 'correlativo'
                      ? 'Correlativos 1…N'
                      : 'Etiquetas manuales'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vista previa:{' '}
                  <span className="font-mono text-foreground">
                    {[...listaEstacionamientos]
                      .sort((a, b) => a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta))
                      .slice(0, 15)
                      .map((r) => r.etiqueta)
                      .join(', ')}
                    {listaEstacionamientos.length > 15 ? '…' : ''}
                  </span>
                </p>
                <Button type="button" variant="outline" onClick={() => setAlertaModificarPlazasOpen(true)}>
                  Modificar plazas
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {listaEstacionamientos.length > 0 && editandoPlazas && (
                    <Button type="button" variant="ghost" size="sm" onClick={cancelarEdicionPlazas}>
                      Cancelar edición
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={modoPlazas === 'correlativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModoPlazas('correlativo')}
                  >
                    Correlativos
                  </Button>
                  <Button
                    type="button"
                    variant={modoPlazas === 'manual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModoPlazas('manual')}
                  >
                    Manual
                  </Button>
                </div>
                {modoPlazas === 'correlativo' ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-2">
                      <Label>Cantidad de plazas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        className="w-28"
                        value={cantidadPlazasCorr}
                        onChange={(e) => setCantidadPlazasCorr(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={handleGuardarPlazasCorrelativo} disabled={savingPlazas}>
                      {savingPlazas ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Guardar correlativos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Una etiqueta por línea o separadas por coma (ej. A-1, A-2, B1)</Label>
                    <Textarea
                      value={textoPlazasManual}
                      onChange={(e) => setTextoPlazasManual(e.target.value)}
                      placeholder={'A-1\nA-2\nB1'}
                      rows={5}
                      className="font-mono text-sm"
                    />
                    <Button type="button" onClick={handleGuardarPlazasManual} disabled={savingPlazas}>
                      {savingPlazas ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Guardar manual
                    </Button>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Puede ampliar el número de plazas o el listado en cualquier momento. Si reduce plazas y alguna de las que
              quedaría fuera sigue ocupada, deberá finalizar ese servicio antes. Los tickets y reportes antiguos conservan la
              etiqueta registrada en su momento.
            </p>
            {plazaMsg && (
              <p className={`text-sm ${plazaMsg.includes('guardad') ? 'text-green-600' : 'text-destructive'}`}>{plazaMsg}</p>
            )}
            <AlertDialog open={alertaModificarPlazasOpen} onOpenChange={setAlertaModificarPlazasOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Modificar las plazas?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Al guardar de nuevo, la lista de estacionamientos se reemplaza por la nueva configuración (agregar o
                        quitar plazas según lo que indique).
                      </p>
                      <p>
                        Solo si intenta bajar el número de plazas (o quitar etiquetas del listado manual) por debajo de
                        plazas que sigan ocupadas, el sistema pedirá finalizar esos servicios primero. Puede aumentar plazas
                        con normalidad aunque haya ocupación.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Volver</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmarModificarPlazas}>Entiendo, continuar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* 5. Tarifas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tarifas
            </CardTitle>
            <p className="text-sm text-muted-foreground">Precio por hora (visitante/residente) y precio mensual para abonados.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <div className="space-y-2">
                <Label>Visitante (S/ por hora)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tarifaVisitante}
                  onChange={(e) => setTarifaVisitante(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Residente (S/ por hora)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tarifaResidente}
                  onChange={(e) => setTarifaResidente(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Abonado (S/ por mes)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tarifaAbonado}
                  onChange={(e) => setTarifaAbonado(e.target.value)}
                  placeholder="Ej. 100"
                  className="w-32"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGuardarTarifas} disabled={savingTarifas}>
                  {savingTarifas ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar tarifas
                </Button>
              </div>
            </div>
            {tarifaMsg && (
              <p className={`text-sm ${tarifaMsg.includes('correctamente') ? 'text-green-600' : 'text-destructive'}`}>
                {tarifaMsg}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 6. Gráficas y reportes (colapsado por defecto, filtros solo aquí) */}
        <Collapsible open={reportesExpandido} onOpenChange={setReportesExpandido}>
          <Card className="border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2 min-w-0">
                  {reportesExpandido ? <ChevronDown className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
                  <CardTitle className="text-foreground text-base sm:text-lg break-words">Gráficas y reportes</CardTitle>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground break-words min-w-0">Desplegar para ver. Filtros de fecha y tipo solo afectan esta sección.</p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4 overflow-hidden">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
                  <div className="space-y-2 min-w-0 flex-1 sm:flex-initial sm:w-auto">
                    <Label>Desde</Label>
                    <Input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} className="w-full min-w-0" />
                  </div>
                  <div className="space-y-2 min-w-0 flex-1 sm:flex-initial sm:w-auto">
                    <Label>Hasta</Label>
                    <Input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} className="w-full min-w-0" />
                  </div>
                  <div className="space-y-2 min-w-0 w-full sm:w-auto">
                    <Label>Tipo de usuario</Label>
                    <Select value={filtroTipo || 'todos'} onValueChange={(v) => { setFiltroTipo(v === 'todos' ? '' : (v as 'visitante' | 'residente' | 'abonado')); if (v !== 'abonado') setFiltroPeriodoReportes('') }}>
                      <SelectTrigger className="w-full min-w-0 sm:w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="visitante">Visitante</SelectItem>
                        <SelectItem value="residente">Residente</SelectItem>
                        <SelectItem value="abonado">Abonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {filtroTipo === 'abonado' && (
                    <div className="space-y-2 min-w-0 w-full sm:w-auto">
                      <Label>Período abonado</Label>
                      <Select value={filtroPeriodoReportes || 'todos'} onValueChange={(v) => setFiltroPeriodoReportes(v === 'todos' ? '' : v)}>
                        <SelectTrigger className="w-full min-w-0 sm:w-[140px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'mes' : 'meses'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button variant="secondary" onClick={loadReportesData} disabled={loadingReportes} className="w-full sm:w-auto shrink-0">Aplicar filtros</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Vehículos activos</CardTitle>
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{activeCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">En el estacionamiento ahora</p>
                    </CardContent>
                  </Card>
                  {filtroTipo === '' ? (
                    <>
                      <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total ingresos diarios</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{formatCurrency(totalDiarioReportes)}</div>
                          <p className="text-xs text-muted-foreground mt-1">Visitantes y residentes (día a día)</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total abonados</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-foreground">{formatCurrency(totalAbonadosReportes)}</div>
                          <p className="text-xs text-muted-foreground mt-1">Mensualidades abonados</p>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="border-border">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total (filtro)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(totalFiltradoReportes)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{serviciosCountReportes} servicios</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Período</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium text-foreground">
                        {filtroFechaDesde || filtroFechaHasta ? `${filtroFechaDesde || '...'} a ${filtroFechaHasta || '...'}` : 'Sin filtro de fechas'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {filtroTipo ? (filtroTipo === 'visitante' ? 'Solo visitantes' : filtroTipo === 'residente' ? 'Solo residentes' : filtroPeriodoReportes ? `Abonados ${filtroPeriodoReportes} ${Number(filtroPeriodoReportes) === 1 ? 'mes' : 'meses'}` : 'Solo abonados') : 'Todos los tipos'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-border">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="text-foreground text-base sm:text-lg">
                          {filtroTipo === 'abonado'
                            ? 'Ingresos por abonados'
                            : filtroTipo === 'visitante'
                              ? 'Ingresos por día — Visitantes'
                              : filtroTipo === 'residente'
                                ? 'Ingresos por día — Residentes'
                                : 'Ingresos por día (visitantes y residentes)'}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Leyenda: {leyendaDatos}. {textoPeriodo}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={tipoGrafico} onValueChange={(v) => setTipoGrafico(v as 'bar' | 'pie')}>
                          <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] sm:min-h-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">Barras</SelectItem>
                            <SelectItem value="pie">Circular</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={exportarExcel} disabled={serviciosParaReportes.length === 0}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportarPDF} disabled={serviciosParaReportes.length === 0}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IncomeChart
                      data={chartData}
                      tipo={tipoGrafico}
                      leyenda={leyendaDatos}
                      dataConTipo={filtroTipo === '' ? chartDataConTipo : undefined}
                    />
                  </CardContent>
                </Card>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        </div>

        {/* Diálogos fuera de la columna de secciones para que el espaciado (gap) solo aplique entre bloques visibles */}
        <Dialog open={!!cancelandoAbono} onOpenChange={(open) => { if (!open) { setCancelandoAbono(null); setMotivoCancelacion(''); setMotivoCancelacionOtro('') } }}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden">
            <DialogHeader>
              <DialogTitle>¿Cancelar suscripción?</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Este abonado ya no renovará. Se quitará de la lista de alertas pero el registro se conserva. Indique el motivo de cancelación (obligatorio).
              </p>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Motivo de cancelación</Label>
                <Select value={motivoCancelacion} onValueChange={(v) => { setMotivoCancelacion(v); if (v !== 'otro') setMotivoCancelacionOtro('') }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_respondio">El cliente no respondió</SelectItem>
                    <SelectItem value="no_desea">No desea más la suscripción</SelectItem>
                    <SelectItem value="pagar_horas">Desea pagar por horas</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {motivoCancelacion === 'otro' && (
                <div className="space-y-2">
                  <Label>Especifique el motivo</Label>
                  <Input
                    placeholder="Motivo..."
                    value={motivoCancelacionOtro}
                    onChange={(e) => setMotivoCancelacionOtro(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCancelandoAbono(null); setMotivoCancelacion(''); setMotivoCancelacionOtro('') }}>No, volver</Button>
              <Button
                variant="destructive"
                disabled={!motivoCancelacion || (motivoCancelacion === 'otro' && !motivoCancelacionOtro.trim())}
                onClick={async () => {
                  if (!cancelandoAbono) return
                  const motivoTexto = motivoCancelacion === 'otro' ? motivoCancelacionOtro.trim() : (motivoCancelacion === 'no_respondio' ? 'El cliente no respondió' : motivoCancelacion === 'no_desea' ? 'No desea más la suscripción' : motivoCancelacion === 'pagar_horas' ? 'Desea pagar por horas' : motivoCancelacion)
                  if (!motivoTexto) return
                  const telefono = cancelandoAbono.telefono_contacto ? normalizarTelefonoWhatsApp(cancelandoAbono.telefono_contacto) : ''
                  await cancelarAbono(cancelandoAbono.id, motivoTexto)
                  const mensajeCancelacion = buildMensajeDespedidaAbonado(cancelandoAbono)
                  const url = telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeCancelacion)}` : `https://wa.me/?text=${encodeURIComponent(mensajeCancelacion)}`
                  window.open(url, '_blank')
                  setCancelandoAbono(null)
                  setMotivoCancelacion('')
                  setMotivoCancelacionOtro('')
                  loadData()
                }}
              >
                Sí, cancelar suscripción
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle del servicio */}
        <Dialog open={!!servicioDetalle} onOpenChange={(open) => !open && setServicioDetalle(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden">
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
                  <span className="text-muted-foreground">Estacionamiento</span>
                  <span className="font-mono font-medium">{etiquetaPlazaServicio(servicioDetalle)}</span>
                  <span className="text-muted-foreground">Tipo</span>
                  <span>{servicioDetalle.vehiculo?.tipo === 'residente' ? 'Residente' : servicioDetalle.vehiculo?.tipo === 'abonado' ? (servicioDetalle.vehiculo?.abono_cancelado ? `Abonado - Cancelado${servicioDetalle.vehiculo?.motivo_cancelacion_abono ? ` (${servicioDetalle.vehiculo.motivo_cancelacion_abono})` : ''}` : 'Abonado') : 'Visitante'}</span>
                  {servicioDetalle.vehiculo?.tipo === 'abonado' && servicioDetalle.vehiculo?.abono_cancelado && servicioDetalle.vehiculo?.motivo_cancelacion_abono && (
                    <>
                      <span className="text-muted-foreground">Motivo cancelación</span>
                      <span>{servicioDetalle.vehiculo.motivo_cancelacion_abono}</span>
                    </>
                  )}
                  {servicioDetalle.vehiculo?.tipo === 'abonado' && !servicioDetalle.vehiculo?.abono_cancelado && (
                    <>
                      {servicioDetalle.vehiculo.vigencia_abono_hasta && (
                        <>
                          <span className="text-muted-foreground">Vigencia abono hasta</span>
                          <span>{servicioDetalle.vehiculo.vigencia_abono_hasta}</span>
                        </>
                      )}
                      {servicioDetalle.vehiculo.ref_pago_abono && (
                        <>
                          <span className="text-muted-foreground">Ref. pago abono</span>
                          <span className="font-mono text-xs">{servicioDetalle.vehiculo.ref_pago_abono}</span>
                        </>
                      )}
                      {servicioDetalle.vehiculo.captura_pago_abono && (
                        <>
                          <span className="text-muted-foreground">Captura del pago</span>
                          <span>
                            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => setVerCapturaUrl(servicioDetalle.vehiculo!.captura_pago_abono ?? null)}>
                              Ver captura
                            </Button>
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {(servicioDetalle.vehiculo?.nombre_propietario || servicioDetalle.vehiculo?.apellido_propietario) && (
                    <>
                      <span className="text-muted-foreground">Nombre</span>
                      <span>
                        {[servicioDetalle.vehiculo.nombre_propietario, servicioDetalle.vehiculo.apellido_propietario].filter(Boolean).join(' ')}
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
                  <span>{new Date(servicioDetalle.entrada_real).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
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
                  <span className="font-semibold">{formatCurrency(montoServicioParaMostrar(servicioDetalle))}</span>
                  {servicioDetalle.ref_pago_yape && (
                    <>
                      <span className="text-muted-foreground">Ref. Yape</span>
                      <span className="font-mono text-xs break-all">{servicioDetalle.ref_pago_yape}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Teléfono (WhatsApp)</span>
                  <span className="font-mono text-xs">{servicioDetalle.vehiculo?.telefono_contacto || '—'}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleImprimirServicioDetalle}>
                    Imprimir ticket
                  </Button>
                  <Button variant="default" size="sm" onClick={handleAbrirWhatsApp}>
                    Enviar por WhatsApp
                  </Button>
                  {servicioDetalle.vehiculo?.tipo === 'abonado' && servicioDetalle.vehiculo?.abono_cancelado && (
                    <Button variant="secondary" size="sm" onClick={handleEnviarMensajeDespedida}>
                      Enviar mensaje de despedida
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo: número para enviar ticket por WhatsApp */}
        <Dialog open={whatsappOpen} onOpenChange={(open) => !open && setWhatsappOpen(false)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm overflow-hidden">
            <DialogHeader>
              <DialogTitle>Enviar ticket por WhatsApp</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {servicioDetalle?.vehiculo?.telefono_contacto
                  ? 'Elija enviar al número ya registrado o ingrese uno nuevo (se guardará para futuras consultas).'
                  : 'Ingrese el número al que enviar el mensaje. Se guardará para futuras consultas y reportes.'}
              </p>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {servicioDetalle?.vehiculo?.telefono_contacto ? (
                <>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Select value={whatsappOpcion} onValueChange={(v) => setWhatsappOpcion(v as 'guardado' | 'nuevo')} disabled={whatsappSaving}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guardado">
                          Enviar al número registrado ({servicioDetalle.vehiculo.telefono_contacto})
                        </SelectItem>
                        <SelectItem value="nuevo">Usar otro número</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {whatsappOpcion === 'nuevo' && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-phone">Número (ej: 987 654 321)</Label>
                      <Input
                        id="whatsapp-phone"
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="987654321"
                        disabled={whatsappSaving}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone">Número (ej: 987 654 321)</Label>
                  <Input
                    id="whatsapp-phone"
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="987654321"
                    disabled={whatsappSaving}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappOpen(false)} disabled={whatsappSaving}>
                Cancelar
              </Button>
              <Button onClick={handleEnviarWhatsAppServicio} disabled={whatsappSaving}>
                {whatsappSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo: registrar pago abono (meses + ref + captura opcional) */}
        <Dialog open={!!renovarAbonoDialog} onOpenChange={(open) => !open && (setRenovarAbonoDialog(null), setRenovarCapturaFile(null))}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm overflow-hidden">
            <DialogHeader>
              <DialogTitle>Registrar pago de mensualidad</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {renovarAbonoDialog && `${renovarAbonoDialog.placa || 'Sin placa'}. El nuevo periodo se calcula desde el fin del anterior (o desde hoy si ya venció).`}
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
                <Label htmlFor="renovar-ref">Nº operación Yape / Transferencia (opcional)</Label>
                <Input
                  id="renovar-ref"
                  value={renovarRefPago}
                  onChange={(e) => setRenovarRefPago(e.target.value)}
                  placeholder="Ej. 123456789"
                  disabled={!!renovandoAbonoId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renovar-captura">Captura del pago (opcional)</Label>
                <Input
                  id="renovar-captura"
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

        {/* Vista previa captura del pago */}
        <Dialog open={!!verCapturaUrl} onOpenChange={(open) => !open && setVerCapturaUrl(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Captura del pago</DialogTitle>
            </DialogHeader>
            {verCapturaUrl && (
              <div className="flex justify-center bg-muted/30 rounded-lg p-2">
                <img src={verCapturaUrl} alt="Captura del pago" className="max-w-full max-h-[70vh] object-contain rounded" />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmar eliminar servicio - siempre en DOM */}
        <AlertDialog open={!!deletingServicioId} onOpenChange={(open) => !open && setDeletingServicioId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="break-words">¿Eliminar registro de servicio?</AlertDialogTitle>
              <AlertDialogDescription className="break-words">
                Esta acción es irreversible. El registro no podrá recuperarse y se eliminará de la base de datos de forma permanente. Tampoco volverá a aparecer en los reportes ni en ninguna consulta. ¿Está seguro de que desea continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingServicioId && handleEliminarServicio(deletingServicioId)} className="bg-destructive text-white hover:bg-destructive/90 hover:text-white">
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EstacionamientoMapaDialog
          open={mapaPlazasOpen}
          onOpenChange={setMapaPlazasOpen}
          soloConsulta
        />
      </main>
      </div>
    </div>
  )
}
