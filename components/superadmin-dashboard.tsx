'use client'

import { useState, useEffect } from 'react'
import { getCuentas, updateCuentaEstado, logoutAdmin } from '@/app/actions'
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
import { LogOut, Building2, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export function SuperadminDashboard() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [filtro, setFiltro] = useState<string>('todas')
  const [loading, setLoading] = useState(true)

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
    if (r.ok) loadCuentas()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-600" />
            <h1 className="text-lg font-semibold">Panel Global (SaaS)</h1>
          </div>
          <div className="flex items-center gap-2">
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

      <main className="container mx-auto px-4 py-6 space-y-4">
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle>Cuentas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestión de cuentas. Prueba freemium 5 días. Solo el administrador global puede reactivar tras el pago.
            </p>
            <div className="pt-2">
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="w-[200px]">
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
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background/50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{c.nombre_cuenta}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            /{c.slug}
                          </Badge>
                          {c.estado === 'activo' ? (
                            <Badge className="bg-green-600">Activa</Badge>
                          ) : (
                            <Badge variant="destructive">Suspendida</Badge>
                          )}
                          {porVencer && c.estado === 'activo' && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vence en {dias} día{dias !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {vencido && c.estado === 'activo' && (
                            <Badge variant="destructive">Prueba vencida</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Admin: {c.nombre_admin} {c.apellido_admin} · Creada: {new Date(c.fecha_creacion).toLocaleDateString('es-PE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${c.slug}/admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          Abrir admin
                        </a>
                        {c.estado === 'activo' ? (
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
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
