'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { registrarEntrada } from '@/app/actions'
import { Car, User } from 'lucide-react'

interface QuickRegisterProps {
  onRegistered: () => void
}

export function QuickRegister({ onRegistered }: QuickRegisterProps) {
  const [loading, setLoading] = useState<'visitante' | 'residente' | null>(null)

  const handleRegister = async (tipo: 'visitante' | 'residente') => {
    setLoading(tipo)
    try {
      await registrarEntrada(tipo)
      onRegistered()
    } catch (error) {
      console.error('Error registering entry:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Registro Rapido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 h-24 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleRegister('visitante')}
            disabled={loading !== null}
          >
            <Car className="h-8 w-8" />
            <span className="text-sm font-medium">
              {loading === 'visitante' ? 'Registrando...' : 'Visitante'}
            </span>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1 h-24 flex-col gap-2"
            onClick={() => handleRegister('residente')}
            disabled={loading !== null}
          >
            <User className="h-8 w-8" />
            <span className="text-sm font-medium">
              {loading === 'residente' ? 'Registrando...' : 'Residente'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
