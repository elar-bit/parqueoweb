import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, BarChart3, User, PlusCircle, LogIn } from 'lucide-react'
import { LoginCarAnimation } from '@/components/login-car-animation'
import { AccederCuentaForm } from '@/components/acceder-cuenta-form'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative">
      <LoginCarAnimation />
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-3 sm:mb-4">
            <Car className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground px-1">
            Sistema de Control de Estacionamiento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Prueba 5 días gratis. Cree su cuenta o acceda a la existente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Crear cuenta</CardTitle>
              <CardDescription>
                Prueba freemium 5 días. Nombre de cuenta y datos del administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="default">
                <Link href="/registro">Registrarme</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <LogIn className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Acceder a mi cuenta</CardTitle>
              <CardDescription>
                Ingrese el nombre de su cuenta (ej: mi-edificio) para entrar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccederCuentaForm />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Administrador</CardTitle>
              <CardDescription>
                Panel admin (usuarios, tarifas, reportes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Acceda desde la opción &quot;Acceder a mi cuenta&quot; arriba.</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Conserje</CardTitle>
              <CardDescription>
                Registro de entradas y salidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">Acceda desde la opción &quot;Acceder a mi cuenta&quot; arriba.</p>
            </CardContent>
          </Card>
        </div>
        <p className="text-center text-xs text-muted-foreground pt-4">
          <Link href="/superadmin" className="hover:underline">Admin del sistema (SaaS)</Link>
        </p>
      </div>
    </div>
  )
}
