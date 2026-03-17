import { getSuperadminAuth } from '@/app/actions'
import { SuperadminLoginForm } from '@/components/superadmin-login-form'
import { SuperadminDashboard } from '@/components/superadmin-dashboard'

export default async function SuperadminPage() {
  const authed = await getSuperadminAuth()
  if (!authed) {
    return <SuperadminLoginForm />
  }
  return <SuperadminDashboard />
}
