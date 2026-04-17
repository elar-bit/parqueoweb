'use client'

import { useEffect, useState } from 'react'
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

export function NoticiasPeruTicker() {
  const [line, setLine] = useState<Titular[]>([])
  const [fuente, setFuente] = useState({ nombre: 'RPP Noticias', url: 'https://rpp.pe' })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/noticias-peru', { cache: 'no-store' })
        const data: ApiPayload = await res.json()
        if (cancelled) return
        if (data.items?.length) {
          setLine(data.items)
          setFuente({ nombre: data.fuenteNombre, url: data.fuenteUrl })
        } else {
          setLine([FALLBACK_TITULAR])
        }
      } catch {
        if (!cancelled) setLine([FALLBACK_TITULAR])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const items = line.length > 0 ? line : [FALLBACK_TITULAR]

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
        <div className="relative min-w-0 flex-1 overflow-hidden flex items-center">
          {!mounted ? (
            <span className="pl-2 text-[11px] sm:text-xs text-muted-foreground truncate">
              Cargando titulares…
            </span>
          ) : (
            <div className="noticias-peru-scroll flex w-max">
              {[0, 1].map((loop) => (
                <div
                  key={loop}
                  className="flex items-center gap-x-6 sm:gap-x-10 pr-6 sm:pr-10 shrink-0"
                  aria-hidden={loop === 1}
                >
                  {items.map((it, idx) => (
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
