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
import {
  registrarEntrada,
  getPlacasResidentes,
  getPlacasAbonados,
  tieneEntradaActiva,
  getEstacionamientos,
  type EstacionamientoRow,
} from '@/app/actions'
import { EstacionamientoMapaDialog } from '@/components/estacionamiento-mapa-dialog'
import type { ResidenteOption, AbonadoOption } from '@/app/actions'
import type { Configuracion } from '@/lib/types'
import { formatCurrency, calcularTotalAbonado } from '@/lib/billing'
import { Car, User, Loader2, Check, ChevronsUpDown, CalendarCheck } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface QuickRegisterProps {
  onRegistered: () => void
  configuracion?: Configuracion[]
}

type TipoEntrada = 'visitante' | 'residente' | 'abonado' | null

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

export function QuickRegister({ onRegistered, configuracion = [] }: QuickRegisterProps) {
  const [paso, setPaso] = useState<'tipo' | 'placa'>('tipo')
  const [tipo, setTipo] = useState<TipoEntrada>(null)
  const [placa, setPlaca] = useState('')
  const [residenteSeleccionado, setResidenteSeleccionado] = useState<string | null>(null)
  const [abonadoSeleccionado, setAbonadoSeleccionado] = useState<string | null>(null)
  const [placasResidentes, setPlacasResidentes] = useState<ResidenteOption[]>([])
  const [placasAbonados, setPlacasAbonados] = useState<AbonadoOption[]>([])
  const [loading, setLoading] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [comboboxSearch, setComboboxSearch] = useState('')
  const [nombreResidente, setNombreResidente] = useState('')
  const [apellidoResidente, setApellidoResidente] = useState('')
  const [numeroOficinaDep, setNumeroOficinaDep] = useState('')
  const [telefonoResidente, setTelefonoResidente] = useState('')
  const [yaPagoMensualidad, setYaPagoMensualidad] = useState(false)
  const [numeroMesesAbono, setNumeroMesesAbono] = useState<number>(1)
  const [refPagoAbono, setRefPagoAbono] = useState('')
  const [capturaPagoFile, setCapturaPagoFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [plazas, setPlazas] = useState<EstacionamientoRow[]>([])
  const [estacionamientoId, setEstacionamientoId] = useState<string | null>(null)
  const [estacionamientoEtiqueta, setEstacionamientoEtiqueta] = useState<string | null>(null)
  const [mapaOpen, setMapaOpen] = useState(false)

  const precioMensualAbonado = configuracion.find((c) => c.tipo_usuario === 'abonado')?.precio_hora ?? 0
  const requierePlaza = plazas.length > 0

  useEffect(() => {
    getEstacionamientos().then(setPlazas)
  }, [])

  const cargarResidentes = async () => {
    const list = await getPlacasResidentes()
    setPlacasResidentes(list)
  }
  const cargarAbonados = async () => {
    const list = await getPlacasAbonados()
    setPlacasAbonados(list)
  }

  useEffect(() => {
    if (tipo === 'residente') cargarResidentes()
    if (tipo === 'abonado') cargarAbonados()
  }, [tipo])

  const residentesFiltrados = useMemo(() => {
    return placasResidentes.filter((r) => matchResidente(r, comboboxSearch))
  }, [placasResidentes, comboboxSearch])
  const abonadosFiltrados = useMemo(() => {
    return placasAbonados.filter((r) => matchResidente(r, comboboxSearch))
  }, [placasAbonados, comboboxSearch])

  const handleSeleccionarTipo = (t: 'visitante' | 'residente' | 'abonado') => {
    setTipo(t)
    setPaso('placa')
    setPlaca('')
    setEstacionamientoId(null)
    setEstacionamientoEtiqueta(null)
    setResidenteSeleccionado(null)
    setAbonadoSeleccionado(null)
    setNombreResidente('')
    setApellidoResidente('')
    setNumeroOficinaDep('')
    setTelefonoResidente('')
    setYaPagoMensualidad(false)
    setNumeroMesesAbono(1)
    setRefPagoAbono('')
    setCapturaPagoFile(null)
    setComboboxSearch('')
    setErrorMsg(null)
  }

  const handleSeleccionarAbonado = async (id: string) => {
    const yaActivo = await tieneEntradaActiva(id)
    if (yaActivo) {
      alert('Este vehículo ya tiene una entrada activa. No se puede duplicar la entrada.')
      return
    }
    setErrorMsg(null)
    setAbonadoSeleccionado(id)
    setPlaca('')
    setComboboxOpen(false)
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
    if (requierePlaza && !estacionamientoId) {
      setErrorMsg('Seleccione un estacionamiento libre en el mapa.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    const estId = estacionamientoId
    try {
      if (tipo === 'residente' && residenteSeleccionado) {
        await registrarEntrada('residente', null, residenteSeleccionado, undefined, undefined, estId)
      } else if (tipo === 'residente' && placa.trim()) {
        await registrarEntrada(
          'residente',
          placa.trim(),
          null,
          {
            nombre: nombreResidente.trim() || null,
            apellido: apellidoResidente.trim() || null,
            numero_oficina_dep: numeroOficinaDep.trim() || null,
            telefono_contacto: telefonoResidente.trim() || null,
          },
          undefined,
          estId
        )
      } else if (tipo === 'abonado' && abonadoSeleccionado) {
        await registrarEntrada('abonado', null, abonadoSeleccionado, undefined, undefined, estId)
      } else if (tipo === 'abonado' && placa.trim()) {
        let capturaDataUrl: string | null = null
        if (capturaPagoFile) {
          capturaDataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.onerror = () => reject(new Error('Error al leer la imagen'))
            r.readAsDataURL(capturaPagoFile)
          })
        }
        await registrarEntrada(
          'abonado',
          placa.trim(),
          null,
          {
            nombre: nombreResidente.trim() || null,
            apellido: apellidoResidente.trim() || null,
            numero_oficina_dep: numeroOficinaDep.trim() || null,
            telefono_contacto: telefonoResidente.trim() || null,
          },
          {
            nombre: nombreResidente.trim() || null,
            apellido: apellidoResidente.trim() || null,
            numero_oficina_dep: numeroOficinaDep.trim() || null,
            telefono_contacto: telefonoResidente.trim() || null,
            yaPagoMensualidad,
            numeroMeses: yaPagoMensualidad ? numeroMesesAbono : undefined,
            refPagoAbono: refPagoAbono.trim() || null,
            capturaPagoAbono: capturaDataUrl,
          },
          estId
        )
      } else {
        await registrarEntrada(tipo!, placa.trim() || null, null, undefined, undefined, estId)
      }
      setPaso('tipo')
      setTipo(null)
      setPlaca('')
      setResidenteSeleccionado(null)
      setAbonadoSeleccionado(null)
      setNombreResidente('')
      setApellidoResidente('')
      setNumeroOficinaDep('')
      setTelefonoResidente('')
      setYaPagoMensualidad(false)
      setNumeroMesesAbono(1)
      setRefPagoAbono('')
      setCapturaPagoFile(null)
      setComboboxSearch('')
      setEstacionamientoId(null)
      setEstacionamientoEtiqueta(null)
      onRegistered()
    } catch (error) {
      console.error('Error registering entry:', error)
      setErrorMsg(
        error instanceof Error ? error.message : 'No se pudo registrar la entrada. Verifique los datos e inténtelo nuevamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setPaso('tipo')
    setTipo(null)
    setPlaca('')
    setResidenteSeleccionado(null)
    setAbonadoSeleccionado(null)
    setNombreResidente('')
    setApellidoResidente('')
    setNumeroOficinaDep('')
    setTelefonoResidente('')
    setYaPagoMensualidad(false)
    setNumeroMesesAbono(1)
    setRefPagoAbono('')
    setCapturaPagoFile(null)
    setComboboxSearch('')
    setEstacionamientoId(null)
    setEstacionamientoEtiqueta(null)
    setErrorMsg(null)
  }

  const plazaOk = !requierePlaza || !!estacionamientoId
  const puedeRegistrar =
    plazaOk &&
    (tipo === 'visitante'
      ? true
      : tipo === 'residente'
        ? residenteSeleccionado !== null || placa.trim().length > 0
        : tipo === 'abonado'
          ? abonadoSeleccionado !== null || placa.trim().length > 0
          : false)

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

  const abonadoLabel = abonadoSeleccionado
    ? (() => {
        const r = placasAbonados.find((x) => x.id === abonadoSeleccionado)
        if (!r) return 'Seleccionar abonado'
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
            <Button
              size="lg"
              className="flex-1 min-h-[80px] sm:h-24 flex flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
              onClick={() => handleSeleccionarTipo('visitante')}
            >
              <Car className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-sm font-medium">Visitante</span>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 min-h-[80px] sm:h-24 flex flex-col gap-2 min-w-[120px]"
              onClick={() => handleSeleccionarTipo('residente')}
            >
              <User className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-sm font-medium">Residente</span>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="flex-1 min-h-[80px] sm:h-24 flex flex-col gap-2 min-w-[120px]"
              onClick={() => handleSeleccionarTipo('abonado')}
            >
              <CalendarCheck className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="text-sm font-medium">Abonado</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {tipo === 'visitante'
                ? 'Ingrese la placa del visitante (opcional).'
                : tipo === 'abonado'
                  ? 'Busque una placa ya registrada como abonado o ingrese una nueva. El mes corre desde el primer día de registro (pago por mes adelantado).'
                  : 'Busque por placa o apellido una placa ya registrada o ingrese una nueva con nombre y apellido.'}
            </p>

            {requierePlaza && (
              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                <Label>Estacionamiento</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setMapaOpen(true)}>
                    {estacionamientoEtiqueta ? `Plaza: ${estacionamientoEtiqueta}` : 'Ver mapa y elegir plaza'}
                  </Button>
                  {estacionamientoEtiqueta && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEstacionamientoId(null)
                        setEstacionamientoEtiqueta(null)
                      }}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {tipo === 'abonado' && (
              <div className="space-y-2">
                <Label>Placa ya registrada (abonado)</Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {abonadoLabel}
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
                        <CommandEmpty>Ningún abonado coincide.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="nueva"
                            onSelect={() => {
                              setAbonadoSeleccionado(null)
                              setComboboxOpen(false)
                            }}
                          >
                            <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
                              <Check className={abonadoSeleccionado === null ? 'opacity-100' : 'opacity-0'} />
                            </span>
                            Nueva placa (registrar abajo)
                          </CommandItem>
                          {abonadosFiltrados.map((r) => (
                            <CommandItem
                              key={r.id}
                              value={r.id}
                              onSelect={() => handleSeleccionarAbonado(r.id)}
                            >
                              <span className="mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
                                <Check className={abonadoSeleccionado === r.id ? 'opacity-100' : 'opacity-0'} />
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

            {(tipo === 'visitante' || (tipo === 'residente' && residenteSeleccionado === null) || (tipo === 'abonado' && abonadoSeleccionado === null)) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="placa">
                    {tipo === 'visitante' ? 'Placa (opcional)' : 'Placa'}
                  </Label>
                  <Input
                    id="placa"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC-123"
                    className="font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleRegistrar()}
                  />
                </div>
                {(tipo === 'residente' || tipo === 'abonado') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="nombre-res">Nombre</Label>
                      <Input
                        id="nombre-res"
                        value={nombreResidente}
                        onChange={(e) => setNombreResidente(e.target.value)}
                        placeholder={tipo === 'abonado' ? 'Nombre del abonado' : 'Nombre del residente'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido-res">Apellido</Label>
                      <Input
                        id="apellido-res"
                        value={apellidoResidente}
                        onChange={(e) => setApellidoResidente(e.target.value)}
                        placeholder={tipo === 'abonado' ? 'Apellido del abonado' : 'Apellido del residente'}
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
                    {tipo === 'abonado' && (
                      <>
                        <div className="space-y-2 sm:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ya-pago-mensualidad"
                            checked={yaPagoMensualidad}
                            onChange={(e) => setYaPagoMensualidad(e.target.checked)}
                            className="rounded border-border"
                          />
                          <Label htmlFor="ya-pago-mensualidad" className="font-normal cursor-pointer">
                            Ya pagó la mensualidad (seleccione opción abajo)
                          </Label>
                        </div>
                        {yaPagoMensualidad && (
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Precio mensual</Label>
                            <Select value={String(numeroMesesAbono)} onValueChange={(v) => setNumeroMesesAbono(Number(v))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map((n) => {
                                  const total = calcularTotalAbonado(precioMensualAbonado, n)
                                  return (
                                    <SelectItem key={n} value={String(n)}>
                                      {n} {n === 1 ? 'mes' : 'meses'} — {formatCurrency(total)}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="ref-pago-abono">Nº operación Yape / Transferencia (opcional)</Label>
                          <Input
                            id="ref-pago-abono"
                            value={refPagoAbono}
                            onChange={(e) => setRefPagoAbono(e.target.value)}
                            placeholder="Ej. 123456789"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="captura-pago">Captura del pago (opcional)</Label>
                          <Input
                            id="captura-pago"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCapturaPagoFile(e.target.files?.[0] ?? null)}
                            className="cursor-pointer"
                          />
                          {capturaPagoFile && (
                            <p className="text-xs text-muted-foreground">{capturaPagoFile.name}</p>
                          )}
                        </div>
                      </>
                    )}
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
      <EstacionamientoMapaDialog
        open={mapaOpen}
        onOpenChange={setMapaOpen}
        seleccionActual={estacionamientoId}
        onSeleccionar={(id, etiqueta) => {
          setEstacionamientoId(id)
          setEstacionamientoEtiqueta(etiqueta)
          setMapaOpen(false)
        }}
      />
    </Card>
  )
}
