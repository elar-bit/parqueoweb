import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Sistema de Control de Estacionamiento
          </h1>
          <p className="text-muted-foreground">
            Seleccione el modulo al que desea acceder
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Vista Conserje</CardTitle>
              <CardDescription>
                Registro de entradas y salidas de vehiculos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/conserje">Acceder</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Dashboard Admin</CardTitle>
              <CardDescription>
                Reportes e ingresos del estacionamiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin">Acceder</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
