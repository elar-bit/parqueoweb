'use client'

import { startTransition, useEffect, useState } from 'react'
import Link from 'next/link'

type Titular = { title: string; link: string }

type ApiPayload = {
  ok: boolean
  items: Titular[]
  fuenteNombre: string
  fuenteUrl: string
  error?: string
}

const FALLBACK_TITULAR: Titular = {
  title:
    'Política, economía, deportes, espectáculos y más en Perú — Visite RPP Noticias para las últimas actualizaciones.',
  link: 'https://rpp.pe',
}

/** Espera al dashboard (login, datos) antes de pedir RSS y animar; evita competir por red y CPU. */
const CARGA_DIFERIDA_MS = 1800

export function NoticiasPeruTicker() {
  const [items, setItems] = useState<Titular[]>([])
  const [fuente, setFuente] = useState({ nombre: 'RPP Noticias', url: 'https://rpp.pe' })
  /** idle: antes del delay | loading: fetch en curso | ready: datos listos */
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready'>('idle')
  /** La animación solo cuando el carril ya midió ancho (evita titulares cortados / saltos) */
  const [marqueeOn, setMarqueeOn] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      setPhase('loading')
      void (async () => {
        try {
          const res = await fetch('/api/noticias-peru')
          const data: ApiPayload = await res.json()
          if (cancelled) return
          const list = data.items?.length ? data.items : [FALLBACK_TITULAR]
          startTransition(() => {
            setItems(list)
            setFuente({ nombre: data.fuenteNombre, url: data.fuenteUrl })
            setPhase('ready')
          })
        } catch {
          if (cancelled) return
          startTransition(() => {
            setItems([FALLBACK_TITULAR])
            setPhase('ready')
          })
        }
        if (cancelled) return
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) setMarqueeOn(true)
          })
        })
      })()
    }, CARGA_DIFERIDA_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const list = phase === 'ready' && items.length > 0 ? items : null

  return (
    <div
      className="border-b border-border bg-muted/60 text-foreground/90 dark:bg-muted/30"
      role="region"
      aria-label="Titulares de noticias de Perú"
    >
      <div className="flex h-9 items-stretch min-w-0">
        <div className="flex shrink-0 items-center border-r border-border bg-muted/80 px-2 sm:px-3">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
            Perú
          </span>
        </div>
        <div className="noticias-peru-viewport relative min-w-0 flex-1 overflow-hidden flex items-center">
          {!list ? (
            <span
              className={`pl-2 pr-2 text-[11px] sm:text-xs truncate ${
                phase === 'loading' ? 'text-muted-foreground animate-pulse' : 'text-muted-foreground/80'
              }`}
            >
              {phase === 'loading' ? 'Cargando titulares…' : 'Titulares de actualidad en Perú…'}
            </span>
          ) : (
            <div
              className={`noticias-peru-scroll flex w-max ${marqueeOn ? 'noticias-peru-scroll--running' : ''}`}
            >
              {[0, 1].map((loop) => (
                <div
                  key={loop}
                  className="flex items-center gap-x-6 sm:gap-x-10 pr-6 sm:pr-10 shrink-0"
                  aria-hidden={loop === 1}
                >
                  {list.map((it, idx) => (
                    <span key={`${loop}-${idx}`} className="inline-flex items-center gap-x-6 sm:gap-x-10">
                      <a
                        href={it.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] sm:text-xs leading-tight whitespace-nowrap hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {it.title}
                      </a>
                      <span className="text-muted-foreground/40 select-none" aria-hidden>
                        ·
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center border-l border-border px-2 sm:px-3 bg-muted/80">
          <Link
            href={fuente.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs font-medium text-primary hover:underline whitespace-nowrap"
          >
            {fuente.nombre}
          </Link>
        </div>
      </div>
    </div>
  )
}
