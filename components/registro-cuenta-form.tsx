'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { crearCuentaFreemium } from '@/app/actions'
import { Loader2 } from 'lucide-react'

export function RegistroCuentaForm() {
  const router = useRouter()
  const [nombreCuenta, setNombreCuenta] = useState('')
  const [nombreAdmin, setNombreAdmin] = useState('')
  const [apellidoAdmin, setApellidoAdmin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await crearCuentaFreemium(nombreCuenta.trim(), nombreAdmin.trim(), apellidoAdmin.trim())
      if (result.ok && result.slug) {
        router.push(`/${result.slug}/admin?registrado=1`)
        return
      }
      setError(result.error || 'Error al crear la cuenta')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Su acceso será: /{nombreCuenta.trim() || 'nombre-cuenta'} (se normalizará automáticamente)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre-admin">Nombre del administrador</Label>
          <Input
            id="nombre-admin"
            type="text"
            value={nombreAdmin}
            onChange={(e) => setNombreAdmin(e.target.value)}
            placeholder="Nombre"
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
            placeholder="Apellido"
            disabled={loading}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Crear cuenta (prueba 5 días)
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Se creará un usuario <strong>admin</strong> con contraseña <strong>perucampeon</strong>. Cámbiela después del primer acceso.
      </p>
    </form>
  )
}
