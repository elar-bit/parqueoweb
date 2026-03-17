'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { loginSuperadmin } from '@/app/actions'
import { Lock, Loader2, Home } from 'lucide-react'

export function SuperadminLoginForm() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await loginSuperadmin(usuario, password)
      if (result.ok) {
        window.location.reload()
      } else {
        setError(result.error || 'Credenciales incorrectas')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm border-amber-500/30 min-w-0 overflow-hidden">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-center text-foreground">Administrador Global (SaaS)</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Solo el dueño del sistema puede acceder.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa-usuario">Usuario</Label>
              <Input
                id="sa-usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-password">Contraseña</Label>
              <Input
                id="sa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
            <Button variant="ghost" className="w-full mt-2" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
