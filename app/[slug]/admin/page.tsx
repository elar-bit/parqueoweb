import { getAdminAuth, getSession, getCuentaBySlug } from '@/app/actions'
import { isCuentaActiva, diasRestantesTrial, opcionesUiDesdeCuenta } from '@/lib/tenant'
import { AdminLoginForm } from '@/components/admin-login-form'
import { AdminDashboard } from '@/components/admin-dashboard'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ slug: string }> }

export default async function TenantAdminPage({ params }: Props) {
  const { slug } = await params
  const cuenta = await getCuentaBySlug(slug)
  if (!cuenta) notFound()
  const trialDiasRestantes = diasRestantesTrial(cuenta.fecha_creacion, cuenta.dias_prueba_freemium)
  if (!isCuentaActiva(cuenta)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="text-center max-w-md space-y-4 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-destructive break-words">Cuenta no disponible</h1>
          <p className="text-sm sm:text-base text-muted-foreground break-words">
            La prueba ha vencido o la cuenta está suspendida. Contacte al administrador del sistema para reactivar.
          </p>
          <a href="/" className="text-primary underline">Volver al inicio</a>
        </div>
      </div>
    )
  }
  const session = await getSession()
  const authed = await getAdminAuth()
  if (!authed || session?.slug !== slug) {
    return <AdminLoginForm slug={slug} />
  }
  return (
    <AdminDashboard
      currentUserId={session?.userId ?? null}
      trialDiasRestantes={trialDiasRestantes}
      slug={slug}
      opcionesUi={opcionesUiDesdeCuenta(cuenta)}
    />
  )
}
