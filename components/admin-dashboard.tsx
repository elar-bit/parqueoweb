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
  getConfiguracion,
  updateConfiguracion,
  logoutAdmin,
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  resetearPasswordUsuario,
  eliminarServicio,
  type FiltrosAdmin,
  type UsuarioRow,
} from '@/app/actions'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'
import { formatCurrency } from '@/lib/billing'
import { Car, DollarSign, RefreshCw, BarChart3, LogOut, Settings, Loader2, Users, UserPlus, Pencil, Trash2, Key, FileSpreadsheet, FileText } from 'lucide-react'
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

export function AdminDashboard() {
  const [activeCount, setActiveCount] = useState(0)
  const [chartData, setChartData] = useState<{ fecha: string; total: number }[]>([])
  const [chartDataConTipo, setChartDataConTipo] = useState<{ fecha: string; visitantes: number; residentes: number }[]>([])
  const [serviciosList, setServiciosList] = useState<ServicioConVehiculo[]>([])
  const [configuracion, setConfiguracion] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'visitante' | 'residente' | ''>('')

  const [tarifaVisitante, setTarifaVisitante] = useState('')
  const [tarifaResidente, setTarifaResidente] = useState('')
  const [savingTarifas, setSavingTarifas] = useState(false)
  const [tarifaMsg, setTarifaMsg] = useState('')

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

  const [tipoGrafico, setTipoGrafico] = useState<'bar' | 'pie'>('bar')

  const filtros: FiltrosAdmin = {
    fechaDesde: filtroFechaDesde || null,
    fechaHasta: filtroFechaHasta || null,
    tipo: filtroTipo === '' ? null : (filtroTipo as 'visitante' | 'residente'),
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [activos, ingresos, ingresosConTipo, servicios, config, users] = await Promise.all([
        getServiciosActivos(),
        getIngresosFiltrados(filtros),
        filtroTipo === '' ? getIngresosFiltradosConTipo({ ...filtros, tipo: null }) : Promise.resolve([]),
        getServiciosPagadosFiltrados(filtros),
        getConfiguracion(),
        getUsuarios(),
      ])
      setActiveCount(activos.length)
      setChartData(ingresos)
      setChartDataConTipo(ingresosConTipo)
      setServiciosList(servicios)
      setConfiguracion(config)
      setUsuarios(users)
      const visitante = config.find((c) => c.tipo_usuario === 'visitante')
      const residente = config.find((c) => c.tipo_usuario === 'residente')
      setTarifaVisitante(visitante ? String(visitante.precio_hora) : '')
      setTarifaResidente(residente ? String(residente.precio_hora) : '')
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [filtroFechaDesde, filtroFechaHasta, filtroTipo])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalFiltrado = chartData.reduce((sum, d) => sum + d.total, 0)
  const serviciosCount = serviciosList.length

  const leyendaDatos =
    filtroTipo === 'visitante'
      ? 'Solo visitantes'
      : filtroTipo === 'residente'
        ? 'Solo residentes'
        : 'Todos los tipos (visitantes y residentes)'
  const textoPeriodo =
    filtroFechaDesde || filtroFechaHasta
      ? `Período: ${filtroFechaDesde || '...'} a ${filtroFechaHasta || '...'}`
      : 'Sin filtro de fechas'

  const handleGuardarTarifas = async () => {
    const v = parseFloat(tarifaVisitante)
    const r = parseFloat(tarifaResidente)
    if (isNaN(v) || isNaN(r) || v < 0 || r < 0) {
      setTarifaMsg('Ingrese valores numéricos válidos.')
      return
    }
    setSavingTarifas(true)
    setTarifaMsg('')
    try {
      const [resV, resR] = await Promise.all([
        updateConfiguracion('visitante', v),
        updateConfiguracion('residente', r),
      ])
      if (resV.ok && resR.ok) {
        setTarifaMsg('Tarifas actualizadas correctamente.')
      } else {
        setTarifaMsg(resV.error || resR.error || 'Error al guardar')
      }
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
    const headers = ['Fecha', 'Placa', 'Tipo', 'Total (S/)', 'Salida']
    const rows = serviciosList.map((s) => [
      s.salida ? new Date(s.salida).toLocaleDateString('es-PE') : '',
      s.vehiculo?.placa || 'Sin placa',
      s.vehiculo?.tipo === 'residente' ? 'Residente' : 'Visitante',
      String(s.total_pagar ?? ''),
      s.salida ? new Date(s.salida).toLocaleString('es-PE') : '',
    ])
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
            <thead><tr><th>Fecha</th><th>Placa</th><th>Tipo</th><th>Total (S/)</th><th>Salida</th></tr></thead>
            <tbody>
              ${serviciosList.map((s) => `
                <tr>
                  <td>${s.salida ? new Date(s.salida).toLocaleDateString('es-PE') : ''}</td>
                  <td>${(s.vehiculo?.placa || 'Sin placa').replace(/</g, '&lt;')}</td>
                  <td>${s.vehiculo?.tipo === 'residente' ? 'Residente' : 'Visitante'}</td>
                  <td>${s.total_pagar ?? ''}</td>
                  <td>${s.salida ? new Date(s.salida).toLocaleString('es-PE') : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="fecha" style="margin-top: 16px;">Total: S/ ${totalFiltrado.toFixed(2)} (${serviciosCount} servicios)</p>
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
        {/* Filtros */}
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-foreground text-base sm:text-lg">
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-wrap gap-3 sm:gap-4 items-end">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de usuario</Label>
                <Select value={filtroTipo || 'todos'} onValueChange={(v) => setFiltroTipo(v === 'todos' ? '' : (v as 'visitante' | 'residente'))}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="visitante">Visitante</SelectItem>
                    <SelectItem value="residente">Residente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={loadData} disabled={loading}>
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vehículos activos
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">En el estacionamiento ahora</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total (filtro)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(totalFiltrado)}</div>
              <p className="text-xs text-muted-foreground mt-1">{serviciosCount} servicios</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Período
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-foreground">
                {filtroFechaDesde || filtroFechaHasta
                  ? `${filtroFechaDesde || '...'} a ${filtroFechaHasta || '...'}`
                  : 'Sin filtro de fechas'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filtroTipo ? (filtroTipo === 'visitante' ? 'Solo visitantes' : 'Solo residentes') : 'Todos los tipos'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart y reportes */}
        <Card className="border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-foreground text-base sm:text-lg">
                  Ingresos por día
                  {filtroTipo === 'visitante' && ' — Visitantes'}
                  {filtroTipo === 'residente' && ' — Residentes'}
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
                <Button variant="outline" size="sm" onClick={exportarExcel} disabled={serviciosList.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF} disabled={serviciosList.length === 0}>
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

        {/* Tarifas */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tarifas por hora
            </CardTitle>
            <p className="text-sm text-muted-foreground">Modifique el precio por hora para visitantes y residentes.</p>
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

        {/* Gestión de usuarios */}
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

        {/* Lista de servicios */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Servicios {filtroFechaDesde || filtroFechaHasta || filtroTipo ? '(filtrados)' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {serviciosList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay servicios con los filtros aplicados</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
                {serviciosList.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-medium text-foreground truncate">
                          {servicio.vehiculo?.placa || 'Sin Placa'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {servicio.vehiculo?.tipo === 'residente' ? 'Residente' : 'Visitante'}
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
                      <Button variant="ghost" size="sm" onClick={() => setDeletingServicioId(servicio.id)} title="Eliminar registro" className="text-destructive hover:text-destructive shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
