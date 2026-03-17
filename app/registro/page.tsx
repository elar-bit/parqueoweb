import { RegistroCuentaForm } from '@/components/registro-cuenta-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car } from 'lucide-react'
import Link from 'next/link'
import { LoginCarAnimation } from '@/components/login-car-animation'

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <LoginCarAnimation />
      <div className="w-full max-w-md space-y-4 relative z-10">
        <Card className="border-border">
          <CardHeader>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-foreground">Prueba Freemium</CardTitle>
            <CardDescription>
              Cree su cuenta. Tendrá 5 días de prueba. Al finalizar, un administrador puede activar su suscripción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistroCuentaForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
