'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { crearCuentaFreemium } from '@/app/actions'
import { Loader2 } from 'lucide-react'
import { LoginLoadingOverlay } from '@/components/login-loading-overlay'

function mensajeErrorRed(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const m = msg.toLowerCase()
  if (
    m.includes('failed to fetch') ||
    m.includes('fetch failed') ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('network request failed')
  ) {
    return 'No se pudo contactar al servidor (fallo de red). Compruebe su conexión a internet. Si ocurre en el sitio publicado, verifique en Vercel u otro hosting que estén definidas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY y que el despliegue se haya hecho después de guardarlas.'
  }
  return msg || 'Error inesperado'
}

function generarUsernamePreview(nombre: string, apellido: string): string {
  const n = (nombre || '').trim()
  const a = (apellido || '').trim()
  if (!n || !a) return '—'
  const base = (n[0] + a).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s/g, '')
  const user = base.replace(/[^a-z0-9]/g, '') || 'admin'
  return user + ' (se genera automáticamente)'
}

export function RegistroCuentaForm() {
  const [nombreCuenta, setNombreCuenta] = useState('')
  const [nombreAdmin, setNombreAdmin] = useState('')
  const [apellidoAdmin, setApellidoAdmin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let navegando = false
    try {
      const result = await crearCuentaFreemium(
        nombreCuenta.trim(),
        nombreAdmin.trim(),
        apellidoAdmin.trim(),
        password
      )
      if (result.ok && result.slug) {
        navegando = true
        window.location.assign(`/${result.slug}/admin?registrado=1`)
        return
      }
      setError(result.error || 'Error al crear la cuenta')
    } catch (e) {
      setError(mensajeErrorRed(e))
    } finally {
      if (!navegando) setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0 relative">
      <LoginLoadingOverlay show={loading} label="Creando su cuenta…" />
      <div className="space-y-2">
        <Label htmlFor="nombre-cuenta">Nombre de la cuenta</Label>
        <Input
          id="nombre-cuenta"
          type="text"
          value={nombreCuenta}
          onChange={(e) => setNombreCuenta(e.target.value)}
          placeholder="Ej: Mi Edificio"
          disabled={loading}
          required
        />
        <p className="text-xs text-muted-foreground">
          Su acceso será: /{nombreCuenta.trim() ? nombreCuenta.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'nombre-cuenta'} (se normalizará al crear)
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre-admin">Nombre del administrador</Label>
          <Input
            id="nombre-admin"
            type="text"
            value={nombreAdmin}
            onChange={(e) => setNombreAdmin(e.target.value)}
            placeholder="Mario"
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido-admin">Apellido del administrador</Label>
          <Input
            id="apellido-admin"
            type="text"
            value={apellidoAdmin}
            onChange={(e) => setApellidoAdmin(e.target.value)}
            placeholder="Casas"
            disabled={loading}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Usuario: {generarUsernamePreview(nombreAdmin, apellidoAdmin)}
      </p>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 4 caracteres"
          disabled={loading}
          minLength={4}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full inline-flex items-center justify-center gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
        {loading ? 'Creando cuenta…' : 'Crear cuenta (prueba 5 días)'}
      </Button>
    </form>
  )
}
