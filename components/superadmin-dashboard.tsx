'use client'

import { useState, useEffect } from 'react'
import { getCuentas, updateCuentaEstado, eliminarCuenta, logoutAdmin } from '@/app/actions'
import type { Cuenta } from '@/lib/tenant'
import { diasRestantesTrial } from '@/lib/tenant'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { LogOut, Building2, Calendar, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'

export function SuperadminDashboard() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [filtro, setFiltro] = useState<string>('todas')
  const [loading, setLoading] = useState(true)
  const [cuentaAEliminar, setCuentaAEliminar] = useState<Cuenta | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const loadCuentas = async () => {
    setLoading(true)
    const list = await getCuentas(
      filtro === 'activas' ? 'activas' : filtro === 'suspendidas' ? 'suspendidas' : filtro === 'por_vencer' ? 'por_vencer' : filtro === 'vencidas' ? 'vencidas' : undefined
    )
    setCuentas(list)
    setLoading(false)
  }

  useEffect(() => {
    loadCuentas()
  }, [filtro])

  const handleLogout = async () => {
    await logoutAdmin()
    window.location.href = '/'
  }

  const handleCambiarEstado = async (id: string, estado: 'activo' | 'suspendido') => {
    const r = await updateCuentaEstado(id, estado)
    if (r.ok) {
      loadCuentas()
    } else {
      // eslint-disable-next-line no-alert
      alert(r.error || 'No se pudo actualizar el estado de la cuenta')
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!cuentaAEliminar) return
    setEliminando(true)
    const r = await eliminarCuenta(cuentaAEliminar.id)
    setEliminando(false)
    setCuentaAEliminar(null)
    if (r.ok) {
      loadCuentas()
    } else {
      // En un dashboard interno, un alert simple es suficiente
      // eslint-disable-next-line no-alert
      alert(r.error || 'No se pudo eliminar la cuenta')
    }
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-6 w-6 text-amber-600 shrink-0" />
            <h1 className="text-base sm:text-lg font-semibold truncate">Panel Global (SaaS)</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Inicio</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 overflow-hidden">
        <Card className="border-amber-500/30 overflow-hidden">
          <CardHeader>
            <CardTitle className="break-words">Cuentas</CardTitle>
            <p className="text-sm text-muted-foreground break-words">
              Gestión de cuentas. Prueba freemium 5 días. Solo el administrador global puede reactivar tras el pago.
            </p>
            <div className="pt-2">
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="w-full min-w-0 sm:w-[200px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="activas">Activas</SelectItem>
                  <SelectItem value="suspendidas">Suspendidas</SelectItem>
                  <SelectItem value="por_vencer">Por vencer (1-2 días)</SelectItem>
                  <SelectItem value="vencidas">Vencidas / Suspendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : cuentas.length === 0 ? (
              <p className="text-muted-foreground">No hay cuentas con este filtro.</p>
            ) : (
              <ul className="space-y-3">
                {cuentas.map((c) => {
                  const dias = diasRestantesTrial(c.fecha_creacion)
                  const vencido = dias < 0
                  const porVencer = dias >= 0 && dias <= 2
                  const accesoAutorizado = !!c.acceso_pagado
                  const cuentaActiva = c.estado === 'activo'
                  return (
                    <li
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium break-words">{c.nombre_cuenta}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            /{c.slug}
                          </Badge>
                          {cuentaActiva ? (
                            <Badge className="bg-green-600">Activa</Badge>
                          ) : (
                            <Badge variant="destructive">Suspendida</Badge>
                          )}
                          {accesoAutorizado && cuentaActiva && (
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                              Acceso autorizado
                            </Badge>
                          )}
                          {porVencer && cuentaActiva && !accesoAutorizado && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vence en {dias} día{dias !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {vencido && cuentaActiva && !accesoAutorizado && (
                            <Badge variant="destructive">Prueba vencida</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-words">
                          Admin: {c.nombre_admin} {c.apellido_admin} · Creada: {new Date(c.fecha_creacion).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <a
                          href={`/${c.slug}/admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Abrir admin
                        </a>
                        {cuentaActiva ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-500/50"
                            onClick={() => handleCambiarEstado(c.id, 'suspendido')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Suspender
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-500/50"
                            onClick={() => handleCambiarEstado(c.id, 'activo')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reactivar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/40"
                          onClick={() => setCuentaAEliminar(c)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Borrar
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!cuentaAEliminar} onOpenChange={(open) => !open && !eliminando && setCuentaAEliminar(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              ¿Eliminar cuenta freemium?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Esta acción eliminará de forma permanente la cuenta{' '}
              <span className="font-semibold">{cuentaAEliminar?.nombre_cuenta}</span> (<span className="font-mono">/{cuentaAEliminar?.slug}</span>){' '}
              y <span className="font-semibold">toda su partición</span>: usuarios, vehículos, servicios, reportes y configuraciones asociadas.
              <br />
              <br />
              <span className="font-semibold text-destructive">
                No se podrá recuperar ningún dato de este tenant y no afectará a las demás cuentas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando} className="bg-muted text-foreground hover:bg-muted/80 border border-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarEliminar}
              disabled={eliminando}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Sí, borrar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
