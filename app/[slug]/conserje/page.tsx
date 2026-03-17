import { getSession, getCuentaBySlug } from '@/app/actions'
import { isCuentaActiva, diasRestantesTrial } from '@/lib/tenant'
import { ConserjeLoginForm } from '@/components/conserje-login-form'
import { ConserjeDashboard } from '@/components/conserje-dashboard'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ slug: string }> }

export default async function TenantConserjePage({ params }: Props) {
  const { slug } = await params
  const cuenta = await getCuentaBySlug(slug)
  if (!cuenta) notFound()
  const trialDiasRestantes = diasRestantesTrial(cuenta.fecha_creacion)
  if (!isCuentaActiva(cuenta)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-destructive">Cuenta no disponible</h1>
          <p className="text-muted-foreground">
            La prueba ha vencido o la cuenta está suspendida. Contacte al administrador del sistema.
          </p>
          <a href="/" className="text-primary underline">Volver al inicio</a>
        </div>
      </div>
    )
  }
  const session = await getSession()
  if (session?.role !== 'conserje' || session?.slug !== slug) {
    return <ConserjeLoginForm slug={slug} />
  }
  return <ConserjeDashboard trialDiasRestantes={trialDiasRestantes} slug={slug} />
}
