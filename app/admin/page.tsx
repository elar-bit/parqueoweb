import { getAdminAuth, getSession } from '@/app/actions'
import { AdminLoginForm } from '@/components/admin-login-form'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const autenticado = await getAdminAuth()
  if (!autenticado) {
    return <AdminLoginForm />
  }
  const session = await getSession()
  return <AdminDashboard currentUserId={session?.userId ?? null} />
}
