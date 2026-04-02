'use client'

import { Loader2 } from 'lucide-react'

/** Capa semitransparente con spinner sobre tarjetas de login / acceso. */
export function LoginLoadingOverlay({ show, label = 'Iniciando sesión' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] bg-background/75 backdrop-blur-[2px]"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" aria-hidden />
      <span className="text-sm font-medium text-foreground px-2 text-center">{label}</span>
    </div>
  )
}
