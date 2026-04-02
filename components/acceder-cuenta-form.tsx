'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { existeCuentaSlug } from '@/app/actions'
import { Loader2 } from 'lucide-react'
import { LoginLoadingOverlay } from '@/components/login-loading-overlay'

export function AccederCuentaForm() {
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loadingDest, setLoadingDest] = useState<'admin' | 'conserje' | null>(null)

  const normalizarSlug = () =>
    slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '')

  const go = async (dest: 'admin' | 'conserje') => {
    const s = normalizarSlug()
    if (!s) {
      setError('Ingrese el nombre de la cuenta para continuar.')
      return
    }
    setError('')
    setLoadingDest(dest)
    try {
      const existe = await existeCuentaSlug(s)
      if (!existe) {
        setError('No existe una cuenta con ese nombre.')
        setLoadingDest(null)
        return
      }
      window.location.assign(`/${s}/${dest}`)
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.')
      setLoadingDest(null)
    }
  }

  const busy = loadingDest !== null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void go('admin')
      }}
      className="space-y-3 relative"
    >
      <LoginLoadingOverlay
        show={busy}
        label={loadingDest === 'conserje' ? 'Abriendo conserje…' : 'Abriendo administración…'}
      />
      <div className="space-y-2">
        <Label htmlFor="slug">Nombre de la cuenta</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            if (error) setError('')
          }}
          placeholder="mi-edificio"
          aria-invalid={!!error}
          disabled={busy}
        />
        <p className="text-xs text-muted-foreground">
          Ej: si creó &quot;Mi Edificio&quot;, use: mi-edificio
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="flex-1 min-w-0 inline-flex items-center justify-center gap-2" disabled={busy}>
          {loadingDest === 'admin' ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
          {loadingDest === 'admin' ? 'Abriendo…' : 'Admin'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void go('conserje')}
          className="flex-1 min-w-0 inline-flex items-center justify-center gap-2"
          disabled={busy}
        >
          {loadingDest === 'conserje' ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
          {loadingDest === 'conserje' ? 'Abriendo…' : 'Conserje'}
        </Button>
      </div>
    </form>
  )
}
