'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  getServiciosActivos, 
  getIngresosDiarios, 
  getServiciosPagadosHoy 
} from '@/app/actions'
import type { ServicioConVehiculo } from '@/lib/types'
import { formatCurrency } from '@/lib/billing'
import { Car, DollarSign, RefreshCw, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { IncomeChart } from '@/components/income-chart'

export default function AdminPage() {
  const [activeCount, setActiveCount] = useState(0)
  const [todayIncome, setTodayIncome] = useState(0)
  const [todayServices, setTodayServices] = useState(0)
  const [chartData, setChartData] = useState<{ fecha: string; total: number }[]>([])
  const [recentServices, setRecentServices] = useState<ServicioConVehiculo[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [activos, ingresos, pagadosHoy] = await Promise.all([
        getServiciosActivos(),
        getIngresosDiarios(7),
        getServiciosPagadosHoy(),
      ])
      
      setActiveCount(activos.length)
      setChartData(ingresos)
      setRecentServices(pagadosHoy.slice(0, 5))
      
      // Calculate today's totals
      const today = new Date().toISOString().split('T')[0]
      const todayData = ingresos.find(d => d.fecha === today)
      setTodayIncome(todayData?.total || 0)
      setTodayServices(pagadosHoy.length)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vehiculos Activos
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                En el estacionamiento ahora
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos de Hoy
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(todayIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayServices} servicios completados
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Semanal
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(chartData.reduce((sum, d) => sum + d.total, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ultimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos Diarios</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeChart data={chartData} />
          </CardContent>
        </Card>

        {/* Recent Services */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Servicios Recientes de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {recentServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay servicios completados hoy
              </p>
            ) : (
              <div className="space-y-3">
                {recentServices.map((servicio) => (
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
                        {servicio.salida && new Date(servicio.salida).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit'
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
