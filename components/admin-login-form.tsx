'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { loginUsuario, listarUsuariosParaLogin } from '@/app/actions'
import type { UsuarioLoginListaItem } from '@/app/actions'
import { Lock, Loader2, Home } from 'lucide-react'
import { LoginCarAnimation } from '@/components/login-car-animation'
import { LoginLoadingOverlay } from '@/components/login-loading-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type AdminLoginFormProps = { slug?: string }

export function AdminLoginForm({ slug }: AdminLoginFormProps) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioLoginListaItem[]>([])
  const [cargandoLista, setCargandoLista] = useState(false)

  useEffect(() => {
    if (!slug) {
      setListaUsuarios([])
      return
    }
    let ok = true
    setCargandoLista(true)
    void listarUsuariosParaLogin(slug, 'admin').then((list) => {
      if (!ok) return
      setListaUsuarios(list)
      setCargandoLista(false)
    })
    return () => {
      ok = false
    }
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let navegando = false
    try {
      const result = await loginUsuario(usuario, password, { soloAdmin: true, ...(slug && { slug }) })
      if (result.ok) {
        navegando = true
        window.location.reload()
        return
      }
      setError(result.error || 'Error al iniciar sesión')
    } catch {
      setError('Error de conexión')
    } finally {
      if (!navegando) setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative">
      <LoginCarAnimation />
      <Card className="w-full max-w-sm border-border relative z-10 min-w-0 overflow-hidden">
        <LoginLoadingOverlay show={loading} label="Iniciando sesión…" />
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-foreground">Acceso Administrativo</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Ingrese usuario y contraseña
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={slug && listaUsuarios.length > 0 ? 'usuario-select' : 'usuario'}>Usuario</Label>
              {slug && cargandoLista && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Cargando usuarios de la cuenta…
                </p>
              )}
              {slug && listaUsuarios.length > 0 ? (
                <Select value={usuario || undefined} onValueChange={setUsuario} disabled={loading}>
                  <SelectTrigger id="usuario-select" className="w-full">
                    <SelectValue placeholder="Seleccione su usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaUsuarios.map((u) => (
                      <SelectItem key={u.usuario} value={u.usuario}>
                        <span className="font-mono">{u.usuario}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {u.nombre} {u.apellido}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Usuario"
                  autoComplete="username"
                  disabled={loading}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full inline-flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
              {loading ? 'Entrando…' : 'Entrar'}
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
