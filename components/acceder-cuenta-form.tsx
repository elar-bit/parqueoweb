'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccederCuentaForm() {
  const router = useRouter()
  const [slug, setSlug] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') || 'default'
    router.push(`/${s}/admin`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Entrar como admin
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '') || 'default'
            router.push(`/${s}/conserje`)
          }}
          className="flex-1"
        >
          Entrar como conserje
        </Button>
      </div>
    </form>
  )
}
