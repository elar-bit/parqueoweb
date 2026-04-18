'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { listarCuentasParaSelector } from '@/app/actions'
import type { CuentaSelectorItem } from '@/app/actions'
import { Loader2, Star, Search } from 'lucide-react'
import { LoginLoadingOverlay } from '@/components/login-loading-overlay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const STORAGE_PREDETERMINADO = 'parqueo_tenant_predeterminado'

function normalizarBusqueda(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function AccederCuentaForm() {
  const [cuentas, setCuentas] = useState<CuentaSelectorItem[]>([])
  const [cargandoCuentas, setCargandoCuentas] = useState(true)
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loadingDest, setLoadingDest] = useState<'admin' | 'conserje' | null>(null)
  const [modalTodas, setModalTodas] = useState(false)
  const [busquedaModal, setBusquedaModal] = useState('')
  const [predeterminadoSlug, setPredeterminadoSlug] = useState<string | null>(null)

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

  useEffect(() => {
    if (typeof window === 'undefined' || cuentas.length === 0) return
    try {
      const guardado = localStorage.getItem(STORAGE_PREDETERMINADO)
      setPredeterminadoSlug(guardado)
      if (guardado && cuentas.some((c) => c.slug === guardado)) {
        setSlug(guardado)
      }
    } catch {
      setPredeterminadoSlug(null)
    }
  }, [cuentas])

  const recientes5 = useMemo(() => {
    return [...cuentas]
      .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 5)
  }, [cuentas])

  const ordenadasPorNombre = useMemo(() => {
    return [...cuentas].sort((a, b) =>
      a.nombre_cuenta.localeCompare(b.nombre_cuenta, 'es', { sensitivity: 'base' })
    )
  }, [cuentas])

  const filtradasModal = useMemo(() => {
    const q = normalizarBusqueda(busquedaModal)
    if (!q) return ordenadasPorNombre
    return ordenadasPorNombre.filter((c) => {
      const nombre = normalizarBusqueda(c.nombre_cuenta)
      const sl = c.slug.toLowerCase()
      return nombre.includes(q) || sl.includes(q)
    })
  }, [ordenadasPorNombre, busquedaModal])

  const esPredeterminado = !!slug && predeterminadoSlug === slug

  const guardarPredeterminado = () => {
    if (!slug) return
    try {
      localStorage.setItem(STORAGE_PREDETERMINADO, slug)
      setPredeterminadoSlug(slug)
    } catch {
      // ignore
    }
  }

  const handleSelectCuenta = (value: string) => {
    if (value === '__ver_mas__') {
      setModalTodas(true)
      setBusquedaModal('')
      return
    }
    setSlug(value)
    if (error) setError('')
  }

  const elegirDesdeModal = (c: CuentaSelectorItem) => {
    setSlug(c.slug)
    if (error) setError('')
    setModalTodas(false)
    setBusquedaModal('')
  }

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
          <div className="flex gap-2 items-end">
            <Select value={slug || undefined} onValueChange={handleSelectCuenta} disabled={busy}>
              <SelectTrigger id="cuenta-select" className="w-full min-w-0 flex-1" aria-invalid={!!error}>
                <SelectValue placeholder="Seleccione su cuenta" />
              </SelectTrigger>
              <SelectContent>
                {recientes5.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    <span className="font-medium">{c.nombre_cuenta}</span>{' '}
                    <span className="text-muted-foreground font-mono text-xs">/{c.slug}</span>
                  </SelectItem>
                ))}
                <SelectItem
                  value="__ver_mas__"
                  className="text-primary font-medium focus:text-primary"
                >
                  Ver más…
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={busy || !slug}
              onClick={guardarPredeterminado}
              title="Recordar esta cuenta en este navegador"
              aria-label="Recordar esta cuenta en este navegador"
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  esPredeterminado && 'fill-amber-400 text-amber-600 dark:text-amber-400'
                )}
              />
            </Button>
          </div>
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

      <Dialog
        open={modalTodas}
        onOpenChange={(open) => {
          setModalTodas(open)
          if (!open) setBusquedaModal('')
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-4 pt-4 pb-2 space-y-1">
            <DialogTitle className="text-left">Todas las cuentas</DialogTitle>
            <DialogDescription className="text-left text-sm">
              Orden alfabético. Escriba para filtrar por nombre o por ruta (slug).
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={busquedaModal}
                onChange={(e) => setBusquedaModal(e.target.value)}
                placeholder="Buscar…"
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto border-t border-border px-2 py-2">
            {filtradasModal.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4 text-center">No hay resultados.</p>
            ) : (
              <ul className="space-y-0.5">
                {filtradasModal.map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      className="w-full text-left rounded-md px-3 py-2.5 text-sm hover:bg-muted/80 transition-colors"
                      onClick={() => elegirDesdeModal(c)}
                    >
                      <span className="font-medium text-foreground">{c.nombre_cuenta}</span>
                      <span className="text-muted-foreground font-mono text-xs ml-1.5">/{c.slug}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
