import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, User } from 'lucide-react'
import { LoginCarAnimation } from '@/components/login-car-animation'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative">
      <LoginCarAnimation />
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary-foreground">
              P
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground px-1">
            Sistema de Control de Estacionamiento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            ¿Qué tipo de usuario eres?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground">Administrador</CardTitle>
              <CardDescription>
                Acceso con usuario y contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin">Entrar</Link>
              </Button>
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
              <Button asChild className="w-full">
                <Link href="/conserje">Entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
