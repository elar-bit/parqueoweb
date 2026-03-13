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
  getServiciosPagadosFiltrados,
  getConfiguracion,
  updateConfiguracion,
  logoutAdmin,
  getUsuarios,
  crearUsuario,
  type FiltrosAdmin,
  type UsuarioRow,
} from '@/app/actions'
import type { ServicioConVehiculo, Configuracion } from '@/lib/types'
import { formatCurrency } from '@/lib/billing'
import { Car, DollarSign, RefreshCw, BarChart3, LogOut, Settings, Loader2, Users, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { IncomeChart } from '@/components/income-chart'

export function AdminDashboard() {
  const [activeCount, setActiveCount] = useState(0)
  const [chartData, setChartData] = useState<{ fecha: string; total: number }[]>([])
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

  const filtros: FiltrosAdmin = {
    fechaDesde: filtroFechaDesde || null,
    fechaHasta: filtroFechaHasta || null,
    tipo: filtroTipo === '' ? null : (filtroTipo as 'visitante' | 'residente'),
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [activos, ingresos, servicios, config, users] = await Promise.all([
        getServiciosActivos(),
        getIngresosFiltrados(filtros),
        getServiciosPagadosFiltrados(filtros),
        getConfiguracion(),
        getUsuarios(),
      ])
      setActiveCount(activos.length)
      setChartData(ingresos)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard Administrativo</h1>
              <p className="text-sm text-muted-foreground">Control de Estacionamiento</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/conserje">Vista Conserje</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filtros */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos por día</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeChart data={chartData} />
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
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Usuario</th>
                        <th className="text-left p-3 font-medium">Rol</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {serviciosList.map((servicio) => (
                  <div
                    key={servicio.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-foreground">
                          {servicio.vehiculo?.placa || 'Sin Placa'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {servicio.vehiculo?.tipo === 'residente' ? 'Residente' : 'Visitante'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
