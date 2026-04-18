'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { listarCuentasParaSelector } from '@/app/actions'
import { Loader2 } from 'lucide-react'
import { LoginLoadingOverlay } from '@/components/login-loading-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AccederCuentaForm() {
  const [slug, setSlug] = useState('')
  const [cuentas, setCuentas] = useState<{ slug: string; nombre_cuenta: string }[]>([])
  const [cargandoCuentas, setCargandoCuentas] = useState(true)
  const [error, setError] = useState('')
  const [loadingDest, setLoadingDest] = useState<'admin' | 'conserje' | null>(null)

  useEffect(() => {
    let ok = true
    void listarCuentasParaSelector().then((list) => {
      if (!ok) return
      setCuentas(list)
      setCargandoCuentas(false)
    })
    return () => {
      ok = false
    }
  }, [])

  const go = async (dest: 'admin' | 'conserje') => {
    const s = (slug || '').trim().toLowerCase()
    if (!s) {
      setError('Seleccione una cuenta para continuar.')
      return
    }
    setError('')
    setLoadingDest(dest)
    try {
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
        <Label htmlFor="cuenta-select">Cuenta</Label>
        {cargandoCuentas ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Cargando cuentas…
          </div>
        ) : cuentas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay cuentas disponibles en este momento.</p>
        ) : (
          <Select
            value={slug || undefined}
            onValueChange={(v) => {
              setSlug(v)
              if (error) setError('')
            }}
            disabled={busy}
          >
            <SelectTrigger id="cuenta-select" className="w-full" aria-invalid={!!error}>
              <SelectValue placeholder="Seleccione su cuenta" />
            </SelectTrigger>
            <SelectContent>
              {cuentas.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  <span className="font-medium">{c.nombre_cuenta}</span>{' '}
                  <span className="text-muted-foreground font-mono text-xs">/{c.slug}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="flex-1 min-w-0 inline-flex items-center justify-center gap-2" disabled={busy || cargandoCuentas || cuentas.length === 0}>
          {loadingDest === 'admin' ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
          {loadingDest === 'admin' ? 'Abriendo…' : 'Admin'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void go('conserje')}
          className="flex-1 min-w-0 inline-flex items-center justify-center gap-2"
          disabled={busy || cargandoCuentas || cuentas.length === 0}
        >
          {loadingDest === 'conserje' ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
          {loadingDest === 'conserje' ? 'Abriendo…' : 'Conserje'}
        </Button>
      </div>
    </form>
  )
}
