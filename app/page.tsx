import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, PlusCircle, LogIn } from 'lucide-react'
import { LoginCarAnimation } from '@/components/login-car-animation'
import { AccederCuentaForm } from '@/components/acceder-cuenta-form'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LoginCarAnimation />
      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        <div className="text-center space-y-2 mb-6 sm:mb-8 w-full max-w-xl">
          <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-2 sm:mb-4 shrink-0">
            <Car className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-1 break-words">
            Sistema de Control de Estacionamiento
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">
            Prueba 5 días gratis. Cree su cuenta o acceda a la existente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-2xl">
          <Card className="border-border hover:border-primary/50 transition-colors overflow-hidden min-w-0">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 shrink-0">
                <PlusCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg text-foreground break-words">
                Crear cuenta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm break-words">
                Prueba freemium 5 días. Nombre de cuenta y datos del administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full min-w-0" variant="default">
                <Link href="/registro">Registrarme</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors overflow-hidden min-w-0">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 shrink-0">
                <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <CardTitle className="text-base sm:text-lg text-foreground break-words">
                Acceder a mi cuenta
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm break-words">
                Ingrese el nombre de su cuenta (ej: mi-edificio) y elija tipo de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AccederCuentaForm />
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-6 sm:pt-8 w-full">
          <Link href="/superadmin" className="hover:underline break-words">
            Admin del sistema (SaaS)
          </Link>
        </p>
      </div>
    </div>
  )
}
