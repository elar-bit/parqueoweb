import { getAdminAuth } from '@/app/actions'
import { AdminLoginForm } from '@/components/admin-login-form'
import { AdminDashboard } from '@/components/admin-dashboard'

export default async function AdminPage() {
  const autenticado = await getAdminAuth()
  if (!autenticado) {
    return <AdminLoginForm />
  }
  return <AdminDashboard />
}
