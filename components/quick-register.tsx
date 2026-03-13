'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registrarEntrada, getPlacasResidentes } from '@/app/actions'
import { Car, User, Loader2 } from 'lucide-react'

interface QuickRegisterProps {
  onRegistered: () => void
}

type TipoEntrada = 'visitante' | 'residente' | null

export function QuickRegister({ onRegistered }: QuickRegisterProps) {
  const [paso, setPaso] = useState<'tipo' | 'placa'>('tipo')
  const [tipo, setTipo] = useState<TipoEntrada>(null)
  const [placa, setPlaca] = useState('')
  const [residenteSeleccionado, setResidenteSeleccionado] = useState<string | null>(null)
  const [placasResidentes, setPlacasResidentes] = useState<{ id: string; placa: string; nombre_propietario: string | null }[]>([])
  const [loading, setLoading] = useState(false)

  const cargarResidentes = async () => {
    const list = await getPlacasResidentes()
    setPlacasResidentes(list)
  }

  useEffect(() => {
    if (tipo === 'residente') cargarResidentes()
  }, [tipo])

  const handleSeleccionarTipo = (t: 'visitante' | 'residente') => {
    setTipo(t)
    setPaso('placa')
    setPlaca('')
    setResidenteSeleccionado(null)
  }

  const handleRegistrar = async () => {
    if (!tipo) return
    setLoading(true)
    try {
      if (tipo === 'residente' && residenteSeleccionado) {
        await registrarEntrada('residente', null, residenteSeleccionado)
      } else {
        await registrarEntrada(tipo, placa.trim() || null, null)
      }
      setPaso('tipo')
      setTipo(null)
      setPlaca('')
      setResidenteSeleccionado(null)
      onRegistered()
    } catch (error) {
      console.error('Error registering entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setPaso('tipo')
    setTipo(null)
    setPlaca('')
    setResidenteSeleccionado(null)
  }

  const puedeRegistrar =
    tipo === 'visitante'
      ? true
      : tipo === 'residente'
        ? residenteSeleccionado !== null || placa.trim().length > 0
        : false

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Registro Rápido
        </CardTitle>
      </CardHeader>
      <CardContent>
        {paso === 'tipo' ? (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              size="lg"
              className="flex-1 min-h-[80px] sm:h-24 flex flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSeleccionarTipo('visitante')}
            >
              <Car className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-sm font-medium">Visitante</span>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 min-h-[80px] sm:h-24 flex flex-col gap-2"
              onClick={() => handleSeleccionarTipo('residente')}
            >
              <User className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-sm font-medium">Residente</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {tipo === 'visitante' ? 'Ingrese la placa del visitante (opcional).' : 'Seleccione una placa registrada o ingrese una nueva.'}
            </p>

            {tipo === 'residente' && placasResidentes.length > 0 && (
              <div className="space-y-2">
                <Label>Placa ya registrada</Label>
                <Select
                  value={residenteSeleccionado ?? 'nueva'}
                  onValueChange={(v) => {
                    setResidenteSeleccionado(v === 'nueva' ? null : v)
                    if (v !== 'nueva') setPlaca('')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar o ingresar nueva" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nueva">Nueva placa (escribir abajo)</SelectItem>
                    {placasResidentes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.placa}
                        {r.nombre_propietario ? ` - ${r.nombre_propietario}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(tipo === 'visitante' || residenteSeleccionado === null) && (
              <div className="space-y-2">
                <Label htmlFor="placa">{tipo === 'residente' ? 'Nueva placa' : 'Placa (opcional)'}</Label>
                <Input
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                  className="font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegistrar()}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleCancelar} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrar} disabled={loading || !puedeRegistrar}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? ' Registrando...' : 'Registrar entrada'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
