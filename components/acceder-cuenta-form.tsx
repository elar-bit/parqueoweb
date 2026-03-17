'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const DESCRIPCION_ADMIN = 'Panel admin: usuarios, tarifas, reportes y gráficas.'
const DESCRIPCION_CONSERJE = 'Registro de entradas y salidas de vehículos.'

export function AccederCuentaForm() {
  const router = useRouter()
  const [slug, setSlug] = useState('')

  const normalizarSlug = () =>
    slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') || 'default'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/${normalizarSlug()}/admin`)
      }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label htmlFor="slug">Nombre de la cuenta</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="mi-edificio"
          required
        />
        <p className="text-xs text-muted-foreground">
          Ej: si creó &quot;Mi Edificio&quot;, use: mi-edificio
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" className="flex-1 min-w-0">
              Entrar como admin
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            {DESCRIPCION_ADMIN}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${normalizarSlug()}/conserje`)}
              className="flex-1 min-w-0"
            >
              Entrar como conserje
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px]">
            {DESCRIPCION_CONSERJE}
          </TooltipContent>
        </Tooltip>
      </div>
    </form>
  )
}
