'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { existeCuentaSlug } from '@/app/actions'

const DESCRIPCION_ADMIN = 'Panel admin: usuarios, tarifas, reportes y gráficas.'
const DESCRIPCION_CONSERJE = 'Registro de entradas y salidas de vehículos.'

export function AccederCuentaForm() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')

  const normalizarSlug = () =>
    slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '')

  const go = async (dest: 'admin' | 'conserje') => {
    const s = normalizarSlug()
    if (!s) {
      setError('Ingrese el nombre de la cuenta para continuar.')
      return
    }
    const existe = await existeCuentaSlug(s)
    if (!existe) {
      setError('No existe una cuenta con ese nombre.')
      return
    }
    setError('')
    router.push(`/${s}/${dest}`)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void go('admin')
      }}
      className="space-y-3"
    >
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
          required
        />
        <p className="text-xs text-muted-foreground">
          Ej: si creó &quot;Mi Edificio&quot;, use: mi-edificio
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" className="flex-1 min-w-0">
              Admin
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
              onClick={() => void go('conserje')}
              className="flex-1 min-w-0"
            >
              Conserje
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
