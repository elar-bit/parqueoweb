'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  resetearPasswordUsuario,
  eliminarServicio,
  actualizarVehiculo,
  getAbonadosVencidos,
  getAbonadosPorVencer,
  renovarAbono,
  type FiltrosAdmin,
  type UsuarioRow,
} from '@/app/actions'
import type { ServicioConVehiculo, Configuracion, Vehiculo } from '@/lib/types'
import { formatCurrency, formatMesAno } from '@/lib/billing'
import { Car, DollarSign, RefreshCw, BarChart3, LogOut, Settings, Loader2, Users, UserPlus, Pencil, Trash2, Key, FileSpreadsheet, FileText, Info, CalendarCheck, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
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
import { ChevronDown, ChevronRight } from 'lucide-react'

export function AdminDashboard() {
  const [activeCount, setActiveCount] = useState(0)
  const [chartData, setChartData] = useState<{ fecha: string; total: number }[]>([])
  const [chartDataConTipo, setChartDataConTipo] = useState<{ fecha: string; visitantes: number; residentes: number }[]>([])
  const [serviciosList, setServiciosList] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'visitante' | 'residente' | 'abonado' | ''>('')
  const [abonadosVencidos, setAbonadosVencidos] = useState<Vehiculo[]>([])
  const [abonadosPorVencer, setAbonadosPorVencer] = useState<Vehiculo[]>([])

  // Cambio mínimo sin impacto funcional para forzar diff

  const [renovandoAbonoId, setRenovandoAbonoId] = useState<string | null>(null)
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
  const [renovarNumeroMeses, setRenovarNumeroMeses] = useState<number>(1)
  const [reportesExpandido, setReportesExpandido] = useState(false)
  const [filtroMesServicios, setFiltroMesServicios] = useState<string>('')
  const [mesesDisponibles, setMesesDisponibles] = useState<string[]>([])
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
  const [deletingServicioId, setDeletingServicioId] = useState<string | null>(null)
  const [servicioDetalle, setServicioDetalle] = useState<ServicioConVehiculo | null>(null)
  const [whatsappOpen, setWhatsappOpen] = useState(false)
  const [whatsappOpcion, setWhatsappOpcion] = useState<'guardado' | 'nuevo'>('guardado')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappSaving, setWhatsappSaving] = useState(false)

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
        await actualizarVehiculo(servicioDetalle.vehiculo.id, { telefono_contacto: numero })
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

  const rangoMesServicios = (() => {
    if (!filtroMesServicios || !/^\d{4}-\d{2}$/.test(filtroMesServicios)) {
      return { fechaDesde: '', fechaHasta: '' }
    }
    const [y, m] = filtroMesServicios.split('-').map(Number)
    const ultimoDia = new Date(y, m, 0).getDate()
    return {
      fechaDesde: `${filtroMesServicios}-01`,
      fechaHasta: `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
    }
  })()

  useEffect(() => {
    getMesesConServicios().then((meses) => {
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
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const serviciosPromise = rangoMesServicios.fechaDesde
        ? getServiciosPagadosFiltrados({ fechaDesde: rangoMesServicios.fechaDesde, fechaHasta: rangoMesServicios.fechaHasta })
        : Promise.resolve([])
      const [activos, servicios, config, users, vencidos, porVencer] = await Promise.all([
        getServiciosActivos(),
        serviciosPromise,
        getConfiguracion(),
        getUsuarios(),
        getAbonadosVencidos(),
        getAbonadosPorVencer(7),
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
      setTarifaVisitante(visitante ? String(visitante.precio_hora) : '')
      setTarifaResidente(residente ? String(residente.precio_hora) : '')
      setTarifaAbonado(abonado ? String(abonado.precio_hora) : '')
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [rangoMesServicios.fechaDesde, rangoMesServicios.fechaHasta])

  const loadReportesData = useCallback(async () => {
    setLoadingReportes(true)
    try {
      const [ingresos, ingresosConTipo, servicios] = await Promise.all([
        getIngresosFiltrados(filtrosReportes),
        filtroTipo === '' ? getIngresosFiltradosConTipo({ ...filtrosReportes, tipo: null }) : Promise.resolve([]),
        getServiciosPagadosFiltrados(filtrosReportes),
      ])
      setChartData(ingresos)
      setChartDataConTipo(ingresosConTipo)
      setServiciosParaReportes(servicios)
    } catch (error) {
      console.error('Error loading reportes data:', error)
    } finally {
      setLoadingReportes(false)
    }
  }, [filtroFechaDesde, filtroFechaHasta, filtroTipo])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (reportesExpandido) loadReportesData()
  }, [reportesExpandido, loadReportesData])

  const totalFiltradoReportes = chartData.reduce((sum, d) => sum + d.total, 0)
  const serviciosCountReportes = serviciosParaReportes.length
  const filtroPlacaApellidoNorm = filtroPlacaApellido.trim().toLowerCase()
  const serviciosListFiltrados =
    !filtroPlacaApellidoNorm
      ? serviciosList
      : serviciosList.filter((s) => {
          const placa = (s.vehiculo?.placa ?? '').toLowerCase()
          const apellido = (s.vehiculo?.apellido_propietario ?? '').toLowerCase()
          const nombre = (s.vehiculo?.nombre_propietario ?? '').toLowerCase()
          return (
            placa.includes(filtroPlacaApellidoNorm) ||
            apellido.includes(filtroPlacaApellidoNorm) ||
            nombre.includes(filtroPlacaApellidoNorm)
          )
        })
  const serviciosCount = serviciosListFiltrados.length

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

  const handleLogout = async () => {
    await logoutAdmin()
    window.location.reload()
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
    } catch {
      setUsuarioMsg('Error de conexión')
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
    } catch {
      setUsuarioMsg('Error de conexión')
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
    } catch {
      setUsuarioMsg('Error de conexión')
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
    const headers = ['Fecha salida', 'Placa', 'Tipo', 'Nombre', 'Oficina/Depto', 'Teléfono (WhatsApp)', 'Entrada', 'Salida', 'Total (S/)', 'Ref. Yape o Transferencia']
    const rows = serviciosParaReportes.map((s) => {
      const nombre = (s.vehiculo?.tipo === 'residente' || s.vehiculo?.tipo === 'abonado') && (s.vehiculo.nombre_propietario || s.vehiculo.apellido_propietario)
        ? [s.vehiculo.nombre_propietario, s.vehiculo.apellido_propietario].filter(Boolean).join(' ')
        : ''
      const refPago = (s.ref_pago_yape ?? s.vehiculo?.ref_pago_abono ?? '') as string
      return [
        s.salida ? new Date(s.salida).toLocaleDateString('es-PE') : '',
        s.vehiculo?.placa || 'Sin placa',
        s.vehiculo?.tipo === 'residente' ? 'Residente' : s.vehiculo?.tipo === 'abonado' ? 'Abonado' : 'Visitante',
        nombre,
        s.vehiculo?.numero_oficina_dep ?? '',
        s.vehiculo?.telefono_contacto ?? '',
        s.entrada_real ? new Date(s.entrada_real).toLocaleString('es-PE') : '',
        s.salida ? new Date(s.salida).toLocaleString('es-PE') : '',
        String(s.total_pagar ?? ''),
        refPago,
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
              <th>Fecha salida</th><th>Placa</th><th>Tipo</th><th>Nombre</th><th>Oficina/Depto</th><th>Teléfono (WhatsApp)</th>
              <th>Entrada</th><th>Salida</th><th>Total (S/)</th><th>Ref. Yape o Transferencia</th>
            </tr></thead>
            <tbody>
              ${serviciosParaReportes.map((s) => {
                const nombre = (s.vehiculo?.tipo === 'residente' || s.vehiculo?.tipo === 'abonado') && (s.vehiculo.nombre_propietario || s.vehiculo.apellido_propietario)
                  ? [s.vehiculo.nombre_propietario, s.vehiculo.apellido_propietario].filter(Boolean).join(' ')
                  : ''
                const refPago = s.ref_pago_yape ?? s.vehiculo?.ref_pago_abono ?? ''
                const esc = (v: string) => (v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                return `
                <tr>
                  <td>${s.salida ? new Date(s.salida).toLocaleDateString('es-PE') : ''}</td>
                  <td>${esc(s.vehiculo?.placa || 'Sin placa')}</td>
                  <td>${s.vehiculo?.tipo === 'residente' ? 'Residente' : s.vehiculo?.tipo === 'abonado' ? 'Abonado' : 'Visitante'}</td>
                  <td>${esc(nombre)}</td>
                  <td>${esc(s.vehiculo?.numero_oficina_dep ?? '')}</td>
                  <td>${esc(s.vehiculo?.telefono_contacto ?? '')}</td>
                  <td>${s.entrada_real ? new Date(s.entrada_real).toLocaleString('es-PE') : ''}</td>
                  <td>${s.salida ? new Date(s.salida).toLocaleString('es-PE') : ''}</td>
                  <td>${s.total_pagar ?? ''}</td>
                  <td>${esc(refPago)}</td>
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
    <div className="min-h-screen bg-background">
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
              <Button variant="ghost" size="sm" asChild className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <Link href="/conserje">Conserje</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 1. Alertas de abonados */}
        {(abonadosVencidos.length > 0 || abonadosPorVencer.length > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5" id="abonados-alertas">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Alertas de abonados
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Abonados con mensualidad vencida o que vence en los próximos 7 días.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {abonadosPorVencer.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-medium">{v.placa || 'Sin placa'}</span>
                      {(v.nombre_propietario || v.apellido_propietario) && (
                        <span className="text-sm text-muted-foreground truncate">
                          {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {v.vigencia_abono_hasta && (
                        <span className="text-xs text-muted-foreground">Vence: {v.vigencia_abono_hasta}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </li>
                ))}
                {abonadosVencidos.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-medium">{v.placa || 'Sin placa'}</span>
                      {(v.nombre_propietario || v.apellido_propietario) && (
                        <span className="text-sm text-muted-foreground truncate">
                          {[v.nombre_propietario, v.apellido_propietario].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {v.vigencia_abono_hasta && (
                        <span className="text-xs text-muted-foreground">Vencía: {v.vigencia_abono_hasta}</span>
                      )}
                      {v.captura_pago_abono && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => setVerCapturaUrl(v.captura_pago_abono ?? null)}>
                          Ver captura
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
            <div className="pt-2 flex flex-row flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mes</Label>
                <Select
                  value={filtroMesServicios || (mesesDisponibles[0] ?? '__vacio__')}
                  onValueChange={(v) => v !== '__vacio__' && setFiltroMesServicios(v)}
                  disabled={mesesDisponibles.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
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
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Filtrar por placa o apellido</Label>
                <Input
                  type="text"
                  placeholder="Placa o apellido..."
                  value={filtroPlacaApellido}
                  onChange={(e) => setFiltroPlacaApellido(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {serviciosList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay servicios con los filtros aplicados</p>
            ) : serviciosListFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ningún registro coincide con la búsqueda</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
                {serviciosListFiltrados.map((servicio) => {
                  const nombreResidente = servicio.vehiculo?.tipo === 'residente' &&
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
                            {servicio.vehiculo?.tipo === 'residente' ? 'Residente' : servicio.vehiculo?.tipo === 'abonado' ? 'Abonado' : 'Visitante'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
            )}
          </CardContent>
        </Card>

        {/* 3. Gestión de usuarios */}
        <Card className="border-border">
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
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditUser(u)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openResetPassword(u)} title="Resetear contraseña">
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeletingUserId(u.id)} title="Eliminar" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Editar usuario */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                  <DialogContent>
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
                  <DialogContent>
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
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer. El usuario no podrá volver a iniciar sesión.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletingUserId && handleEliminarUsuario(deletingUserId)} className="bg-destructive text-white hover:bg-destructive/90 hover:text-white">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>


        {/* 4. Tarifas */}
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

        {/* 5. Gráficas y reportes (colapsado por defecto, filtros solo aquí) */}
        <Collapsible open={reportesExpandido} onOpenChange={setReportesExpandido}>
          <Card className="border-border">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  {reportesExpandido ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CardTitle className="text-foreground text-base sm:text-lg">Gráficas y reportes</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">Desplegar para ver. Filtros de fecha y tipo solo afectan esta sección.</p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <Input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <Input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de usuario</Label>
                    <Select value={filtroTipo || 'todos'} onValueChange={(v) => setFiltroTipo(v === 'todos' ? '' : (v as 'visitante' | 'residente' | 'abonado'))}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="visitante">Visitante</SelectItem>
                        <SelectItem value="residente">Residente</SelectItem>
                        <SelectItem value="abonado">Abonado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="secondary" onClick={loadReportesData} disabled={loadingReportes}>Aplicar filtros</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                        {filtroTipo ? (filtroTipo === 'visitante' ? 'Solo visitantes' : filtroTipo === 'residente' ? 'Solo residentes' : 'Solo abonados') : 'Todos los tipos'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-border">
                  <CardHeader className="p-4 sm:p-6 pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="text-foreground text-base sm:text-lg">
                          Ingresos por día
                          {filtroTipo === 'visitante' && ' — Visitantes'}
                          {filtroTipo === 'residente' && ' — Residentes'}
                          {filtroTipo === 'abonado' && ' — Abonados'}
                          {filtroTipo === '' && ' — Visitantes y Residentes'}
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

        {/* Detalle del servicio */}
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
                  <span>{servicioDetalle.vehiculo?.tipo === 'residente' ? 'Residente' : servicioDetalle.vehiculo?.tipo === 'abonado' ? 'Abonado' : 'Visitante'}</span>
                  {servicioDetalle.vehiculo?.tipo === 'abonado' && (
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
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleImprimirServicioDetalle}>
                    Imprimir ticket
                  </Button>
                  <Button variant="default" size="sm" onClick={handleAbrirWhatsApp}>
                    Enviar por WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo: número para enviar ticket por WhatsApp */}
        <Dialog open={whatsappOpen} onOpenChange={(open) => !open && setWhatsappOpen(false)}>
          <DialogContent className="max-w-sm">
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
          <DialogContent className="max-w-sm">
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar registro de servicio?</AlertDialogTitle>
              <AlertDialogDescription>El registro se borrará de la base de datos de forma permanente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingServicioId && handleEliminarServicio(deletingServicioId)} className="bg-destructive text-white hover:bg-destructive/90 hover:text-white">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
