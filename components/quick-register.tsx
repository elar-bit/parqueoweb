'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { registrarEntrada, getPlacasResidentes, tieneEntradaActiva } from '@/app/actions'
import type { ResidenteOption } from '@/app/actions'
import { Car, User, Loader2, Check, ChevronsUpDown } from 'lucide-react'

interface QuickRegisterProps {
  onRegistered: () => void
}

type TipoEntrada = 'visitante' | 'residente' | null

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchResidente(r: ResidenteOption, search: string): boolean {
  const q = normalize(search.trim())
  if (!q) return true
  const placa = normalize(r.placa)
  const nombre = normalize(r.nombre_propietario ?? '')
  const apellido = normalize(r.apellido_propietario ?? '')
  return placa.includes(q) || nombre.includes(q) || apellido.includes(q)
}

export function QuickRegister({ onRegistered }: QuickRegisterProps) {
  const [paso, setPaso] = useState<'tipo' | 'placa'>('tipo')
  const [tipo, setTipo] = useState<TipoEntrada>(null)
  const [placa, setPlaca] = useState('')
  const [residenteSeleccionado, setResidenteSeleccionado] = useState<string | null>(null)
  const [placasResidentes, setPlacasResidentes] = useState<ResidenteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [comboboxSearch, setComboboxSearch] = useState('')
  const [nombreResidente, setNombreResidente] = useState('')
  const [apellidoResidente, setApellidoResidente] = useState('')
  const [numeroOficinaDep, setNumeroOficinaDep] = useState('')
  const [telefonoResidente, setTelefonoResidente] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const cargarResidentes = async () => {
    const list = await getPlacasResidentes()
    setPlacasResidentes(list)
  }

  useEffect(() => {
    if (tipo === 'residente') cargarResidentes()
  }, [tipo])

  const residentesFiltrados = useMemo(() => {
    return placasResidentes.filter((r) => matchResidente(r, comboboxSearch))
  }, [placasResidentes, comboboxSearch])

  const handleSeleccionarTipo = (t: 'visitante' | 'residente') => {
    setTipo(t)
    setPaso('placa')
    setPlaca('')
    setResidenteSeleccionado(null)
    setNombreResidente('')
    setApellidoResidente('')
    setNumeroOficinaDep('')
    setComboboxSearch('')
    setErrorMsg(null)
  }

  const handleSeleccionarResidente = async (id: string) => {
    const yaActivo = await tieneEntradaActiva(id)
    if (yaActivo) {
      alert('Este vehículo ya tiene una entrada activa. No se puede duplicar la entrada.')
      return
    }
    setErrorMsg(null)
    setResidenteSeleccionado(id)
    setPlaca('')
    setComboboxOpen(false)
  }

  const handleRegistrar = async () => {
    if (!tipo) return
    setLoading(true)
    setErrorMsg(null)
    try {
      if (tipo === 'residente' && residenteSeleccionado) {
        await registrarEntrada('residente', null, residenteSeleccionado)
      } else if (tipo === 'residente' && placa.trim()) {
        await registrarEntrada('residente', placa.trim(), null, {
          nombre: nombreResidente.trim() || null,
          apellido: apellidoResidente.trim() || null,
          numero_oficina_dep: numeroOficinaDep.trim() || null,
          telefono_contacto: telefonoResidente.trim() || null,
        })
      } else {
        await registrarEntrada(tipo, placa.trim() || null, null)
      }
      setPaso('tipo')
      setTipo(null)
      setPlaca('')
      setResidenteSeleccionado(null)
      setNombreResidente('')
      setApellidoResidente('')
      setNumeroOficinaDep('')
      setTelefonoResidente('')
      setComboboxSearch('')
      onRegistered()
    } catch (error) {
      console.error('Error registering entry:', error)
      setErrorMsg('No se pudo registrar la entrada. Verifique los datos e inténtelo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setPaso('tipo')
    setTipo(null)
    setPlaca('')
    setResidenteSeleccionado(null)
    setNombreResidente('')
    setApellidoResidente('')
    setNumeroOficinaDep('')
    setTelefonoResidente('')
    setComboboxSearch('')
    setErrorMsg(null)
  }

  const puedeRegistrar =
    tipo === 'visitante'
      ? true
      : tipo === 'residente'
        ? residenteSeleccionado !== null || placa.trim().length > 0
        : false

  const residenteLabel = residenteSeleccionado
    ? (() => {
        const r = placasResidentes.find((x) => x.id === residenteSeleccionado)
        if (!r) return 'Seleccionar residente'
        const parts = [r.placa]
        if (r.nombre_propietario || r.apellido_propietario) {
          parts.push([r.nombre_propietario, r.apellido_propietario].filter(Boolean).join(' '))
        }
        return parts.join(' — ')
      })()
    : 'Buscar por placa o apellido...'

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
              {tipo === 'visitante'
                ? 'Ingrese la placa del visitante (opcional).'
                : 'Busque por placa o apellido una placa ya registrada o ingrese una nueva con nombre y apellido.'}
            </p>

            {tipo === 'residente' && (
              <div className="space-y-2">
                <Label>Placa ya registrada</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {residenteLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por placa o apellido..."
                        value={comboboxSearch}
                        onValueChange={setComboboxSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Ningún residente coincide.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="nueva"
                            onSelect={() => {
                              setResidenteSeleccionado(null)
                              setComboboxOpen(false)
                            }}
                          >
                            <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
                              <Check className={residenteSeleccionado === null ? 'opacity-100' : 'opacity-0'} />
                            </span>
                            Nueva placa (registrar abajo)
                          </CommandItem>
                          {residentesFiltrados.map((r) => (
                            <CommandItem
                              key={r.id}
                              value={r.id}
                              onSelect={() => handleSeleccionarResidente(r.id)}
                            >
                              <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
                                <Check className={residenteSeleccionado === r.id ? 'opacity-100' : 'opacity-0'} />
                              </span>
                              {r.placa}
                              {(r.nombre_propietario || r.apellido_propietario) &&
                                ` — ${[r.nombre_propietario, r.apellido_propietario].filter(Boolean).join(' ')}`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {(tipo === 'visitante' || residenteSeleccionado === null) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="placa">{tipo === 'residente' ? 'Placa' : 'Placa (opcional)'}</Label>
                  <Input
                    id="placa"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC-123"
                    className="font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleRegistrar()}
                  />
                </div>
                {tipo === 'residente' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="nombre-res">Nombre</Label>
                      <Input
                        id="nombre-res"
                        value={nombreResidente}
                        onChange={(e) => setNombreResidente(e.target.value)}
                        placeholder="Nombre del residente"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido-res">Apellido</Label>
                      <Input
                        id="apellido-res"
                        value={apellidoResidente}
                        onChange={(e) => setApellidoResidente(e.target.value)}
                        placeholder="Apellido del residente"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="oficina-dep">Nº oficina / departamento (opcional)</Label>
                      <Input
                        id="oficina-dep"
                        value={numeroOficinaDep}
                        onChange={(e) => setNumeroOficinaDep(e.target.value)}
                        placeholder="Ej. 101, Depto 2A"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="telefono-res">Teléfono / WhatsApp (opcional)</Label>
                      <Input
                        id="telefono-res"
                        type="tel"
                        value={telefonoResidente}
                        onChange={(e) => setTelefonoResidente(e.target.value)}
                        placeholder="Ej. 987 654 321"
                      />
                    </div>
                  </div>
                )}
              </>
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
            {errorMsg && (
              <p className="text-sm text-destructive pt-1">
                {errorMsg}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
