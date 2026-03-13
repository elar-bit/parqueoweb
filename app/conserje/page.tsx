import { getSession } from '@/app/actions'
import { ConserjeLoginForm } from '@/components/conserje-login-form'
import { ConserjeDashboard } from '@/components/conserje-dashboard'

export default async function ConserjePage() {
  const session = await getSession()
  if (session?.role !== 'conserje') {
    return <ConserjeLoginForm />
  }
  return <ConserjeDashboard />
}
